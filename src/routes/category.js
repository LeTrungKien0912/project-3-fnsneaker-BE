import express from "express";

import { checkPermission } from "../middlewares/checkPermission.js";
import {
  create,
  getAll,
  getDetail,
  remove,
  update,
} from "../controllers/category.js";

const routerCategories = express.Router();
routerCategories.get("/", getAll);
routerCategories.get("/:id", getDetail);
routerCategories.post("/", checkPermission, create);
routerCategories.put("/:id", checkPermission, update);
routerCategories.delete("/:id", checkPermission, remove);
export default routerCategories;
