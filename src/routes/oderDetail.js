import express from "express";
import { createOrderDetail } from "../controllers/oderDetail.js";
const ordeDetailRouter = express.Router();
ordeDetailRouter.post("/", createOrderDetail);
export default ordeDetailRouter;
