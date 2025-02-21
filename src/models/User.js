
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
    },
    fullName: {
      type: String,
    },
    tel: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "member",
    },
    block: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model("User", userSchema);
