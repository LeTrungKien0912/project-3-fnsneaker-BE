import Joi from "joi";

export const productValid = Joi.object({
    name: Joi.string().required().min(6),
    description: Joi.string(),
    categoryId: Joi.string().required(),
    status: Joi.string().required(),
});
