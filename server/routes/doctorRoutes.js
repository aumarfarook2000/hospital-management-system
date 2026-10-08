import express from "express";

import {
    createDoctor,
    getDoctors,
    getDoctorById,
    updateDoctor,
    updateDoctorStatus,
    getMyDoctorProfile,
    updateMyDoctorProfile,
} from "../controllers/doctorController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin only

router.post(
    "/",
    protect,
    authorize("admin"),
    createDoctor
);

router.get(
    "/",
    protect,
    authorize(
        "admin",
        "receptionist",
        "doctor",
        "patient"
    ),
    getDoctors
);

router.get(
  "/me",
  protect,
  authorize("doctor"),
  getMyDoctorProfile
);

router.put(
  "/me",
  protect,
  authorize("doctor"),
  updateMyDoctorProfile
);

router.get(
    "/:id",
    protect,
    authorize("admin", "doctor"),
    getDoctorById
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateDoctor
);

router.put(
    "/:id/status",
    protect,
    authorize("admin"),
    updateDoctorStatus
);

export default router;