import express from "express"
import {Router} from "express"
import { blockUser, changePassword, forgotPassword, getAllAccount, getDetailAccount, signIn, signUp, unlockUser, updateUser, updateUserAdmin,  } from "../controllers/auth.js"
import { checkPermission } from "../middlewares/checkPermission.js"

const routerAuth = Router()
routerAuth.post('/signup', signUp)
routerAuth.post('/signin', signIn)
routerAuth.put('/users/:userId', checkPermission, updateUser);
routerAuth.put('/user-admin/:userId', checkPermission, updateUserAdmin);
routerAuth.put('/user-block/:userId', checkPermission, blockUser);
routerAuth.get('/get-all-account', checkPermission, getAllAccount);
routerAuth.get('/get-detail-account/:userId', checkPermission, getDetailAccount);
routerAuth.put('/user-unblock/:userId', checkPermission, unlockUser);
routerAuth.put("/change-password/:userId", checkPermission, changePassword);
routerAuth.post("/forgot-password", forgotPassword);
export default routerAuth