
import express from "express";

import {
    getUsers,
    getUsersByRole,
    createStaffUser,
    updateUserStatus,
    updateStaff,
    getMyStaffProfile,
    updateMyStaffProfile,
    changeMyStaffPassword,
} from "../controllers/userController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// RECEPTIONIST SELF PROFILE

router.get(
    "/me",
    protect,
    authorize("receptionist"),
    getMyStaffProfile
);

router.put(
    "/me",
    protect,
    authorize("receptionist"),
    updateMyStaffProfile
);

router.put(
    "/me/password",
    protect,
    authorize("receptionist"),
    changeMyStaffPassword
);

// ADMIN USER MANAGEMENT

router.get(
    "/",
    protect,
    authorize("admin"),
    getUsers
);

router.get(
    "/role/:role",
    protect,
    authorize("admin"),
    getUsersByRole
);

router.post(
    "/staff",
    protect,
    authorize("admin"),
    createStaffUser
);

router.put(
    "/:id/status",
    protect,
    authorize("admin"),
    updateUserStatus
);

router.put(
    "/staff/:id",
    protect,
    authorize("admin"),
    updateStaff
);

export default router;
