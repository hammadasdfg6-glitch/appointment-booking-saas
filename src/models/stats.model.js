import mongoose from "mongoose";

const { Schema } = mongoose;

const statsSchema = new Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "org",
        required: true
    },
    date: {
        type: String, 
        required: true
    },
    totalBookings: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

statsSchema.index({ orgId: 1, date: 1 }, { unique: true });

export const Stats = mongoose.model("stats", statsSchema);
