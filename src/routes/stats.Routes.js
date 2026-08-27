import express from "express";
import { totalStats, getAdvancedStats, todayStaffStats, weeklyStaffStats, monthlyStaffStats } from "../controllers/stats.controller.js";
import { Authentication, authorize } from "../middlewares/authenticator.js";
import { tenant } from "../middlewares/tenant.js";

const statsRouter = express.Router()

statsRouter.get("/", Authentication, authorize('owner'), tenant, totalStats)
statsRouter.get("/advanced", Authentication, authorize('owner'), tenant, getAdvancedStats)
statsRouter.get('/todayStats', Authentication, authorize('staff', 'owner'), tenant, todayStaffStats)
statsRouter.get('/weeklyStats', Authentication, authorize('staff', 'owner'), tenant, weeklyStaffStats)
statsRouter.get('/monthlyStats', Authentication, authorize('staff', 'owner'), tenant, monthlyStaffStats)

export default statsRouter
