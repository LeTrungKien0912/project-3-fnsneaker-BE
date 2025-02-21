import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isRated: {
      type: Boolean,
      default: false, // Mặc định là false khi tạo đơn hàng
    },
    productDetails: [
      {
        productId: { type: mongoose.Types.ObjectId, required: true },
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        promotionalPrice: { type: Number, required: true },
        importPrice: { type: Number, required: true }, // Thêm trường importPrice
        image: { type: String, required: true },
        sizeId: { type: mongoose.Types.ObjectId, required: true },
        sizeName: { type: String, required: true },
        productDetailId: { type: mongoose.Types.ObjectId, required: true },
        quantityOrders: { type: Number, default: 1 },
        _id: false,
      },
    ],
    orderStatus: {
      type: String,
      enum: ["pending", "waiting", "delivering", "done", "cancel", "fail"],
      default: "pending",
    },
    reason: { type: String },
    total_price: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "vnpay"],
      default: "cod",
    },
    codeOrders: { type: String },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    statusHistory: [
      {
        adminId: { type: mongoose.Types.ObjectId, ref: "User" },
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: "Orders",
  }
);

export default mongoose.model("Order", orderSchema);
