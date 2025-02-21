
import Category from "../models/Category.js"
import { categoryValid } from "../validation/category.js"
import ProductDetail from "../models/ProductDetail.js"
import Product from "../models/Product.js"

export const getAll = async (req, res) => {
    try {
        const categories = await Category.find({}).populate("products"); // Lấy danh sách categories và populate products
        
        if (!categories || categories.length === 0) {
            return res.status(404).json({
                message: "No Category"
            });
        }

        // Lặp qua từng category để lấy dữ liệu từ bảng productDetail
        for (const category of categories) {
            let productDetails = [];
            for (const productId of category.products) {
                const details = await ProductDetail.find({ product: productId }); // Tìm các productDetail dựa trên productId
                productDetails = productDetails.concat(details);
            }
            category.productDetails = productDetails; // Gán dữ liệu vào trường productDetails của category
        }

        return res.status(200).json({
            message: "Category has been retrieved successfully",
            data: categories
        });
    } catch (error) {
        return res.status(500).json({
            name: error.name,
            message: error.message
        });
    }
};
// cách 1: k có prdDt 
// export const getAll = async (req, res) => {
//     try {
//         const data = await Category.find({}).populate("products")
//         if(!data || data.length === 0){
//             return res.status(404).json({
//                 message: "No Category"
//             })
//         }
//         return res.status(200).json({
//             message: "Category has been",
//             data: data
//         })
//     } catch (error) {
//         return res.status(500).json({
//             name: error.name,
//             message: error.message
//         })
//     }
// }

export const getDetail = async (req, res) => {
    try {
        const data = await Category.findById(req.params.id).populate("products")
        if(!data){
            return res.status(404).json({
                message: "No Category"
            })
        }
        return res.status(200).json({
            message: "Category has been",
            data: data
        })
    } catch (error) {
        return res.status(500).json({
            name: error.name,
            message: error.message
        })
    }
}

export const create = async (req, res) => {
    try {
        const {error} = categoryValid.validate(req.body, {abortEarly: false})
        if (error) {
            const errors = error.details.map(err => err.message)
            return res.status(400).json({
                message: errors
            })
        }
        const data = await Category.create(req.body)
        if(!data){
            return res.status(404).json({
                message: "Create Category Not Successful"
            })
        }
        return res.status(200).json({
            message: "Create Category Successful",
            data: data
        })
    } catch (error) {
        return res.status(500).json({
            name: error.name,
            message: error.message
        })
    }
}

export const update = async (req, res) => {
    try {
        const {error} = categoryValid.validate(req.body, {abortEarly: false})
        if (error) {
            const errors = error.details.map(err => err.message)
            return res.status(400).json({
                message: errors
            })
        }
        const data = await Category.findByIdAndUpdate(req.params.id, req.body, {new: true})
        if(!data){
            return res.status(404).json({
                message: "Update Category Not Successful"
            })
        }
        return res.status(200).json({
            message: "Update Category Successful",
            data: data
        })
    } catch (error) {
        return res.status(500).json({
            name: error.name,
            message: error.message
        })
    }
}

export const remove = async (req, res) => {
    try {
        // Check if there are products linked to the category
        const hasProducts = await Product.exists({ categoryId: req.params.id });

        if (hasProducts) {
            return res.status(400).json({
                message: "Không thể xóa danh mục có sản phẩm liên kết",
            });
        }

        // If no products are linked, proceed to delete the category
        const data = await Category.findByIdAndDelete(req.params.id);
        if (!data) {
            return res.status(404).json({
                message: "Delete Category Not Successful"
            });
        }

        return res.status(200).json({
            message: "Delete Category Successful",
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            name: error.name,
            message: error.message
        });
    }
};