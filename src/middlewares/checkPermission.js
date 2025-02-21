import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();
const { SECRET_CODE } = process.env;

export const checkPermission = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const decode = jwt.verify(token, SECRET_CODE);
    const user = await User.findById(decode._id);
    if (!user) {
      return res.status(403).json({
        message: "Token lỗi",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.json({
      name: error.name,
      message: error.message,
    });
  }
};
