import express from "express"
import { createCheckoutSession, stripeWebhook, confirmCheckout } from "../controllers/checkout.controller.js"
import { Authentication, authorize } from "../middlewares/authenticator.js"
import { tenant } from "../middlewares/tenant.js"
import { rateLimiter } from "../middlewares/ratelimiter.js"
import { validate } from "../middlewares/validator.js"
import { checkoutSessionSchema } from "../validations/checkout.schema.js"

const router = express.Router()

router.post('/session', Authentication, authorize('customer', 'owner'), tenant, rateLimiter, validate(checkoutSessionSchema), createCheckoutSession)
router.get('/confirm', Authentication, tenant, confirmCheckout)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

export default router
