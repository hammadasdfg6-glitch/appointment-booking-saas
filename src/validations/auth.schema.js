import Joi from "joi"

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    passwordHash: Joi.string().min(4).required()
})

export const registerOrgSchema = Joi.object({
    name: Joi.string().min(1).required(),
    slug: Joi.string().pattern(/^[a-zA-Z0-9-]+$/).required(),
    timezone: Joi.string().optional(),
    plan: Joi.string().valid('free', 'pro', 'enterprise').optional(),
    ownerName: Joi.string().required(),
    ownerEmail: Joi.string().email().required(),
    password: Joi.string().min(4).required()
})

export const registerUserSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    passwordHash: Joi.string().min(4).required(),
    role: Joi.string().valid('owner', 'staff', 'customer').optional()
})

export const registerCustomerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    passwordHash: Joi.string().min(4).required(),
    orgName: Joi.string().required(),
    role: Joi.string().valid('customer').optional()
})

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
})

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(4).required()
})

export const updateProfileSchema = Joi.object({
    name: Joi.string().min(1).optional(),
    email: Joi.string().email().optional(),
    oldPassword: Joi.string().min(4).optional(),
    newPassword: Joi.string().min(4).optional()
})