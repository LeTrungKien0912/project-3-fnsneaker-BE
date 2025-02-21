import express from "express";

import { checkPermission } from "../middlewares/checkPermission.js";
import {
  create,
  deleteProductDetail,
  getAllProductDetail,
  getDetailProductDetail,
  updateProductDetail,
} from "../controllers/productDetail.js";

const routerProductDetail = express.Router();
routerProductDetail.get("/", getAllProductDetail);
routerProductDetail.get("/:id", getDetailProductDetail);
routerProductDetail.post("/", checkPermission, create);
routerProductDetail.put("/", checkPermission, updateProductDetail);
routerProductDetail.delete(
  "/:productDetailId",
  checkPermission,
  deleteProductDetail
);
export default routerProductDetail;
