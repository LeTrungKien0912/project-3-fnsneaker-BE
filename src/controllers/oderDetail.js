import mongoose from "mongoose";
import Order from "../models/Order.js";

export const createOrderDetail = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user_id, address, phone, total_price, payment_type, productDetails } = req.body;

    // Tạo đơn hàng mới
    const newOrder = new Order({
      user_id,
      address,
      phone,
      total_price,
      payment_type,
    });

    await newOrder.save({ session });

    // Lưu chi tiết đơn hàng
    const orderDetails = productDetails.map(item => ({
      orderId: newOrder._id,
      productId: item.productId,
      productName: item.productName,
      sizeId: item.sizeId,
      size: item.size,
      productDetailId: item.productDetailId,
      quantity: item.quantity,
      price: item.price,
    }));

    await orderDetails.insertMany(orderDetails, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Đơn hàng đã được tạo thành công",
      data: newOrder,
      orderDetails,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: error.message,
    });
  }
};
