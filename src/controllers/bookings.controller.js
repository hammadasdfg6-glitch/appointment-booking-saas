import { Booking } from "../models/booking.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { Service } from "../models/service.model.js";
import { User } from "../models/user.model.js";
import { Slots } from "../models/slots.model.js";
import { timeToMinutes, minutesToTime } from "../utils/timeUtilis.js";
import redis from "../config/redis.js";
import { emailJob } from "../queues/emailQueue.js";

export const createBooking = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError("Data is missing", "Body data is missing", 400));
  }

  const orgId = req.orgId;
  let { customerId, serviceId, staffId, startAt, date } = req.body;
  if (req.user.role === "customer") {
    customerId = req.user._id;
  }

  const service = await Service.findOne({
    _id: serviceId,
    orgId,
    active: true,
  });

  if (null === service) {
    return next(new AppError("Service Not found", "Not Found", 404));
  }

  const price = service.price;

  const staff = await User.findOne({ _id: staffId });
  if ("staff" !== staff.role) {
    return next(new AppError("Enter a valid staff Id", "Not Found", 404));
  }

  const dateNow = Date.now();

  // Checking if booking time is not in past
  const bookingDateTime = new Date(`${date}T${startAt}:00`).getTime();
  if (bookingDateTime < dateNow) {
    return next(new AppError("Date cannot be in past", "Bad Request", 400));
  }

  const endAt = minutesToTime(timeToMinutes(startAt) + service.durationMinutes);

  const chkslot = await Slots.findOne({
    staffId: staffId,
    date: new Date(date),
  });

  if (null === chkslot) {
    return next(new AppError("Slot is not Available", "Not Found", 404));
  }

  const slot = chkslot.slots.find((item) => {
    // Checking if slot is available
    if (
      timeToMinutes(item.startTime) >= timeToMinutes(startAt) &&
      timeToMinutes(item.endTime) >= timeToMinutes(endAt) &&
      "available" === item.status
    ) {
      return item;
    }
  });

  if (undefined === slot) {
    return next(new AppError("Slot not Available", "Not Found", 404));
  }

  slot.status = "booked";
  const slotId = slot._id;
  const status = "confirmed";

  // After booking locking a slot  to prevent overiding
  chkslot.slots.forEach((item) => {
    if (
      timeToMinutes(item.startTime) < timeToMinutes(slot.endTime) &&
      timeToMinutes(item.endTime) > timeToMinutes(slot.startTime) &&
      "available" === item.status
    ) {
      item.status = "locked";
      return item;
    }
  });

  const booking = new Booking({
    orgId,
    staffId,
    customerId,
    serviceId,
    slotId,
    status,
    date,
    price,
    startAt: slot.startTime,
    endAt: slot.endTime,
  });
  await booking.save();
  await chkslot.save();

  // Deleting old booking cached data
  const keys = await redis.keys("bookings:*");
  if (0 < keys.length) await redis.del(keys);
  const bookingKeys = await redis.keys("booking:*");
  if (0 < bookingKeys.length) await redis.del(bookingKeys);

  // Sends Booking Confirmation Email
  const customer = await User.findOne({ _id: customerId }, "email");
  await emailJob(customer.email, "Confirmed", "Your Booking is Ready!");
  await emailJob(
    staff.email,
    "New Booking",
    "You have a new appointment scheduled!",
  );

  // Calculate delay for 24-hour reminder
  const bookingDateTime1 = new Date(`${date}T${slot.startTime}:00`);
  const reminderTime = bookingDateTime1.getTime() - 24 * 60 * 60 * 1000;
  const delay = reminderTime - Date.now();

  // Sends Booking Reminder Email
  if (0 < delay) {
    await emailJob(
      customer.email,
      "Reminder: Upcoming Appointment",
      `Don't forget! Your appointment is tomorrow at ${slot.startTime}.`,
      { delay },
    );
  }

  return res.status(201).json({
    success: true,
    message: "Booking Added",
    booking,
  });
});

