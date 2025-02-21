import Joi from "joi";

export const productDetailValid = Joi.object({
  productDetails: Joi.array()
    .items(
      Joi.object({
        quantity: Joi.number().required(),
        price: Joi.number().required(),
        importPrice: Joi.number().required(),
        promotionalPrice: Joi.number().required(),
        product: Joi.string().required(),
        sizes: Joi.string().required(),
      })
    )
    .required(),
});
