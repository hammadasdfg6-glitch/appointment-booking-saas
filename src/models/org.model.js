import mongoose from "mongoose";
import { User } from "./user.model.js";

const { Schema } = mongoose;

const orgSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        minlength: [1, "Name can't be empty!"],
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[a-zA-Z0-9-]+$/,
            "Only letters, numbers, and hyphens are allowed."
        ]
    },
    timezone: {
        type: String,
        default: "UTC",
        validate: {
            validator: function (value) {
                try {
                    Intl.DateTimeFormat(undefined, { timeZone: value });
                    return true;
                } catch (err) {
                    return false;
                }
            },
            message: "Invalid IANA timezone string."
        }
    },
    plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Org = mongoose.model("org", orgSchema);
