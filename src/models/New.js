import mongoose from "mongoose";

const DetailNewSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Tham chiếu đến mô hình User
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  }
});

const NewSchema = new mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  detailNew: [DetailNewSchema],
  author: {
    type: String, // Tên tác giả
    required: true,
  },
});

export default mongoose.model('New', NewSchema);
