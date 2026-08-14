import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const userSchema = new Schema({
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
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email address"]
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ["owner", "staff", "customer"],
        required: true,
        default: "customer"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.index({ orgId: 1, email: 1 }, { unique: true });

userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = function (plainPassword) {
    return bcrypt.hash(plainPassword, 12);
};

export const User = mongoose.model("user", userSchema);
