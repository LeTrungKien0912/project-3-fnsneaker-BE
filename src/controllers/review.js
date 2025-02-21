import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ProductDetail from "../models/ProductDetail.js";
import Image from "../models/Image.js";


export const createReview = async (req, res) => {
  try {
    const { userId, orderId, reviews } = req.body;

    // Lấy thông tin đơn hàng
    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      return res.status(400).json({
        message: "Order not found.",
      });
    }

    // Kiểm tra trạng thái đánh giá của đơn hàng
    if (order.isRated) {
      return res.status(400).json({
        message: "Order has already been reviewed.",
      });
    }

    // Kiểm tra reviews có đủ thông tin và có cùng số lượng với sản phẩm trong order không
    if (order.productDetails.length !== reviews.length) {
      return res.status(400).json({
        message: "Number of reviews does not match the number of products in the order.",
      });
    }

    const reviewPromises = order.productDetails.map(async (product, index) => {
      const { productId } = product;
      const { content, rating } = reviews[index];

      // Tạo đánh giá mới cho từng sản phẩm
      const review = new Review({
        idAccount: userId,
        productId: productId,
        content: content,
        isRated: true,
        rating: rating,  // Thêm rating vào đánh giá
      });

      const savedReview = await review.save();

      // Cập nhật trạng thái isRated của sản phẩm
      await Product.findByIdAndUpdate(productId, { isRated: true });

      return savedReview;
    });

    // Chờ tất cả các đánh giá được lưu vào database
    const savedReviews = await Promise.all(reviewPromises);

    // Cập nhật trạng thái isRated của đơn hàng
    await Order.findByIdAndUpdate(orderId, { isRated: true });

    return res.status(201).json({
      message: "Reviews created successfully",
      data: savedReviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Lấy toàn bộ đánh giá của sản phẩm
    const reviews = await Review.find({ productId })
      .populate("idAccount", "userName email")
      .populate("productId", "name");

    // Tính số sao trung bình và số lượt đánh giá của sản phẩm
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length ? (totalRatings / reviews.length).toFixed(1) : 0;
    const numberOfReviews = reviews.length;

    return res.status(200).json({
      message: "Fetch Product Reviews Successful",
      data: {
        reviews,
        averageRating,    // Số sao trung bình
        numberOfReviews,  // Số lượt đánh giá
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getReviewDetail = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Tìm đánh giá theo reviewId
    const review = await Review.findById(reviewId).populate(
      "idAccount",
      "userName email"
    );
    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    // Tìm sản phẩm liên quan đến đánh giá
    const product = await Product.findById(review.productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Tìm thông tin chi tiết của sản phẩm được đánh giá
    const productDetail = await ProductDetail.findOne({
      product: review.productId,
    }).populate("sizes");

    // Tìm hình ảnh có type là "thumbnail" của sản phẩm
    const images = await Image.find({
      productId: product._id,
      type: "thumbnail",
    });

    // Tính số sao trung bình và số lượt đánh giá của sản phẩm
    const reviews = await Review.find({ productId: product._id });
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length ? (totalRatings / reviews.length).toFixed(1) : 0;
    const numberOfReviews = reviews.length;

    // Tạo đối tượng chứa thông tin chi tiết đánh giá và thông tin sản phẩm
    const reviewDetail = {
      review: {
        _id: review._id,
        idAccount: review.idAccount,
        content: review.content,
        rating: review.rating,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        status: product.status,
        averageRating: averageRating,   // Số sao trung bình
        numberOfReviews: numberOfReviews, // Số lượt đánh giá
        productDetail: {
          _id: productDetail._id,
          quantity: productDetail.quantity,
          price: productDetail.price,
          importPrice: productDetail.importPrice,
          promotionalPrice: productDetail.promotionalPrice,
          size: productDetail.sizes
            ? {
                _id: productDetail.sizes._id,
                size: productDetail.sizes.size,
              }
            : null,
        },
        images: images.map((image) => ({
          _id: image._id,
          imageUrl: image.image,
          type: image.type,
        })),
      },
    };

    return res.status(200).json({
      message: "Fetch Review Detail Successful",
      data: reviewDetail,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};




export const getAllReview = async (req, res) => {
  try {
    // Lấy thông tin người dùng từ req (được set trong middleware checkPermission)
    const currentUser = req.user;

    // Kiểm tra nếu người dùng không phải là admin
    if (currentUser.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập vào đánh giá",
      });
    }

    // Lấy toàn bộ đánh giá và populate thông tin người dùng và sản phẩm
    const reviews = await Review.find({})
      .populate("idAccount", "userName email")
      .populate({
        path: "productId",
        select: "name",
      })
      .sort({ createdAt: -1 }); // Sắp xếp đánh giá theo thời gian tạo mới nhất lên đầu

    // Xử lý và cấu trúc lại dữ liệu trả về để bao gồm thông tin ảnh sản phẩm
    const formattedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          const product = await Product.findById(review.productId);
          if (!product) {
            return null; // hoặc xử lý theo ý đồ của bạn khi không tìm thấy sản phẩm
          }

          const productImages = await Image.find({
            productId: review.productId,
            type: "thumbnail",
          }).select("image");

          // Tính số sao trung bình và số lượt đánh giá của sản phẩm
          const productReviews = await Review.find({ productId: product._id });
          const totalRatings = productReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const averageRating = productReviews.length
            ? (totalRatings / productReviews.length).toFixed(1)
            : 0;
          const numberOfReviews = productReviews.length;

          return {
            ...review._doc,
            productId: {
              ...product._doc,
              images: productImages,
              averageRating,    // Số sao trung bình
              numberOfReviews,  // Số lượt đánh giá
            },
          };
        } catch (error) {
          console.error("Error while processing review:", error);
          return null; // hoặc xử lý theo ý đồ của bạn khi có lỗi xảy ra
        }
      })
    );

    return res.status(200).json({
      message: "Fetch All Reviews Successful",
      data: formattedReviews.filter((review) => review !== null), // Loại bỏ những review không hợp lệ
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
