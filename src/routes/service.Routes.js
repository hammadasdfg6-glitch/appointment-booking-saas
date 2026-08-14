import { addService, delServices, dispServices, updServices } from "../controllers/service.controller.js";
import { Authentication, authorize } from "../middlewares/authenticator.js"
import { tenant } from "../middlewares/tenant.js"
import { validate } from "../middlewares/validator.js"
import { serviceSchema } from "../validations/service.schema.js"
import express from "express";


const serviceRouter = express.Router()

serviceRouter.post("/create", Authentication, authorize('owner'), validate(serviceSchema), tenant, addService)
serviceRouter.get("/", Authentication, tenant, dispServices)
serviceRouter.put("/:name", Authentication, authorize('owner'), validate(serviceSchema), tenant, updServices)
serviceRouter.delete("/:name", Authentication, authorize('owner'), tenant, delServices)

export default serviceRouter;