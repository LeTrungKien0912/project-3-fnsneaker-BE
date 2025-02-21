import Favorite from "../models/Favorite.js";
import Image from "../models/Image.js";
import Product from "../models/Product.js";
import ProductDetail from "../models/ProductDetail.js";
import User from "../models/User.js";

export const createFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Kiểm tra sự tồn tại của người dùng và sản phẩm
    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Kiểm tra xem sản phẩm đã được thêm vào danh sách yêu thích chưa
    const existingFavorite = await Favorite.findOne({
      user: userId,
      product: productId,
    });
    if (existingFavorite) {
      return res
        .status(400)
        .json({ message: "Product is already in favorites" });
    }

    // Tạo sản phẩm yêu thích mới
    const newFavorite = new Favorite({ user: userId, product: productId });
    await newFavorite.save();

    return res.status(201).json({
      message: "Product added to favorites successfully",
      data: newFavorite,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};



export const getFavoriteProducts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm tất cả các sản phẩm yêu thích của người dùng và sắp xếp theo thứ tự thời gian thêm vào (mới nhất trước)
    const favoriteProducts = await Favorite.find({ user: userId })
      .populate("product")
      .sort({ createdAt: -1 }) // Sắp xếp theo createdAt để sản phẩm mới nhất lên đầu
      .lean();

    // Lấy thông tin chi tiết của từng sản phẩm
    const productDetailsPromises = favoriteProducts.map(async (favorite) => {
      const product = favorite.product;

      // Lấy ảnh sản phẩm (ưu tiên ảnh thumbnail)
      const image = await Image.findOne({
        productId: product._id,
        type: "thumbnail",
      }).lean();

      // Lấy chi tiết sản phẩm
      const productDetails = await ProductDetail.find({
        product: product._id,
      }).lean();

      // Tìm productDetail có promotionalPrice nhỏ nhất
      const minPromotionalPriceDetail = productDetails.reduce(
        (minDetail, currentDetail) => {
          if (
            !minDetail ||
            currentDetail.promotionalPrice < minDetail.promotionalPrice
          ) {
            return currentDetail;
          }
          return minDetail;
        },
        null
      );

      return {
        productId: product._id,
        nameProduct: product.name,
        productDetailId: minPromotionalPriceDetail
          ? minPromotionalPriceDetail._id
          : null,
        price: minPromotionalPriceDetail
          ? minPromotionalPriceDetail.price
          : null,
        promotionalPrice: minPromotionalPriceDetail
          ? minPromotionalPriceDetail.promotionalPrice
          : null,
        imageProduct: image ? image.image : null, // Nếu không có ảnh thumbnail thì để null
      };
    });

    const productDetails = await Promise.all(productDetailsPromises);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm yêu thích thành công",
      data: productDetails,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Kiểm tra sự tồn tại của người dùng và sản phẩm
    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Kiểm tra xem sản phẩm có trong danh sách yêu thích của người dùng không
    const existingFavorite = await Favorite.findOne({
      user: userId,
      product: productId,
    });

    if (!existingFavorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Xóa sản phẩm khỏi danh sách yêu thích
    await Favorite.findByIdAndDelete(existingFavorite._id);

    return res.status(200).json({
      message: "Product removed from favorites successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};