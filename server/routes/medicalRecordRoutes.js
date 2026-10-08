import express from "express";

import {
    createMedicalRecord,
    getMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
} from "../controllers/medicalRecordController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create consultation record — Doctor only
router.post(
    "/",
    protect,
    authorize("doctor"),
    createMedicalRecord
);

// View records — Admin, Doctor, Patient
router.get(
    "/",
    protect,
    authorize("admin", "doctor", "patient"),
    getMedicalRecords
);

// View one record
router.get(
    "/:id",
    protect,
    authorize("admin", "doctor", "patient"),
    getMedicalRecordById
);

// Update consultation record — Doctor only
router.put(
    "/:id",
    protect,
    authorize("doctor"),
    updateMedicalRecord
);

export default router;