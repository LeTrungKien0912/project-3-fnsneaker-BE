// imageValid.js
import Joi from "joi";

export const imageValid = Joi.object({
  images: Joi.array().items(
    Joi.object({
      image: Joi.string().required(),
      productId: Joi.string().required(),
      type: Joi.string().valid("thumbnail", "gallery").required(),
    })
  ).required(),
});
