import express from "express";

import {
  createOrder,
  getAllOrders,
  getHistoryStatusOrder,
  getOrderDetail,
  productBestSeller,
  top5BestSellingProducts,
  top5MostProfitableProducts,
  topRevenueProducts,
  updateOrder,
} from "../controllers/order.js";
import checkoutVnpay from "../controllers/vnpay.js";
import { checkPermission } from "../middlewares/checkPermission.js";

const orderRouter = express.Router();
orderRouter.post("/create-order-vnpay", checkoutVnpay.payment);

orderRouter.post(
  "/check-paid-vnpay",

  checkoutVnpay.checkPaymentForVNPay2
);
orderRouter.post("/create-order", checkPermission, createOrder);
orderRouter.get("/orders", checkPermission, getAllOrders);
orderRouter.get("/orders/:orderId", checkPermission, getOrderDetail);
orderRouter.patch("/update-order/:orderId", checkPermission, updateOrder);
orderRouter.get(
  "/order-history/:orderId",
  checkPermission,
  getHistoryStatusOrder
);

orderRouter.get("/product-best-seller", productBestSeller);


// THỐNG KÊ LỌC THEO TUẦN THÁNG NĂM
// top 5 sản phẩm bán chạy
orderRouter.get("/top-5-product-best-seller",checkPermission, top5BestSellingProducts);

// top 5 sản phẩm có doanh thu cao nhất
orderRouter.get("/top-revenue-product",checkPermission, topRevenueProducts)

// top 5 sản phẩm có lợi nhuận cao nhất
orderRouter.get("/topProfitableProducts", checkPermission, top5MostProfitableProducts)
export default orderRouter;