import mongoose from "mongoose";

const { Schema } = mongoose;

const serviceSchema = new Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "org",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    durationMinutes: {
        type: Number,
        required: [true, "Duration is required"],
        min: [5, "Duration must be at least 5 minutes"]
    },
    price: {
        type: Number,
        required: true,
        min: [0, "Price must be 0 or greater"]
    },
    bufferMinutes: {
        type: Number,
        default: 0,
        min: [0, "Buffer minutes must be 0 or greater"]
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    }
});

serviceSchema.index({ orgId: 1, active: 1 });

export const Service = mongoose.model("services", serviceSchema);
