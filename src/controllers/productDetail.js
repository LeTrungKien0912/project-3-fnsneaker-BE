import ProductDetail from "../models/ProductDetail.js";
import { productDetailValid } from "../validation/productDetail.js";
import mongoose from "mongoose";
import Image from "../models/Image.js";

import Review from "../models/Review.js";


export const create = async (req, res) => {
  try {
    const { error } = productDetailValid.validate(req.body);
    if (error) {
      return res.status(400).json({
        message:
          error.details[0].message || "Vui lòng kiểm tra lại dữ liệu của bạn",
      });
    }

    const productDetailsData = req.body.productDetails;

    // Check if size already exists for the given product
    const sizeExistsPromises = productDetailsData.map((detail) =>
      ProductDetail.findOne({ product: detail.product, sizes: detail.sizes })
    );
    const existingSizes = await Promise.all(sizeExistsPromises);

    const duplicateSizes = existingSizes.filter(Boolean);
    if (duplicateSizes.length > 0) {
      return res.status(400).json({
        message: `Size đã tồn tại cho sản phẩm: ${duplicateSizes
          .map((detail) => detail.sizes)
          .join(", ")}`,
      });
    }

    // Insert product details
    const productDetails = await ProductDetail.insertMany(productDetailsData);
    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({
        message: "Tạo chi tiết sản phẩm không thành công",
      });
    }

    return res.status(200).json({
      message: "Tạo sản phẩm chi tiết thành công",
      data: productDetails,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getAllProductDetail = async (req, res) => {
  try {
    const productDetails = await ProductDetail.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "sizes",
          localField: "sizes",
          foreignField: "_id",
          as: "sizes",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $unwind: "$sizes",
      },
      // Lookup reviews to calculate average rating
      {
        $lookup: {
          from: "reviews",
          localField: "product._id",
          foreignField: "productId",
          as: "reviews",
        },
      },
      // Calculate average rating
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] }, // Check if there are any reviews
              then: { $avg: "$reviews.rating" }, // Calculate average rating
              else: 0, // Set to 0 if no reviews
            },
          },
        },
      },
      {
        $group: {
          _id: "$product._id",
          name: { $first: "$product.name" },
          productId: { $first: "$product._id" },
          averageRating: { $first: "$averageRating" }, // Include the average rating in the group
          productDetails: {
            $push: {
              productDetailId: "$_id",
              size: "$sizes.size",
              quantity: "$quantity",
              price: "$price",
              importPrice: "$importPrice",
              promotionalPrice: "$promotionalPrice",
            },
          },
        },
      },
    ]);

    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy chi tiết sản phẩm",
      });
    }

    return res.status(200).json({
      message: "Danh sách chi tiết sản phẩm đã được tìm thấy",
      data: productDetails,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getDetailProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem id có phải là ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    // Tìm chi tiết sản phẩm theo productDetailId và lấy thông tin sản phẩm và size
    const productDetail = await ProductDetail.findById(id)
      .populate("product", "name") // Lấy tên sản phẩm
      .populate("sizes", "size"); // Lấy thông tin size

    if (!productDetail) {
      return res.status(404).json({
        message: "Không tìm thấy chi tiết sản phẩm",
      });
    }

    // Tìm ảnh sản phẩm loại "thumbnail"
    const thumbnailImage = await Image.findOne({
      productId: productDetail.product._id,
      type: "thumbnail",
    });

    // Tìm các đánh giá liên quan đến sản phẩm để tính số sao trung bình
    const reviews = await Review.find({ productId: productDetail.product._id });

    // Tính số sao trung bình, nếu không có đánh giá nào thì số sao trung bình là 0
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) /
          reviews.length
        : 0;

    // Xử lý thông tin chi tiết sản phẩm
    const formattedProductDetail = {
      productDetailId: productDetail._id,
      productId: productDetail.product._id.toString(),
      name: productDetail.product.name,
      size: productDetail.sizes.size,
      quantity: productDetail.quantity,
      price: productDetail.price,
      importPrice: productDetail.importPrice,
      promotionalPrice: productDetail.promotionalPrice,
      productImage: thumbnailImage ? thumbnailImage.image : null,
      averageRating: averageRating, // Thêm số sao trung bình vào kết quả trả về
    };

    return res.status(200).json({
      message: "Chi tiết sản phẩm đã được tìm thấy",
      data: formattedProductDetail,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteProductDetail = async (req, res) => {
  try {
    const { productDetailId } = req.params; // Thay đổi từ `productId` thành `productDetailId`

    // Kiểm tra xem productDetailId có phải là ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(productDetailId)) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    // Tìm và xóa sản phẩm chi tiết dựa trên productDetailId
    const result = await ProductDetail.deleteOne({ _id: productDetailId }); // Thay đổi thành deleteOne và tìm theo _id

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm chi tiết",
      });
    }

    return res.status(200).json({
      message: "Sản phẩm chi tiết đã được xóa thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const updateProductDetail = async (req, res) => {
  try {
    const updates = req.body; // Expecting an array of updates

    // Validate the array of updates
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        message: "Dữ liệu cập nhật không hợp lệ",
      });
    }

    // Loop through each update and apply the changes
    const updatedProductDetails = [];
    for (const update of updates) {
      const { productDetailId, sizes } = update; // Thay `id` thành `productDetailId`

      // Check if the productDetailId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(productDetailId)) {
        return res.status(400).json({
          message: `ID không hợp lệ: ${productDetailId}`,
        });
      }

      // Loop through each size update
      for (const sizeUpdate of sizes) {
        const { _id, quantity, price, importPrice, promotionalPrice } =
          sizeUpdate;

        // Check if the size ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(_id)) {
          return res.status(400).json({
            message: `ID size không hợp lệ: ${_id}`,
          });
        }

        // Find the product detail by productDetailId and size ID
        const productDetail = await ProductDetail.findOne({
          _id: productDetailId, // Thay `product` thành `_id`
          sizes: _id,
        });

        if (!productDetail) {
          return res.status(404).json({
            message: `Không tìm thấy chi tiết sản phẩm: ${productDetailId}`,
          });
        }

        // Update the product detail
        productDetail.quantity = quantity;
        productDetail.price = price;
        productDetail.importPrice = importPrice;
        productDetail.promotionalPrice = promotionalPrice;

        // Save the updated product detail
        const updatedProductDetail = await productDetail.save();
        updatedProductDetails.push(updatedProductDetail);
      }
    }

    return res.status(200).json({
      message: "Chi tiết sản phẩm đã được cập nhật thành công",
      data: updatedProductDetails,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

