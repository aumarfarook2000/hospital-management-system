import express from "express";

import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    updateAppointmentStatus,
    bookMyAppointment,
} from "../controllers/appointmentController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create appointment
router.post(
    "/",
    protect,
    authorize("admin", "receptionist"),
    createAppointment
);

// Get appointments
router.get(
    "/",
    protect,
    authorize("admin", "receptionist", "doctor", "patient"),
    getAppointments
);

// Patient books their own appointment
router.post(
  "/my-booking",
  protect,
  authorize("patient"),
  bookMyAppointment
);

// Get appointment by ID
router.get(
    "/:id",
    protect,
    authorize("admin", "receptionist", "doctor", "patient"),
    getAppointmentById
);

// Edit appointment
router.put(
    "/:id",
    protect,
    authorize("admin", "receptionist"),
    updateAppointment
);

// Change appointment status
router.put(
    "/:id/status",
    protect,
    authorize("admin", "receptionist", "doctor"),
    updateAppointmentStatus
);

export default router;