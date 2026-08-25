import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Org } from "../models/org.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { emailJob } from "../queues/emailQueue.js";
import redis from "../config/redis.js";
import crypto from "crypto";

const getCookieOptions = (maxAge) => {
  return {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    ...(maxAge ? { maxAge } : {}),
  };
};

export const getStaff = catchAsync(async (req, res, next) => {

  const orgId = req.orgId;
  
  const staff = await User.find({orgId,role: { $in: ["staff", "owner"] },}).select("-passwordHash");

  return res.status(200).json({ success: true, staff });
});

export const deleteStaff = catchAsync(async (req, res, next) => {

  const orgId = req.orgId;
  const { staffId } = req.params;

  if (!staffId) {
    return next(new AppError("Staff ID is required", "Bad Request", 400));
  }

  const staffMember = await User.findOne({ _id: staffId, orgId });

  if (!staffMember) {
    return next(new AppError("Staff member not found or does not belong to your organization","Not Found",404,),);
  }

  if (staffMember.role === "owner") {
    return next(new AppError("Cannot delete the organization owner", "Forbidden", 403),);
  }

  await User.findByIdAndDelete(staffId);

  return res.status(200).json({
    success: true,
    message: "Staff member removed successfully",
  });
});

export const registerOrg = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError("Data is missing", "Body is missing", 400));
  }

  const { name, slug, timezone, plan, ownerName, ownerEmail, password } =
    req.body;

  const org = await new Org({ name, slug, timezone, plan });
  await org.save();

  const passwordHash = await User.hashPassword(password);
  const user = await new User({
    orgId: org._id,
    name: ownerName,
    email: ownerEmail,
    passwordHash,
    role: "owner",
  });
  await user.save();

  const _id = user._id;
  const orgId = user.orgId;
  const role = user.role;

  const accessToken = await jwt.sign(
    { orgId, _id, name: user.name, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = await jwt.sign({ _id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(3 * 60 * 60 * 1000));

  await redis.set(`refreshToken:${_id}`, refreshToken, "EX", 3 * 60 * 60);

  return res.status(201).json({
    success: true,
    message: "Successfully Created Organization and Owner Account",
  });
});

export const register = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError("Data is missing", "Body Data is missing", 400));
  }

  const org = await Org.findOne({ _id: req.orgId });
  if (null === org) {
    return next(new AppError("Org not found", "Not Found", 404));
  }

  req.body.orgId = req.orgId;
  req.body.passwordHash = await User.hashPassword(req.body.passwordHash);

  const user = await new User(req.body);
  await user.save();

  await emailJob(
    req.body.email,
    "Welcome to the Team!",
    "Your staff account is ready.",
  );

  return res.status(201).json({
    success: true,
    message: "Registeration Successfull!",
  });
});

export const registerCustomer = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError("Data is missing", "Body is missing", 400));
  }

  const { orgName, name, email, passwordHash, role } = req.body;

  const targetOrg = req.params?.orgId || orgName;
  const orgQueries = [{ name: targetOrg }, { slug: targetOrg }];
  if (targetOrg && mongoose.Types.ObjectId.isValid(targetOrg)) {
    orgQueries.push({ _id: targetOrg });
  }

  const org = await Org.findOne({ $or: orgQueries });
  if (!org) {
    return next(new AppError("Organization not found", "Not Found", 404));
  }

  const hashedPassword = await User.hashPassword(passwordHash);

  const user = await new User({
    name,
    email,
    passwordHash: hashedPassword,
    orgId: org._id,
    role: role || 'customer'
  });
  
  await user.save();

  await emailJob(email, "Welcome!", "Thanks for joining!");

  const _id = user._id;
  const orgId = user.orgId;
  const userRole = user.role;

  const accessToken = await jwt.sign(
    { orgId, _id, name: user.name, email: user.email, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  
  const refreshToken = await jwt.sign({ _id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.cookie("token", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(3 * 60 * 60 * 1000));

  await redis.set(`refreshToken:${_id}`, refreshToken, "EX", 3 * 60 * 60);

  return res.status(201).json({
    success: true,
    message: "Registration Successful!",
    role: userRole
  });
});

export const Login = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+passwordHash",
  );
  if (null === user) {
    return next(new AppError("Invalid Email", "Not Found", 404));
  }

  const passcomp = await user.comparePassword(req.body.passwordHash);
  if (false === passcomp) {
    return next(new AppError("Invalid Password", "Not found", 404));
  }

  const _id = user._id;
  const orgId = user.orgId;
  const name = user.name;
  const email = user.email;
  const role = user.role;

  const accessToken = await jwt.sign(
    { orgId, _id, name, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = await jwt.sign({ _id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(3 * 60 * 60 * 1000));

  await redis.set(`refreshToken:${_id}`, refreshToken, "EX", 3 * 60 * 60);

  return res.status(200).json({
    success: true,
    message: "logged in......",
    role: role
  });
});

export const refresh = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return next(new AppError("No refresh token provided", "Unauthorized", 401));
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  const storedToken = await redis.get(`refreshToken:${decoded._id}`);

  if (!storedToken || storedToken !== refreshToken) {
    return next(new AppError("Invalid refresh token", "Unauthorized", 401));
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    return next(new AppError("User no longer exists", "Unauthorized", 401));
  }

  const { _id, orgId, name, email, role } = user;
  const accessToken = await jwt.sign(
    { orgId, _id, name, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  res.cookie("token", accessToken, getCookieOptions(15 * 60 * 1000));

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
  });
});

export const logout = catchAsync(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: true,
      });
      await redis.del(`refreshToken:${decoded._id}`);
    } catch (e) {
      next(e);
    }
  }

  res.clearCookie("token", getCookieOptions());
  res.clearCookie("refreshToken", getCookieOptions());

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(new AppError("Email is required", "Bad Request", 400));

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If that email exists, a reset link was sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await redis.set(
    `passwordReset:${hashedToken}`,
    user._id.toString(),
    "EX",
    15 * 60,
  );

  const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
  await emailJob(
    user.email,
    "Password Reset Request",
    `Click here to reset your password: ${resetURL}`,
  );

  return res.status(200).json({
    success: true,
    message: "If that email exists, a reset link was sent.",
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  if (!token || !password)
    return next(
      new AppError("Token and password are required", "Bad Request", 400),
    );

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const userId = await redis.get(`passwordReset:${hashedToken}`);

  if (!userId) {
    return next(
      new AppError("Token is invalid or has expired", "Bad Request", 400),
    );
  }

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    return next(new AppError("User not found", "Not Found", 404));
  }

  user.passwordHash = await User.hashPassword(password);
  await user.save();

  await redis.del(`passwordReset:${hashedToken}`);

  return res.status(200).json({
    success: true,
    message: "Password reset successfully! You can now login.",
  });
});

export const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", "Not Found", 404));
  }

  return res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    },
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, email, oldPassword, newPassword } = req.body || {};

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", "Not Found", 404));
  }

  if (name && typeof name === "string") {
    user.name = name.trim();
  }

  if (email && typeof email === "string") {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== user.email) {
      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return next(
          new AppError("Email is already in use by another account", "Conflict", 409)
        );
      }
      user.email = cleanEmail;
    }
  }

  if (newPassword) {
    if (!oldPassword) {
      return next(
        new AppError("Current password is required to set a new password", "Bad Request", 400)
      );
    }
    if (newPassword.length < 4) {
      return next(
        new AppError("New password must be at least 4 characters", "Bad Request", 400)
      );
    }
    const verifyPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!verifyPassword) {
      return next(new AppError("Incorrect current password", "Bad Request", 400));
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    },
  });
});
