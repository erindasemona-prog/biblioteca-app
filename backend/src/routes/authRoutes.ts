import { Router } from "express";
import { login, loginBrowser, loginGet, register, registerGet } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.get("/register", registerGet);
router.post("/login", login);
router.get("/login", loginGet);
router.get("/login-browser", loginBrowser);
router.get("/login-test", (_req, res) => {
  res.send("Login route funziona");
});

export default router;
