import express from "express";
import routerProduct from "./product.js";
import routerAuth from "./auth.js";
import routerCategories from "./category.js";
import routerSize from "./size.js";
import routerProductDetail from "./productDetail.js";
import routerImage from "./image.js";
import orderRouter from "./order.js";
import routerInfoProduct from "./infoProduct.js";
import routerCart from "./cart.js";
import ordeDetailRouter from "./oderDetail.js";
import routerpurchasehistory from "./purchasehistory.js";
import routerReview from "./review.js";
import routerFavourite from "./favourite.js";
import routerNew from "./new.js";

const router = express.Router();
router.use("/product", routerProduct);
router.use("/categories", routerCategories);
router.use("/auth", routerAuth);
router.use("/size", routerSize);
router.use("/productDetail", routerProductDetail);
router.use("/image", routerImage);
router.use("/order", orderRouter);
router.use("/infoProduct", routerInfoProduct);
router.use("/cart", routerCart);
router.use("/oderDetail", ordeDetailRouter);
router.use("/purchaseHistory", routerpurchasehistory);
router.use("/review", routerReview);
router.use("/favourite", routerFavourite);
router.use("/news", routerNew); // Sử dụng routerNew

export default router;
