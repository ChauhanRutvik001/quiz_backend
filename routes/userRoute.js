import express from "express";
import {
  Login,
  Logout,
  Register,
  getCurrentUser,
  updateUser
} from "../controllers/user.js";

const router = express.Router();


router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/logout").get(Logout);
router.route("/get-current-user").get(getCurrentUser);
router.route("/update").put(updateUser);

export default router;
