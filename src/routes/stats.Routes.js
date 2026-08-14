import express from "express";
import { totalStats, getAdvancedStats } from "../controllers/stats.controller.js";
import { Authentication, authorize } from "../middlewares/authenticator.js";
import { tenant } from "../middlewares/tenant.js";

const statsRouter = express.Router()

statsRouter.get("/",Authentication,authorize('owner'), tenant, totalStats)
statsRouter.get("/advanced",Authentication,authorize('owner'), tenant, getAdvancedStats)

export default statsRouter
