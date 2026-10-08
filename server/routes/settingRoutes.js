import express from "express";

import {
    getSettings,
    updateSettings,
} from "../controllers/settingController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// All logged-in users can READ settings
router.get(
    "/",
    protect,
    getSettings
);

// Only Admin can UPDATE settings
router.put(
    "/",
    protect,
    authorize("admin"),
    updateSettings
);

export default router;