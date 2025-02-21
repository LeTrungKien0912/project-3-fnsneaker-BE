import express from "express";
import {
  createNew,
  deleteNew,
  getAllNews,
  getNewById,
  updateNew,
} from "../controllers/new.js";
import { checkPermission } from "../middlewares/checkPermission.js";

const routerNew = express.Router();

routerNew.post("/create-news", checkPermission, createNew);
routerNew.get("/get-all-news", getAllNews);
routerNew.get("/get-detail-news/:id", getNewById);
routerNew.put("/update-news/:id", checkPermission, updateNew);
routerNew.delete("/delete-news/:id", checkPermission, deleteNew);

export default routerNew;
