
import express from "express";

import {
  createPatient,
  getPatients,
  getPatientById,
  getDoctorPatientAppointments,
  updatePatient,
  updatePatientStatus,
  getMyPatientProfile,
  updateMyPatientProfile,
  changeMyPatientPassword,
} from "../controllers/patientController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// PATIENT SELF PROFILE

router.get(
  "/me",
  protect,
  authorize("patient"),
  getMyPatientProfile
);

router.put(
  "/me",
  protect,
  authorize("patient"),
  updateMyPatientProfile
);

router.put(
  "/me/password",
  protect,
  authorize("patient"),
  changeMyPatientPassword
);

// ADMIN + RECEPTIONIST CREATE PATIENT

router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  createPatient
);

// ADMIN + RECEPTIONIST + DOCTOR PATIENT LIST

router.get(
  "/",
  protect,
  authorize("admin", "receptionist", "doctor"),
  getPatients
);

// DOCTOR PATIENT APPOINTMENT HISTORY

router.get(
  "/:id/doctor-appointments",
  protect,
  authorize("doctor"),
  getDoctorPatientAppointments
);

// PATIENT DETAILS

router.get(
  "/:id",
  protect,
  authorize("admin", "receptionist", "doctor"),
  getPatientById
);

// ADMIN + RECEPTIONIST UPDATE

router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  updatePatient
);

// ADMIN UPDATE STATUS

router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  updatePatientStatus
);

export default router;
