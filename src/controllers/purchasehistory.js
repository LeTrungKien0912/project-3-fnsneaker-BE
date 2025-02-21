import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ProductDetail from "../models/ProductDetail.js";
import Image from "../models/Image.js";

export const getAllPurchaseHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra xem userId có hợp lệ hay không
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId format",
      });
    }

    // Lấy tất cả các đơn hàng của user với trạng thái "done"
    const orders = await Order.find({ user_id: userId, status: "done" })
      .populate("productDetails.productId")
      .populate("productDetails.sizeId");

    // Nếu không có đơn hàng nào
    if (!orders.length) {
      return res.status(404).json({
        message: "No purchase history found for this user",
      });
    }

    // Tạo mảng để lưu trữ lịch sử mua hàng
    const purchaseHistory = [];

    // Duyệt qua từng đơn hàng và từng chi tiết sản phẩm trong đơn hàng
    for (const order of orders) {
      for (const productDetail of order.productDetails) {
        const product = await Product.findById(productDetail.productId);
        const productDetails = await ProductDetail.findById(
          productDetail.productDetailId
        );
        const image = await Image.findOne({
          productId: productDetail.productId,
          type: "thumbnail",
        });

        // Nếu không tìm thấy ProductDetail, bỏ qua mục này và tiếp tục xử lý các mục khác
        if (!productDetails) {
          console.warn(
            `ProductDetail not found for productId: ${productDetail.productId}`
          );
          continue;
        }

        // Tính toán giá trị tổng
        const totalPrice =
          productDetail.quantity * productDetails.promotionalPrice;

        // Thêm thông tin vào mảng lịch sử mua hàng
        purchaseHistory.push({
          imageProduct: image ? image.image : null,
          nameProduct: product.name,
          productId: product._id,
          productDetailId: productDetail.productDetailId,
          size: productDetail.sizeId.size,
          sizeId: productDetail.sizeId._id,
          quantity: productDetail.quantity,
          priceProduct: productDetail.price,
          promotionalPrice: productDetails.promotionalPrice,
          totalPrice,
          status: order.status,
          orderDate: order.createdAt,
          codeOrders: order.codeOrders,
          paymentType: order.payment_type,
        });
      }
    }

    // Trả về kết quả
    return res.status(200).json({
      message: "Purchase history retrieved successfully",
      data: purchaseHistory,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};
