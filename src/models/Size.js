import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: Number,
      required: true,
      unique: true,
      defaultValue: "UnCategorized",
    },
    slug: {
      type: Number,
      required: true,
      unique: true,
      defaultValue: "UnCategorized",
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model("Size", sizeSchema);
