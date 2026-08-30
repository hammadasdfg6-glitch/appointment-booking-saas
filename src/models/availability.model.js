import mongoose from "mongoose";

const { Schema } = mongoose;
const availSchema = new Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "org",
        required: [true, "Organization is required"]
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Staff ID is required"]
    },
    dayOfWeek: {
        type: Number,
        required: [true, "Day of week is required"],
        min: [0, "can't be less than 0"],
        max: [6, "Can't be greater than 6"]
    },
    startTime: {
        type: String,
        required: [true, "Start time is required"],
        match: [
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Start time must be in HH:mm 24-hour format (e.g. 09:30 or 18:45)."
        ]
    },
    endTime: {
        type: String,
        required: [true, "End time is required"],
        match: [
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "End time must be in HH:mm 24-hour format (e.g. 09:30 or 18:45)."
        ]
    }
});

availSchema.pre("validate", function () {
    if (this.startTime >= this.endTime) {
        throw new Error("startTime must be before endTime");
    }
});

availSchema.index(
    { orgId: 1, staffId: 1, dayOfWeek: 1 },
    { unique: true }
);

const Availability = mongoose.model("availability", availSchema);
export default Availability