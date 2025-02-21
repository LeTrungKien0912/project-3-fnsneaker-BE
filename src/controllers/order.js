import Order from "../models/Order.js";
import ProductDetail from "../models/ProductDetail.js";
import Cart from "../models/Cart.js";
import { orderValid } from "../validation/order.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";
import moment from "moment";
import User from "../models/User.js";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from "../utils/email.js";
// Hàm sinh chuỗi ngẫu nhiên
function generateRandomCode(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;
    // Validate dữ liệu order
    const { error } = orderValid.validate(body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: errors,
      });
    }
    // Kiểm tra và sinh codeOrders nếu phương thức thanh toán là "cod"
    if (body.paymentMethod === "cod") {
      body.codeOrders = generateRandomCode(8);
      body.paymentStatus = "unpaid";
      body.orderStatus = "pending"; // Đơn hàng bắt đầu ở trạng thái pending
    } else if (body.paymentMethod === "vnpay") {
      body.paymentStatus = "paid";
      body.orderStatus = "pending"; // Đơn hàng được hoàn tất ngay lập tức
    }
    const newOrder = new Order(body);
    // Tính tổng giá tiền và kiểm tra số lượng sản phẩm
    let totalPrice = 0;
    for (const product of newOrder.productDetails) {
      const { productDetailId, promotionalPrice, quantityOrders } = product;
      // Kiểm tra sản phẩm có tồn tại không
      const productExist = await ProductDetail.findById(
        productDetailId
      ).session(session);
      if (!productExist) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Không tìm thấy ProductDetail",
        });
      }
      // Kiểm tra số lượng sản phẩm có đủ không
      if (productExist.quantity < quantityOrders) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Sản phẩm với ID ${productDetailId} không đủ số lượng`,
        });
      }
      // Trừ số lượng sản phẩm
      productExist.quantity -= quantityOrders;
      await productExist.save({ session });
      totalPrice += promotionalPrice * quantityOrders;
    }
    newOrder.total_price = totalPrice;
    // Lưu đơn hàng vào cơ sở dữ liệu
    const order = await newOrder.save({ session });
    // Xóa các mục trong giỏ hàng liên quan đến đơn hàng vừa được tạo thành công
    const productDetailIds = newOrder.productDetails.map(
      (product) => product.productDetailId
    );
    await Cart.deleteMany({
      user: order.user_id,
      productDetail: { $in: productDetailIds },
    }).session(session);
    await session.commitTransaction();
    session.endSession();
    // Lấy email của người dùng từ bảng User
    const user = await User.findById(order.user_id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // Gửi email xác nhận đơn hàng
    sendOrderConfirmationEmail(user.email, order);
    return res.status(200).json({
      message: "Tạo đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const getAllOrders = async (req, res) => {
  try {
    const { user } = req;
    const { status } = req.query;
    let filter = {};
    if (user.role !== "admin") {
      filter.user_id = user._id;
    }
    if (status) {
      filter.orderStatus = status;
    }
    // Fetch orders based on filter criteria
    const orders = await Order.find(filter)
      .populate("user_id", "userName email")
      .sort({ createdAt: -1 });
    // Add isRated field to each order based on the isRated status of the order
    const ordersWithIsRated = orders.map((order) => {
      const isRatedOrder = order.isRated;
      return {
        ...order.toObject(),
        isRated: isRatedOrder,
      };
    });
    return res.status(200).json({
      message: "Fetch All Orders Successful",
      data: ordersWithIsRated,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { user } = req;
    // Lấy thông tin đơn hàng
    const order = await Order.findById(orderId)
      .populate("user_id", "userName email fullName");
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    // Kiểm tra quyền của người dùng
    if (
      user.role !== "admin" &&
      order.user_id._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập chi tiết đơn hàng này",
      });
    }
    // Thêm trường isRated cho đơn hàng
    const orderWithIsRated = {
      ...order.toObject(),
      isRated: order.isRated,
    };
    return res.status(200).json({
      message: "Fetch Order Detail Successful",
      data: orderWithIsRated,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    const { user } = req; // Lấy thông tin người dùng từ req.user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Xác định các trạng thái chuyển đổi hợp lệ
    const validTransitions = {
      pending: ["waiting", "cancel"], // Chỉ admin có thể chuyển từ pending sang waiting hoặc cancel
      waiting: ["delivering", "done", "cancel"], // Chỉ admin có thể chuyển từ waiting sang cancel
      delivering: ["done", "cancel", "fail"], // Chỉ cho phép delivering được update lên fail
      done: [], // Trạng thái done không thể chuyển đổi sang trạng thái khác
      cancel: [],
    };

    // Kiểm tra quyền của user và điều chỉnh validTransitions
    if (user.role !== "admin") {
      // Thành viên không được phép chuyển từ waiting sang cancel
      if (order.orderStatus === "waiting" && orderStatus === "cancel") {
        return res.status(403).json({
          message: "Bạn không có quyền thay đổi trạng thái đơn hàng này",
        });
      }

      // Thành viên không được phép chuyển trạng thái đơn hàng nếu trạng thái hiện tại không phải là pending
      if (order.orderStatus !== "pending") {
        return res.status(403).json({
          message: "Bạn không có quyền thay đổi trạng thái đơn hàng này",
        });
      }
    }

    // Kiểm tra trạng thái hợp lệ
    if (!validTransitions[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        message: `Chuyển đổi trạng thái không hợp lệ từ ${order.orderStatus} sang ${orderStatus}`,
      });
    }

    // Nếu trạng thái chuyển thành "cancel", cộng lại số lượng sản phẩm vào kho
    if (orderStatus === "cancel") {
      for (const product of order.productDetails) {
        const { productDetailId, quantityOrders } = product;
        const productDetailRecord = await ProductDetail.findById(productDetailId);
        if (productDetailRecord) {
          productDetailRecord.quantity += quantityOrders;
          await productDetailRecord.save();
        } else {
          return res.status(404).json({
            message: `ProductDetail với ID ${productDetailId} không tìm thấy`,
          });
        }
      }
    }

    // Nếu trạng thái chuyển thành "done" và phương thức thanh toán là "cod", cập nhật paymentStatus thành "paid"
    if (orderStatus === "done" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      adminId: user._id,
      status: orderStatus,
    });

    await order.save();

    // Lấy email của người dùng từ bảng User
    const orderUser = await User.findById(order.user_id);
    if (!orderUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Gửi email thông báo trạng thái đơn hàng được cập nhật
    sendOrderStatusUpdateEmail(orderUser.email, order, orderStatus);

    return res.status(200).json({
      message: "Update Order Successful",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



export const getHistoryStatusOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("statusHistory.adminId", "fullName")
      .populate("user_id", "fullName"); // assuming 'fullName' is the field you want to display for user
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    const statusHistory = order.statusHistory.map((history) => ({
      adminId: history.adminId?._id,
      adminName: history.adminId?.fullName || "Unknown", // Default to "Unknown" if adminId or fullName is missing
      status: history.status,
      timestamp: history.timestamp,
    }));
    return res.status(200).json({
      message: "Status history retrieved successfully",
      orderId: order._id,
      statusHistory: statusHistory,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



export const productBestSeller = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Tạo đối tượng filter cho khoảng thời gian
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    if (!startDate && !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate hoặc endDate" });
    }

    // Tìm các đơn hàng đã hoàn thành trong khoảng thời gian cụ thể
    const completedOrders = await Order.find({
      orderStatus: "done",
      createdAt: dateFilter,
    }).select('productDetails total_price createdAt'); // Chỉ chọn các trường cần thiết

    if (!completedOrders || completedOrders.length === 0) {
      return res.status(404).json({ message: "Không có đơn hàng nào đã hoàn thành trong khoảng thời gian này" });
    }

    const productSales = {};
    completedOrders.forEach(order => {
      order.productDetails.forEach(detail => {
        const key = `${detail.productId}-${detail.productDetailId}`;
        if (!productSales[key]) {
          productSales[key] = {
            productId: detail.productId,
            productDetailId: detail.productDetailId,
            productName: detail.productName,
            totalQuantity: 0,
            price: detail.price,
            promotionalPrice: detail.promotionalPrice,
            importPrice: detail.importPrice,
            totalRevenue: 0,
            image: detail.image,
            date: order.createdAt, // Thêm createdAt vào đối tượng productSales
          };
        }
        productSales[key].totalQuantity += detail.quantityOrders;
      });
      // Cộng dồn doanh thu từ đơn hàng vào sản phẩm tương ứng
      order.productDetails.forEach(detail => {
        const key = `${detail.productId}-${detail.productDetailId}`;
        productSales[key].totalRevenue += order.total_price;
      });
    });

    const bestSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return res.status(200).json({
      message: "Danh sách sản phẩm bán chạy",
      data: bestSellingProducts,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};
// top 5 sản  phẩm bán chạy

export const top5BestSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp startDate và endDate" });
    }

    const start = moment(startDate).startOf("day").toDate();
    const end = moment(endDate).endOf("day").toDate();

    // Lấy thông tin các đơn hàng đã hoàn thành trong khoảng thời gian
    const completedOrders = await Order.find({
      orderStatus: "done",
      createdAt: { $gte: start, $lte: end },
    });

    if (!completedOrders || completedOrders.length === 0) {
      return res
        .status(404)
        .json({ message: "Không có đơn hàng nào đã hoàn thành" });
    }

    // Tính tổng số lượng sản phẩm đã bán
    const productSales = {};
    completedOrders.forEach((order) => {
      order.productDetails.forEach((detail) => {
        const key = `${detail.productId}-${detail.productDetailId}`;
        if (!productSales[key]) {
          productSales[key] = {
            productId: detail.productId,
            productDetailId: detail.productDetailId,
            productName: detail.productName,
            totalQuantity: 0,
            price: detail.price,
            promotionalPrice: detail.promotionalPrice,
            image: detail.image,
            sizeId: detail.sizeId,
            sizeName: detail.sizeName,
          };
        }
        productSales[key].totalQuantity += detail.quantityOrders;
      });
    });

    // Chuyển đổi kết quả sang mảng và sắp xếp theo số lượng bán được
    const bestSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5); // Giới hạn kết quả thành top 5 sản phẩm bán chạy

    return res.status(200).json({
      message: "Danh sách sản phẩm bán chạy",
      data: bestSellingProducts,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};
// top 5 sản phẩm có doanh thu cao nhất
export const topRevenueProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp startDate và endDate" });
    }

    const start = moment(startDate).startOf("day").toDate();
    const end = moment(endDate).endOf("day").toDate();

    // Lấy thông tin các đơn hàng đã hoàn thành trong khoảng thời gian
    const completedOrders = await Order.find({
      orderStatus: "done",
      createdAt: { $gte: start, $lte: end },
    });

    if (!completedOrders || completedOrders.length === 0) {
      return res
        .status(404)
        .json({ message: "Không có đơn hàng nào đã hoàn thành" });
    }

    // Tính tổng doanh thu cho mỗi sản phẩm
    const productRevenue = {};
    completedOrders.forEach((order) => {
      order.productDetails.forEach((detail) => {
        const key = `${detail.productId}-${detail.productDetailId}`;
        if (!productRevenue[key]) {
          productRevenue[key] = {
            productId: detail.productId,
            productDetailId: detail.productDetailId,
            productName: detail.productName,
            totalRevenue: 0,
            promotionalPrice: detail.promotionalPrice,
            image: detail.image,
            sizeId: detail.sizeId,
            sizeName: detail.sizeName,
          };
        }
        productRevenue[key].totalRevenue +=
          detail.promotionalPrice * detail.quantityOrders;
      });
    });

    // Chuyển đổi kết quả sang mảng và sắp xếp theo doanh thu
    const topRevenueProducts = Object.values(productRevenue)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5); // Giới hạn kết quả thành top 5 sản phẩm có doanh thu cao nhất

    return res.status(200).json({
      message: "Top 5 sản phẩm có doanh thu cao nhất",
      data: topRevenueProducts,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};
// top 5 sản phẩm có l��i nhuận cao nhất

export const top5MostProfitableProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp startDate và endDate" });
    }

    const start = moment(startDate).startOf("day").toDate();
    const end = moment(endDate).endOf("day").toDate();

    // Lấy thông tin các đơn hàng đã hoàn thành trong khoảng thời gian
    const completedOrders = await Order.find({
      orderStatus: "done",
      createdAt: { $gte: start, $lte: end },
    });

    if (!completedOrders || completedOrders.length === 0) {
      return res
        .status(404)
        .json({ message: "Không có đơn hàng nào đã hoàn thành" });
    }

    // Tính tổng lợi nhuận cho mỗi sản phẩm
    const productProfits = {};
    const productDetailMap = new Map();

    for (const order of completedOrders) {
      for (const detail of order.productDetails) {
        const { productDetailId, quantityOrders, promotionalPrice } = detail;

        // Kiểm tra và lấy thông tin chi tiết sản phẩm từ map
        let productDetail = productDetailMap.get(productDetailId);
        if (!productDetail) {
          productDetail = await ProductDetail.findById(productDetailId);
          if (!productDetail) {
            return res
              .status(404)
              .json({
                message: `Không tìm thấy ProductDetail với ID ${productDetailId}`,
              });
          }
          productDetailMap.set(productDetailId, productDetail);
        }

        const profit =
          (promotionalPrice - productDetail.importPrice) * quantityOrders;
        const key = `${detail.productId}-${productDetailId}`;

        if (!productProfits[key]) {
          productProfits[key] = {
            productId: detail.productId,
            productDetailId: productDetailId,
            productName: detail.productName,
            totalProfit: 0,
            promotionalPrice: promotionalPrice,
            importPrice: productDetail.importPrice,
            image: detail.image,
            sizeId: detail.sizeId,
            sizeName: detail.sizeName,
          };
        }
        productProfits[key].totalProfit += profit;
      }
    }

    // Chuyển đổi kết quả sang mảng và sắp xếp theo lợi nhuận
    const mostProfitableProducts = Object.values(productProfits)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 5); // Giới hạn kết quả thành top 5 sản phẩm có lợi nhuận cao nhất

    return res.status(200).json({
      message: "Top 5 sản phẩm có lợi nhuận cao nhất",
      data: mostProfitableProducts,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};