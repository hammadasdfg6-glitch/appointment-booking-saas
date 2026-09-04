import { Service } from "../models/service.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import redis from "../config/redis.js";

export const addService = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError("Data is missing", "Body is misssing", 404));
  }

  req.body.orgId = req.orgId;
  const service = await new Service(req.body);
  await service.save();

  // Delete all services cache so new service appears
  const keys = await redis.keys(`org:${req.orgId}:services:*`);
  if (0 < keys.length) await redis.del(keys);

  return res.status(201).json({
    success: true,
    message: "Service Created Successsfully!",
  });
});

export const dispServices = catchAsync(async (req, res, next) => {
  // Implemented Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const active = true;

  const cacheKey = `org:${req.orgId}:services:${active}:page:${page}:limit:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  const services = await Service.find({ active, orgId: req.orgId })
    .sort({ price: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Service.countDocuments({ active, orgId: req.orgId });
  if (0 === services.length) {
    return res.status(404).json({
      success: false,
      message: "No Services Found!",
    });
  }

  const responseData = {
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    services,
  };

  await redis.set(
    cacheKey,
    JSON.stringify(responseData),
    "EX",
    20 + (Math.floor(Math.random() * 10) + 1),
  );
  return res.status(200).json(responseData);
});

export const updServices = catchAsync(async (req, res, next) => {
  if (!req.params.name) {
    return next(new AppError("Data is missing", "parameters are missing", 400));
  }
  const service = await Service.findOne({
    name: req.params.name,
    orgId: req.orgId,
  });
  if (!service) {
    return next(new AppError("Service not found", "Not Found", 404));
  }

  await Service.findByIdAndUpdate({ _id: service._id }, req.body);

  // Delete all services cache
  const keys = await redis.keys(`org:${req.orgId}:services:*`);
  if (0 < keys.length) await redis.del(keys);

  return res.status(200).json({
    success: true,
    message: "Sucessfully Updated the Service",
  });
});

export const delServices = catchAsync(async (req, res, next) => {
  if (!req.params.name) {
    return next(new AppError("Data is misssing", "Params are missing", 400));
  }
  const service = await Service.findOne({
    name: req.params.name,
    orgId: req.orgId,
  });
  if (!service) {
    return next(new AppError("Service not found", "Not Found", 404));
  }

  await Service.findByIdAndUpdate({ _id: service._id }, { active: false });

  // Delete all services cache
  const keys = await redis.keys(`org:${req.orgId}:services:*`);
  if (0 < keys.length) await redis.del(keys);

  return res.status(200).json({
    success: true,
    message: "Sucessfully Deleted the Service",
  });
});
