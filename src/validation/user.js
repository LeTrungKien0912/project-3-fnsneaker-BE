import Joi from "joi";
// signUp
export const signUpValidator = Joi.object({
  tel: Joi.number().required().min(10),
  email: Joi.string().required().email(),
  fullName: Joi.string().required(),
  address: Joi.string().required(),
  password: Joi.string().min(6),
  confirmPassword: Joi.string().required().min(6).valid(Joi.ref("password")),
  role: Joi.string()
});

// signIn
export const signInValidator = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().min(6),
});

export const updateUserAdminValidator = Joi.object({
  role: Joi.string().valid("member", "admin").required(),
});

export const updateUserValidator = Joi.object({
  userName: Joi.string().min(6),
  fullName: Joi.string(),
  tel: Joi.string(),
  address: Joi.string(),
  role: Joi.string(),
  email: Joi.string().email(),
  gender: Joi.string(),
}).min(1); // Tối thiểu phải có một trường dữ liệu để cập nhật

// đổi mk

export const changePasswordValidator = Joi.object({
  oldPassword: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu cũ phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu cũ là bắt buộc",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu mới là bắt buộc",
  }),
});