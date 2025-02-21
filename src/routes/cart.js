import express from "express";

import { checkPermission } from "../middlewares/checkPermission.js";
import { createCart, deleteCart, getCart, updateCart } from "../controllers/cart.js";



const routerCart = express.Router();
routerCart.post("/", checkPermission, createCart);
routerCart.get("/:idUser", checkPermission, getCart)
routerCart.delete("/deteCart", checkPermission, deleteCart)
routerCart.put("/updateCart", checkPermission, updateCart);
export default routerCart;
