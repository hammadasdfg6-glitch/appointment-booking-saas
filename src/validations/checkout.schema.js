import Joi from "joi"

export const checkoutSessionSchema = Joi.object({
    serviceId: Joi.string().hex().length(24).required(),
    staffId: Joi.string().hex().length(24).required(),
    slotId: Joi.string().required(),
    startAt: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    date: Joi.string().isoDate().required()
})
