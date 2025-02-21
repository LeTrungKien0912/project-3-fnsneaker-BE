import express from "express";
import {
  createFavorite,
  getFavoriteProducts,
  removeFavorite,
} from "../controllers/favorite.js";
import { checkPermission } from "../middlewares/checkPermission.js";

const routerFavourite = express.Router();
routerFavourite.post("/create-favorite", checkPermission, createFavorite);
routerFavourite.get("/:userId", checkPermission, getFavoriteProducts);
routerFavourite.delete("/delete-favorite", checkPermission, removeFavorite);
export default routerFavourite;
