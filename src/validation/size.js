import Joi from "joi";

export const sizeValid = Joi.object({
  size: Joi.number().min(1).required(),
  slug: Joi.number().required().max(255),
});
