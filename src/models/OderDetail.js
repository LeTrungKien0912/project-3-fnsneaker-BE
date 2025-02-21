import mongoose from "mongoose";

const orderDetailSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    productDetailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductDetail",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model("OrderDetail", orderDetailSchema);
