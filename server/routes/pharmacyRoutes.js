import express from "express";

import {
    createMedicine,
    getMedicines,
    updateMedicine,
    addMedicineBatch,
    getMedicineStock,
    createPharmacySale,
    getPharmacySales,
    getPharmacySaleById,
    getPharmacyPrescriptions,
    recordPharmacyPayment,
    getPharmacyPaymentHistory,
    addBulkMedicineStock,
} from "../controllers/pharmacyController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ===============================
// MEDICINES
// ===============================

// Add medicine
router.post(
    "/medicines",
    protect,
    authorize("admin", "receptionist"),
    createMedicine
);

// Get medicines
router.get(
    "/medicines",
    protect,
    authorize("admin", "receptionist", "doctor"),
    getMedicines
);

// Update medicine
router.put(
    "/medicines/:id",
    protect,
    authorize("admin", "receptionist"),
    updateMedicine
);

// ===============================
// STOCK / BATCHES
// ===============================

// Add new stock batch
router.post(
    "/stock",
    protect,
    authorize("admin", "receptionist"),
    addMedicineBatch
);

// Add multiple stock batches
router.post(
    "/stock/bulk",
    protect,
    authorize(
        "admin",
        "receptionist"
    ),
    addBulkMedicineStock
);

// Get stock
router.get(
    "/stock",
    protect,
    authorize("admin", "receptionist", "doctor"),
    getMedicineStock
);

// Create pharmacy sale
router.post(
    "/sales",
    protect,
    authorize("admin", "receptionist"),
    createPharmacySale
);
// Pharmacy sales history
router.get(
    "/sales",
    protect,
    authorize("admin", "receptionist", "patient"),
    getPharmacySales
);
// Record payment for pharmacy sale
router.post(
    "/sales/:id/payments",
    protect,
    authorize("admin", "receptionist"),
    recordPharmacyPayment
);

// Pharmacy payment history
router.get(
    "/sales/:id/payments",
    protect,
    authorize(
        "admin",
        "receptionist",
        "patient"
    ),
    getPharmacyPaymentHistory
);
// View one pharmacy sale
router.get(
    "/sales/:id",
    protect,
    authorize("admin", "receptionist", "patient"),
    getPharmacySaleById
);

// Pharmacy-safe prescription lookup
router.get(
    "/prescriptions",
    protect,
    authorize("admin", "receptionist"),
    getPharmacyPrescriptions
);
export default router;