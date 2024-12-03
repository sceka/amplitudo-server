import express from "express";
import authRoutes from "./routes/auth";
import registerRoutes from "./routes/register";
import userRoutes from "./routes/user";
import linkFormRoutes from "./routes/linkForm";
import searchRoutes from "./routes/search";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/register", registerRoutes);
router.use("/user", userRoutes);
router.use("/form", linkFormRoutes);
router.use("/search", searchRoutes);
export default router;
