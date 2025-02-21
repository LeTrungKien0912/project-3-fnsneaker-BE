import express from "express";

import { checkPermission } from "../middlewares/checkPermission.js";
import { createImageProduct, deleteImages, getAllImages, getAllImagesByProductId, updateImages } from "../controllers/image.js";

const routerImage = express.Router();
routerImage.get("/:productId", checkPermission, getAllImagesByProductId);
routerImage.get("/", checkPermission, getAllImages);
routerImage.post("/", checkPermission, createImageProduct);
routerImage.delete("/deleteImages", checkPermission, deleteImages);
routerImage.put("/update", checkPermission, updateImages);
export default routerImage;
