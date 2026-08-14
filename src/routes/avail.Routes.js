import express from "express";
import { addAvailability, delAvailability, getAvailability, getSlots, slotsGeneration, updAvailability } from "../controllers/avail.controller.js";
import { Authentication, authorize } from "../middlewares/authenticator.js";
import { tenant } from "../middlewares/tenant.js";
const availRouter = express.Router()

availRouter.get("/slots",Authentication,authorize('staff','customer','owner'),tenant,getSlots)
availRouter.post("/",Authentication,authorize('staff','owner'),tenant,addAvailability)
availRouter.get("/:staffId",Authentication,authorize('customer','staff'),tenant,getAvailability)
availRouter.patch("/:staffId",Authentication,authorize('staff','owner'),tenant,updAvailability)
availRouter.delete("/:staffId",Authentication,authorize('staff','owner'),tenant,delAvailability)
availRouter.post("/generate-slots",Authentication,authorize('staff','owner'),tenant,slotsGeneration)

export default availRouter;