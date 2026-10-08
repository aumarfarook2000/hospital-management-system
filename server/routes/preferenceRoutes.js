import express from "express";

import {
    getMyPreferences,
    updateMyPreferences,
} from "../controllers/preferenceController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// All logged-in users can access their own preferences

router.get(
    "/me",
    protect,
    getMyPreferences
);

router.put(
    "/me",
    protect,
    updateMyPreferences
);

export default router;