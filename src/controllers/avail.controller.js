import Availability from "../models/availability.model.js";
import { User } from "../models/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { Slots } from "../models/slots.model.js";
import {
  timeToMinutes,
  minutesToTime,
  formatDateString,
} from "../utils/timeUtilis.js";
import redis from "../config/redis.js";
export const addAvailability = catchAsync(async (req, res) => {
  try {
    req.body.orgId = req.user.orgId;
    req.body.staffId = req.user._id;

    const newAvailability = new Availability(req.body);

    const savedAvailability = await newAvailability.save();

    res.status(201).json({
      success: true,
      message: "Availability added successfully",
      data: savedAvailability,
    });
  } catch (error) {
    if (11000 === error.code) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `An entry for this Staff ID and Day of Week already exists.`,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Error adding availability",
    });
  }
});

export const getAvailability = catchAsync(async (req, res, next) => {
  if (!req.params.staffId) {
    return next(
      new AppError("Staff Id is missing", "parameters are missing", 400),
    );
  }

  const staffid = req.params.staffId;

  const staff = await User.findOne({ _id: staffid });
  if (null === staff) {
    return next(new AppError("Staff member not Found", "Not Found", 404));
  }

  if ("staff" !== staff.role) {
    return next(new AppError("Invalid staffId", "Bad Request", 400));
  }

  const avail = await Availability.findOne({ staffId: staffid });
  if (!avail) {
    return next(new AppError("Availiability Not Found", "Not Found", 404));
  }

  return res.status(200).json({
    success: true,
    availiability: avail,
  });
});

export const updAvailability = catchAsync(async (req, res, next) => {
  if (!req.params.staffId) {
    return next(
      new AppError("Staff Id not found", "parameters are missing", 400),
    );
  }

  const avail = await Availability.findOne({ staffId: req.params.staffId });
  if (!avail) {
    return next(new AppError("Availiabiity not Found", "Not Found", 404));
  }

  await Availability.findOneAndUpdate(
    { staffId: req.params.staffId },
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Successfully Updated Availabilty",
  });
});

export const delAvailability = catchAsync(async (req, res, next) => {
  if (!req.params.staffId) {
    return next(new AppError("Staff Id is missing", "Params is missing", 400));
  }

  const avail = await Availability.findOne({ staffId: req.params.staffId });

  if (null === avail) {
    return next(new AppError("Availability not found", "Not Found", 404));
  }

  await Availability.findOneAndDelete({ staffId: req.params.staffId });

  return res.status(200).json({
    success: true,
    message: "Availability Deleted Successfully",
  });
});

//Slots generation

export const slotsGeneration = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError("Data is missing", "Body is missing", 400));
  }

  let { staffId, date, duration } = req.body;
  if (!staffId && req.user && req.user.role === "staff") {
    staffId = req.user._id;
  }
  if (!duration) {
    duration = 30;
  }

  const dayOfWeek = new Date(date).getDay();

  let avail = await Availability.findOne({
    staffId,
    dayOfWeek,
  });

  if (!avail && dayOfWeek >= 1 && dayOfWeek <= 5) {
    const staffUser = await User.findById(staffId);
    if (staffUser) {
      avail = await Availability.create({
        orgId: staffUser.orgId,
        staffId,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      });
    }
  }

  if (!avail) {
    return res.status(404).json({
      success: false,
      message: "Not Availiable",
    });
  }

  const start = timeToMinutes(avail.startTime);
  const end = timeToMinutes(avail.endTime);

  const SLOT_INTERVAL = 60;
  const slots = [];

  for (
    let current = start;
    current + duration <= end;
    current += Math.max(duration, SLOT_INTERVAL)
  ) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + duration),
      status: "available",
    });
  }

  const slot = await Slots.findOneAndUpdate(
    { staffId, date: new Date(date) },
    { $set: { slots: slots } },
    { new: true, upsert: true, runValidators: true },
  );

  return res.status(201).json({
    success: true,
    message: "Slots Generated",
    slots: slot.slots,
  });
});

//Get Availiable Slots

export const getSlots = catchAsync(async (req, res, next) => {
  if (!req.query.staffId || !req.query.date) {
    return next(new AppError("Data is missing", "parameters are missing", 400));
  }

  const { staffId, date } = req.query;

  // HELPER: Checks Redis for any active holds (someone checking out) and removes them
  const filterHolds = async (slotsArray) => {
    if (slotsArray.length === 0) return [];
    const holdKeys = slotsArray.map((slot) => `hold:${slot._id}`);
    const holds = await redis.mget(holdKeys);
    // Keep the slot only if it has NO hold (is null)
    return slotsArray.filter((slot, idx) => holds[idx] === null);
  };

  const Slot = await Slots.findOne({
    staffId,
    date: new Date(date),
  });

  if (!Slot) {
    return next(new AppError("No Slots Available", "Not Found", 404));
  }

  let availslots = Slot.slots.filter((item) => item.status === "available");

  // THEN filter out active Holds before sending to the user
  availslots = await filterHolds(availslots);

  if (availslots.length === 0) {
    return next(new AppError("No Slots Available", "Not Found", 404));
  }
  const total = availslots.length;

  return res.status(200).json({
    success: true,
    message: "Feteched all Available Slots",
    total,
    slots: availslots,
  });
});
