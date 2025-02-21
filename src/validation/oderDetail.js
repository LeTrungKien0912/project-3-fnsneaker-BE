import Joi from "joi";
import mongoose from "mongoose";

export const orderDetailValid = Joi.object({
  orderId: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message("Invalid orderId format");
    }
    return value;
  }).required(),
  
  productId: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message("Invalid productId format");
    }
    return value;
  }).required(),
  
  productName: Joi.string().required(),
  
  sizeId: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message("Invalid sizeId format");
    }
    return value;
  }).required(),
  
  size: Joi.number().required(),
  
  productDetailId: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message("Invalid productDetailId format");
    }
    return value;
  }).required(),
  
  quantity: Joi.number().required(),
  
  price: Joi.number().required(),
});
