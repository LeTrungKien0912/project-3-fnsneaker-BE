import mongoose from "mongoose";

const purchaseHistorySchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    promotionalPrice: {
      type: Number,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sizes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: true,
    },
    productDtail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductDetail",
      required: true,
    },
    images: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model("PurchaseHistory", purchaseHistorySchema);
