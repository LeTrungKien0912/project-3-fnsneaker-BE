import express from "express";

import { checkPermission } from "../middlewares/checkPermission.js";
import { getAllPurchaseHistory } from "../controllers/purchasehistory.js";

const routerpurchasehistory = express.Router();
routerpurchasehistory.get(
  "/purchase-history/:userId",
  checkPermission,
  getAllPurchaseHistory
);
export default routerpurchasehistory;
