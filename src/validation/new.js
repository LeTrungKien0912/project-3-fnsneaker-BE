import Joi from "joi";

export const newValidation = Joi.object({
  new: Joi.string().required().max(255), // Trường 'new' là chuỗi, bắt buộc và tối đa 255 ký tự
  img: Joi.string().uri().required(), // Trường 'img' là một chuỗi URI hợp lệ và bắt buộc
  title: Joi.string().required().max(255), // Trường 'title' là chuỗi, bắt buộc và tối đa 255 ký tự
  desc: Joi.string().required().max(500), // Trường 'desc' là chuỗi, bắt buộc và tối đa 500 ký tự
  detailNew: Joi.object({
    account: Joi.string().required().max(255), // Trường 'account' là chuỗi, bắt buộc và tối đa 255 ký tự
    date: Joi.date().required(), // Trường 'date' là ngày, bắt buộc
    title: Joi.string().required().max(255), // Trường 'title' là chuỗi, bắt buộc và tối đa 255 ký tự
    content: Joi.string().required(), // Trường 'content' là chuỗi và bắt buộc
    idnew: Joi.string().required().max(255), // Trường 'idnew' là chuỗi, bắt buộc và tối đa 255 ký tự
  }).required(), // detailNew là một object, bắt buộc
});
