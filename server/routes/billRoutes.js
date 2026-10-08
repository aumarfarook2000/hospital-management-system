import express from "express";

import {
    createBill,
    getBills,
    getBillById,
    recordPayment,
    getPaymentHistory,
} from "../controllers/billController.js";

import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create bill — Admin / Receptionist
router.post(
    "/",
    protect,
    authorize("admin", "receptionist"),
    createBill
);

// View bills
router.get(
    "/",
    protect,
    authorize("admin", "receptionist", "patient"),
    getBills
);

// View payment history
router.get(
    "/:id/payments",
    protect,
    authorize("admin", "receptionist", "patient"),
    getPaymentHistory
);

// View one bill
router.get(
    "/:id",
    protect,
    authorize("admin", "receptionist", "patient"),
    getBillById
);

// Record payment — Admin / Receptionist
router.post(
    "/:id/payments",
    protect,
    authorize("admin", "receptionist"),
    recordPayment
);

export default router;