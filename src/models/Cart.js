import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      productDetail: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductDetail",
        required: true,
      },
    
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model("Cart", cartSchema);
