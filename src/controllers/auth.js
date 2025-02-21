import { changePasswordValidator, signInValidator, signUpValidator, updateUserAdminValidator, updateUserValidator } from "../validation/user.js";
import User from "../models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendNewPasswordEmail } from "../utils/email.js";
dotenv.config();
const { SECRET_CODE } = process.env;
export const signUp = async (req, res) => {
  try {
    const { error } = signUpValidator.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    const useExists = await User.findOne({ email: req.body.email });
    if (useExists) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // const userNameExists = await User.findOne({ userName: req.body.userName });
    // if (userNameExists) {
    //   return res.status(400).json({
    //     message: "Tên đăng nhập đã tồn tại",
    //   });
    // }

    const hashedPassword = await bcryptjs.hash(req.body.password, 10);

    const user = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    user.password = undefined;
    return res.status(200).json({
      message: "Thành công",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const signIn = async (req, res) => {
  try {
    const { error } = signInValidator.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        message: "Email không tồn tại",
      });
    }

    if (user.block) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.",
      });
    }

    const isMatch = await bcryptjs.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Sai mật khẩu",
      });
    }

    const accessToken = jwt.sign({ _id: user._id }, SECRET_CODE, {
      expiresIn: "1d",
    });

    user.password = undefined;
    return res.status(200).json({
      message: "Đăng nhập thành công",
      user,
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ name: error.name, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    // Validate user input
    const { error } = updateUserValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    // Ensure the user is a "member"
    if (req.user.role !== "member") {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật thông tin người dùng",
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng để cập nhật",
      });
    }

    return res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const updateUserAdmin = async (req, res) => {
  try {
    // Validate user input
    const { error } = updateUserAdminValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    // Ensure the user is an "admin"
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật vai trò của người dùng",
      });
    }

    // Update user's role
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { role: req.body.role } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng để cập nhật vai trò",
      });
    }

    updatedUser.password = undefined; // Ensure password is not returned
    return res.status(200).json({
      message: "Cập nhật vai trò người dùng thành công",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền khóa người dùng",
      });
    }
    const { userId } = req.params;
    
    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    // Update the block status
    user.block = true;
    await user.save();

    return res.status(200).json({
      message: "Người dùng đã bị block thành công",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const getAllAccount = async (req, res) => {
  try {
    // Lấy thông tin người dùng từ middleware checkPermission
    const currentUser = req.user;

    // Kiểm tra nếu người dùng không phải là admin
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập danh sách tài khoản',
      });
    }

    // Lấy danh sách người dùng từ cơ sở dữ liệu, loại bỏ trường password
    const users = await User.find({}, { password: 0 });

    return res.status(200).json({
      message: 'Lấy danh sách tài khoản thành công',
      users: users,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};


export const getDetailAccount = async (req, res) => {
  try {
    // Lấy token từ header Authorization
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    // Giải mã token để lấy thông tin user
    const decoded = jwt.verify(token, SECRET_CODE);
    const userId = decoded._id;

    // Kiểm tra xem user có tồn tại trong cơ sở dữ liệu không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    // Nếu là admin hoặc đang xem chi tiết của chính mình
    if (req.user.role === 'admin' || userId === req.params.userId) {
      // Lấy thông tin chi tiết của user từ id
      const detailUser = await User.findById(req.params.userId).select('-password');
      
      if (!detailUser) {
        return res.status(404).json({
          message: "Không tìm thấy thông tin người dùng",
        });
      }

      return res.status(200).json({
        message: "Lấy thông tin người dùng thành công",
        user: detailUser,
      });
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền xem thông tin người dùng",
      });
    }
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const unlockUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền mở khóa người dùng",
      });
    }

    const { userId } = req.params;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    // Update the block status
    user.block = false;
    await user.save();

    return res.status(200).json({
      message: "Người dùng đã được mở khóa thành công",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate passwords
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Mật khẩu mới và xác nhận mật khẩu mới không khớp",
      });
    }

    // Tìm người dùng theo ID
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Mật khẩu cũ không đúng",
      });
    }

    // Mã hóa mật khẩu mới và cập nhật
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

const generateRandomPassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Tạo mật khẩu 6 chữ số
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra email có tồn tại trong hệ thống không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Email không tồn tại",
      });
    }

    // Sinh mật khẩu mới
    const newPassword = generateRandomPassword();

    // Hash mật khẩu mới
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Cập nhật mật khẩu mới vào database
    user.password = hashedPassword;
    await user.save();

    // Gửi email chứa mật khẩu mới
    sendNewPasswordEmail(email, newPassword);

    return res.status(200).json({
      message: "Mật khẩu mới đã được gửi vào email của bạn",
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};