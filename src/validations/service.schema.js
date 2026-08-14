import Joi from "joi"

export const serviceSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    durationMinutes: Joi.number().integer().min(1).max(60).required(),
    price: Joi.number().min(0).required(),
    active: Joi.boolean().optional()
})
