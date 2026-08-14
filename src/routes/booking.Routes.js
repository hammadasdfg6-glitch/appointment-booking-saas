import express from "express";
import { createBooking, deleteBooking, getBookings, setStatus } from "../controllers/bookings.controller.js";
import { Authentication, authorize } from "../middlewares/authenticator.js";
import { tenant } from "../middlewares/tenant.js";
import { refreshRateLimiter } from "../middlewares/ratelimiter.js";

const bookingRouter = express.Router()

bookingRouter.post("/", Authentication, authorize('customer'), tenant, createBooking);
bookingRouter.get("/", refreshRateLimiter, Authentication, tenant, getBookings);
bookingRouter.delete("/:id", Authentication, authorize('staff', 'owner', 'customer'), tenant, deleteBooking);
bookingRouter.patch("/:id/status", Authentication, authorize('staff', 'owner'), tenant, setStatus);

export default bookingRouter;