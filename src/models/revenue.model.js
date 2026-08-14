import mongoose from "mongoose";

const { Schema } = mongoose;

const revenueSchema = new Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "org",
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
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
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
        required: false 
    },
    stripeSessionId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    status: {
        type: String,
        enum: ["paid", "failed", "refunded"],
        default: "paid"
    },
    date: {
        type: String,
        required: true
    }
}, { timestamps: true });

revenueSchema.index({ orgId: 1, date: 1 });

export const Revenue = mongoose.model("revenues", revenueSchema);
