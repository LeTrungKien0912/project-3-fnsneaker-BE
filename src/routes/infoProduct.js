import express from "express";
import {
  getInfoProductDetails,
  getProductDetailsById,
  getRelatedProducts,
} from "../controllers/infoProduct.js";

const routerInfoProduct = express.Router();
routerInfoProduct.get("/", getInfoProductDetails);
routerInfoProduct.get("/:productId", getProductDetailsById);
routerInfoProduct.get("/related/:productId", getRelatedProducts);
export default routerInfoProduct;
