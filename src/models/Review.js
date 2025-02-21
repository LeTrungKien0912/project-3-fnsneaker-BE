import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    idAccount: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    isRated: {
        type: Boolean,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,  // Số sao tối thiểu là 1
        max: 5   // Số sao tối đa là 5
    }
},
{
    timestamps: true,
    collection: "Reviews"
})

export default mongoose.model("Review", reviewSchema);