import mongoose from "mongoose";
import AppError from "../utils/appError.js";

const { Schema } = mongoose;

const bookingSchema = new Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "org",
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services",
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "slots",
        required: true
    },
    status: {
        type: String,
        enum: ["cancelled", "confirmed", "pending", "completed"],
        default: "pending"
    },
    price: {
        type: Number,
        required: true
    },
    startAt: {
        type: String,
        required: true
    },
    endAt: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    stripeSessionId: {
        type: String,
        default: null
    }
});

bookingSchema.pre("validate", function (next) {
    if (this.startAt >= this.endAt) {
        return next(new AppError('Startat must be smaller than start end ','Bad Request',400));
    }
});

bookingSchema.index({ orgId: 1, staffId: 1, startAt: 1, endAt: 1 });

export const Booking = mongoose.model("bookings", bookingSchema);
