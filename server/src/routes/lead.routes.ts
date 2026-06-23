import { Router } from "express";
import { createLead } from "../controllers/lead.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = Router();
router.post("/lead", protect, createLead);
export default router;