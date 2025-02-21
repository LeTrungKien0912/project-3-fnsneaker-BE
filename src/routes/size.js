import express from "express";

import { checkPermission } from "../middlewares/checkPermission.js";
import {
  create,
  getAll,
  getDetail,
  update,
  remove,
} from "../controllers/size.js";


const routerSize = express.Router();
routerSize.get("/", getAll);
routerSize.get("/:id", getDetail);
routerSize.post("/", checkPermission, create);
routerSize.put("/:id", checkPermission, update);
routerSize.delete("/:id", checkPermission, remove);
export default routerSize;