export const getBookings = catchAsync(async (req, res, next) => {
  const { staffId, customerId, date, status, _id } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const dbQuery = { orgId: req.orgId };

  if ("customer" === req.user.role) {
    dbQuery.customerId = req.user._id;
  } else if ("staff" === req.user.role) {
    dbQuery.staffId = req.user._id;
    if (customerId) dbQuery.customerId = customerId;
  } else if ("owner" === req.user.role) {
    if (customerId) dbQuery.customerId = customerId;
    if (staffId) dbQuery.staffId = staffId;
  }
  if (status) dbQuery.status = status;
  if (date) dbQuery.date = date;
  if (_id) dbQuery._id = _id;

  // Each filter has its own Expiry Time
  let expiryTime = 10;
  if (_id) expiryTime = 10;
  else if (date) expiryTime = 10;
  else if (staffId) expiryTime = 10;
  else if (customerId || status) expiryTime = 10;

  const cacheKey = `bookings:${JSON.stringify(dbQuery)}:page:${page}:limit:${limit}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  console.log("Reached pahse 1")

  const bookings = await Booking.find(dbQuery)
    .populate("customerId", "name email")
    .populate("serviceId", "name price")
    .populate("staffId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);


    console.log(bookings)
  const total = await Booking.countDocuments(dbQuery);

  if (0 === bookings.length) {
    return next(new AppError("No Bookings Found", "Not Found", 404));
  }

  const responseData = {
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    bookings,
  };

  await redis.set(
    cacheKey,
    JSON.stringify(responseData),
    "EX",
    expiryTime + (Math.floor(Math.random() * 10) + 1),
  );

  return res.status(200).json(responseData);
});

export const deleteBooking = catchAsync(async (req, res, next) => {
  const bookingId = req.params.id;
  if (!bookingId) {
    return next(new AppError("Data is missing", "Params is missing", 400));
  }

  const booking = await Booking.findOne({ _id: bookingId, orgId: req.orgId });

  if (null === booking) {
    return next(new AppError("Bookings Not Found", "Not Found", 404));
  }

  if (
    req.user.role === "customer" &&
    booking.customerId.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You can only cancel your own bookings", "Forbidden", 403),
    );
  }

  const chkslot = await Slots.findOne({ staffId: booking.staffId });

  if (null === chkslot) {
    return next(new AppError("Slot not found", "Not found", 404));
  }

  for (let item of chkslot.slots) {
    if (
      timeToMinutes(item.startTime) < timeToMinutes(booking.endAt) &&
      timeToMinutes(item.endTime) > timeToMinutes(booking.startAt) &&
      "locked" === item.status
    ) {
      item.status = "available";
      break;
    }
  }

  chkslot.slots.forEach((item) => {
    if (item._id.equals(booking.slotId)) {
      item.status = "available";
    }
  });

  booking.status = "cancelled";

  await chkslot.save();
  await booking.save();

  // Delete all booking cache entries
  const keys = await redis.keys("bookings:*");
  if (0 < keys.length) await redis.del(keys);
  const bookingKeys = await redis.keys("booking:*");
  if (0 < bookingKeys.length) await redis.del(bookingKeys);

  const customer = await User.findOne({ _id: booking.customerId }, "email");
  const staff = await User.findOne({ _id: booking.staffId }, "email");

  if (customer)
    await emailJob(
      customer.email,
      "Booking Cancelled",
      "Your booking has been cancelled.",
    );
  if (staff)
    await emailJob(
      staff.email,
      "Booking Cancelled",
      "An appointment has been cancelled.",
    );

  return res.status(200).json({
    success: true,
    message: "Booking Cancelled Successfully ;)",
  });
});

export const setStatus = catchAsync(async (req, res, next) => {
  const bookingId = req.params.id;
  if (!bookingId) {
    return next(new AppError("Data is missing", "Params is missing", 400));
  }

  const booking = await Booking.findOne({ _id: bookingId, orgId: req.orgId });

  if (null === booking) {
    return next(new AppError("Bookings Not Found", "Not Found", 404));
  }

  const { status } = req.body;

  booking.status = status;

  await booking.save();

  // Delete all booking cache entries
  const keys = await redis.keys("bookings:*");
  if (0 < keys.length) await redis.del(keys);
  const bookingKeys = await redis.keys("booking:*");
  if (0 < bookingKeys.length) await redis.del(bookingKeys);

  const customer = await User.findOne({ _id: booking.customerId }, "email");
  if (customer)
    await emailJob(
      customer.email,
      "Booking Status Update",
      `Your booking status is now: ${status}`,
    );

  return res.status(201).json({
    success: true,
    message: "Booking Updated Successfully!",
  });
});
