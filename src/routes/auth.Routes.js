import express from "express"
import { Login, registerCustomer, registerOrg, register, refresh, logout, forgotPassword, resetPassword, getStaff, deleteStaff, getProfile, updateProfile } from "../controllers/auth.controller.js"
import { Authentication, authorize } from "../middlewares/authenticator.js";
import { tenant } from "../middlewares/tenant.js";
import { rateLimiter, refreshRateLimiter } from "../middlewares/ratelimiter.js";
import { validate } from "../middlewares/validator.js"
import { loginSchema, registerOrgSchema, registerUserSchema, registerCustomerSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/auth.schema.js"
const authRouter = express.Router()

authRouter.get("/me", Authentication, getProfile)
authRouter.patch("/me", Authentication, updateProfile)

authRouter.post("/login", validate(loginSchema), Login)
authRouter.post("/register", validate(registerCustomerSchema), registerCustomer)
authRouter.get("/staff", Authentication, tenant, getStaff)
authRouter.delete("/staff/:staffId", Authentication, authorize('owner'), tenant, deleteStaff)
authRouter.post("/orgs/:orgId/staff", Authentication, authorize('owner'), validate(registerUserSchema), tenant, register)
authRouter.post("/orgs", validate(registerOrgSchema), registerOrg)
authRouter.post("/orgs/:orgId/customers", validate(registerUserSchema), registerCustomer)
authRouter.post("/refresh", refresh)
authRouter.post("/logout", logout)
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword)
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword)
export default authRouter