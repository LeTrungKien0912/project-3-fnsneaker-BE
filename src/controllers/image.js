import Image from "../models/Image.js";
import Product from "../models/Product.js";
import { imageValid } from "../validation/images.js";
import mongoose from "mongoose";

export const createImageProduct = async (req, res) => {
  try {
    // Validate the request body
    const { error } = imageValid.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message || "Dữ liệu không hợp lệ",
      });
    }
    // Validate that images field is an array
    if (!Array.isArray(req.body.images) || req.body.images.length === 0) {
      return res.status(400).json({
        message: "Images field must be a non-empty array",
      });
    }

    // Create an array to hold the new images
    const newImages = [];

    // Loop through the images array and create each image
    for (const image of req.body.images) {
      // Check if productId is valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(image.productId)) {
        return res.status(400).json({
          message: "Invalid productId format",
        });
      }

      // Check if productId exists in the database
      const existingProduct = await Product.findById(image.productId);
      if (!existingProduct) {
        return res.status(404).json({
          message: "ProductId not found",
        });
      }

      const newImage = await Image.create({
        image: image.image,
        productId: image.productId,
        type: image.type,
      });
      newImages.push(newImage);
    }

    return res.status(200).json({
      message: "Ảnh sản phẩm đã được tạo thành công",
      data: newImages,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllImagesByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const productIdKey = "arrImageProduct"; // Định nghĩa một biến hoặc hằng số để lưu trữ giá trị

    // Tìm tất cả ảnh của sản phẩm dựa trên productId
    const images = await Image.find({ productId });

    // Khởi tạo một đối tượng để nhóm các hình ảnh
    let groupedImages = {};

    // Nhóm các hình ảnh vào một đối tượng duy nhất
    images.forEach(image => {
      if (!groupedImages[productIdKey]) {
        groupedImages[productIdKey] = [];
      }
      groupedImages[productIdKey].push(image);
    });

    return res.status(200).json({
      message: 'Đã lấy tất cả ảnh của sản phẩm thành công',
      data: groupedImages,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy ảnh của sản phẩm',
      error: error.message,
    });
  }
};

export const getAllImages = async (req, res) => {
  try {
    // Tìm tất cả các hình ảnh trong cơ sở dữ liệu
    const allImages = await Image.find();

    // Khởi tạo một đối tượng để nhóm các hình ảnh theo productId
    let groupedImages = {};
    // let allImagesProduct = image.productId
    // Nhóm các hình ảnh vào các đối tượng tương ứng với productId
    allImages.forEach(image => {
      const allImagesProduct = image.productId
      if (!groupedImages[allImagesProduct]) {
        groupedImages[allImagesProduct] = [];
      }
      groupedImages[allImagesProduct].push(image);
    });

    return res.status(200).json({
      message: 'Đã lấy tất cả ảnh của các sản phẩm thành công',
      data: groupedImages,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy ảnh của các sản phẩm',
      error: error.message,
    });
  }
};


export const deleteImages = async (req, res) => {
  try {
    const { imageIds } = req.body;

    // Check if imageIds is provided and is an array
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        message: "imageIds field must be a non-empty array",
      });
    }

    // Delete the images
    const deleteResult = await Image.deleteMany({ _id: { $in: imageIds } });

    // Check if any images were deleted
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        message: "Không tìm thấy ảnh nào để xóa",
      });
    }

    return res.status(200).json({
      message: `Đã xóa thành công ${deleteResult.deletedCount} ảnh`,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa ảnh',
      error: error.message,
    });
  }
};


export const updateImages = async (req, res) => {
  try {
    const { images } = req.body;

    // Check if images is provided and is an array
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "images field must be a non-empty array",
      });
    }

    const updateResults = [];

    for (const img of images) {
      if (!img._id || !img.image || !img.type) {
        return res.status(400).json({
          message: "Each image must have an _id, image, and type",
        });
      }

      // Update the image and type
      const updatedImage = await Image.findByIdAndUpdate(
        img._id,
        { image: img.image, type: img.type },
        { new: true, runValidators: true }
      );

      if (!updatedImage) {
        return res.status(404).json({
          message: `Image with _id ${img._id} not found`,
        });
      }

      updateResults.push(updatedImage);
    }

    return res.status(200).json({
      message: `Successfully updated ${updateResults.length} images`,
      data: updateResults,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'An error occurred while updating images',
      error: error.message,
    });
  }
};
