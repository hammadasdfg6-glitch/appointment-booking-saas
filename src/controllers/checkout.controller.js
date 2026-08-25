import Stripe from "stripe";
import redis from "../config/redis.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { Service } from "../models/service.model.js";
import { Revenue } from "../models/revenue.model.js";
import { Stats } from "../models/stats.model.js";
import { Booking } from "../models/booking.model.js";
import { createBooking } from "./bookings.controller.js";
import { formatDateString } from "../utils/timeUtilis.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = catchAsync(async (req, res, next) => {
  const { serviceId, staffId, startAt, date } = req.body;
  const customerId = req.user._id;
  const orgId = req.orgId;
  const slotId = req.body.slotId;

  if (!slotId) {
    return next(
      new AppError("Slot ID is required to create a hold", "Bad Request", 400),
    );
  }

  const service = await Service.findOne({
    _id: serviceId,
    orgId,
    active: true,
  });
  if (!service) {
    return next(new AppError("Service Not found", "Not Found", 404));
  }

  // Created a Hold to a slot
  const holdKey = `hold:${slotId}`;
  await redis.set(holdKey, customerId.toString(), "EX", 120);

  // Created the Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/booking-cancelled`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: service.name,
            description: `Appointment on ${date} at ${startAt}`,
          },

          unit_amount: Math.round(service.price * 100),
        },
        quantity: 1,
      },
    ],

    // Storing Metadata so stripe can send it back to webhook
    metadata: {
      customerId: customerId.toString(),
      orgId: orgId.toString(),
      serviceId: serviceId.toString(),
      staffId: staffId.toString(),
      slotId: slotId.toString(),
      startAt,
      date,
    },
  });

  return res.status(200).json({
    success: true,
    url: session.url,
  });
});

// Shared idempotent helper to process a completed Stripe Checkout session
const processSuccessfulPayment = async (session) => {
  if (!session || !session.id) return null;

  // Check if booking already exists for this session
  const existingBooking = await Booking.findOne({
    stripeSessionId: session.id,
  });
  if (existingBooking) {
    return existingBooking;
  }

  // Atomic Redis Lock to prevent race condition between confirmCheckout & stripeWebhook
  const lockKey = `stripe_process_lock:${session.id}`;
  const acquired = await redis.set(lockKey, "processing", "EX", 120, "NX");
  if (!acquired) {
    // Another process is handling this, wait slightly and return existing booking
    await new Promise((resolve) => setTimeout(resolve, 600));
    return await Booking.findOne({ stripeSessionId: session.id });
  }

  try {
    const metadata = session.metadata;
    if (!metadata) return null;

    // Remove the Hold from Redis since they successfully paid
    if (metadata.slotId) {
      await redis.del(`hold:${metadata.slotId}`);
    }

    const mockReq = {
      body: {
        customerId: metadata.customerId,
        serviceId: metadata.serviceId,
        staffId: metadata.staffId,
        slotId: metadata.slotId,
        startAt: metadata.startAt,
        date: metadata.date,
        stripeSessionId: session.id,
      },
      user: { _id: metadata.customerId, role: "customer" },
      orgId: metadata.orgId,
    };

    let responseData = null;
    const mockRes = {
      status: function () {
        return this;
      },
      json: function (data) {
        responseData = data;
        return this;
      },
    };

    const mockNext = (err) => {
      if (err) {
        console.error("Payment Processing Booking Error:", err);
      }
    };

    await createBooking(mockReq, mockRes, mockNext);

    const bookingId = responseData?.booking?._id;
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        stripeSessionId: session.id,
      });
    }

    const amount = (session.amount_total || 0) / 100;

    const revenue = new Revenue({
      orgId: metadata.orgId,
      customerId: metadata.customerId,
      serviceId: metadata.serviceId,
      staffId: metadata.staffId,
      bookingId: bookingId || null,
      stripeSessionId: session.id,
      amount: amount,
      date: metadata.date,
    });
    await revenue.save();

    const dateStr = formatDateString(new Date());
    await Stats.findOneAndUpdate(
      { orgId: metadata.orgId, date: dateStr },
      { $inc: { totalBookings: 1, totalRevenue: amount } },
      { upsert: true, returnDocument: "after" },
    );

    return (
      responseData?.booking ||
      (await Booking.findOne({ stripeSessionId: session.id }))
    );
  } finally {
    await redis.del(lockKey);
  }
};

export const confirmCheckout = catchAsync(async (req, res, next) => {
  const { session_id } = req.query;

  if (!session_id) {
    return next(new AppError("Session ID is required", "Bad Request", 400));
  }

  // Retrieve the session from Stripe to verify payment
  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status !== "paid") {
    return next(new AppError("Payment not completed", "Bad Request", 400));
  }

  const booking = await processSuccessfulPayment(session);

  return res.status(200).json({
    success: true,
    message: "Booking confirmed",
    booking: booking || null,
  });
});

export const stripeWebhook = catchAsync(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different checkout events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await processSuccessfulPayment(session);
  } else if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    // Release the lock if user doesnt complete payment in required time
    const session = event.data.object;
    if (session.metadata?.slotId) {
      await redis.del(`hold:${session.metadata.slotId}`);
    }
  }

  res.status(200).json({ received: true });
});
