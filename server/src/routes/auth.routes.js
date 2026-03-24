// import { Router } from "express";
// import { 
//     register, 
//     login, 
//     logout, 
//     refreshToken,
//     googleAuth 
// } from "../controllers/auth.controller.js";
// const router = Router();

// router.post("/register", register);
// router.post("/login", login);
// router.post("/logout", logout);
// router.post("/refresh-token", refreshToken);
// router.post('/google', googleAuth);

// export default router;

import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  googleAuth
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);

router.post("/logout", verifyJWT, logout);

router.post("/refresh-token", refreshToken);

export default router;