import Joi from "joi";

export const categoryValid = Joi.object({
    name: Joi.string().required().min(1),
    slug: Joi.string().required().min(1).max(255)
})