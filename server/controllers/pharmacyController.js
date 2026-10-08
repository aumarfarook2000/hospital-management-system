import mongoose from "mongoose";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import PharmacySale from "../models/PharmacySale.js";
import Patient from "../models/Patient.js";
import MedicalRecord from "../models/MedicalRecord.js";
import PharmacyPayment from "../models/PharmacyPayment.js";

// ===============================
// CREATE MEDICINE
// ===============================
const createMedicine = async (req, res) => {
    try {
        const {
            name,
            genericName = "",
            category = "",
            manufacturer = "",
            unit = "tablet",
            prescriptionRequired = false,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Medicine name is required.",
            });
        }

        const existingMedicine = await Medicine.findOne({
            name: {
                $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
        });

        if (existingMedicine) {
            return res.status(409).json({
                success: false,
                message: "Medicine already exists.",
            });
        }

        const medicine = await Medicine.create({
            name: name.trim(),
            genericName,
            category,
            manufacturer,
            unit,
            prescriptionRequired,
        });

        return res.status(201).json({
            success: true,
            message: "Medicine created successfully.",
            medicine,
        });
    } catch (error) {
        console.error("Create Medicine Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create medicine.",
        });
    }
};

// ===============================
// GET MEDICINES
// ===============================
const getMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find()
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: medicines.length,
            medicines,
        });
    } catch (error) {
        console.error("Get Medicines Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch medicines.",
        });
    }
};

// ===============================
// UPDATE MEDICINE
// ===============================
const updateMedicine = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine ID.",
            });
        }

        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        const allowedFields = [
            "name",
            "genericName",
            "category",
            "manufacturer",
            "unit",
            "prescriptionRequired",
            "status",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                medicine[field] = req.body[field];
            }
        });

        await medicine.save();

        return res.status(200).json({
            success: true,
            message: "Medicine updated successfully.",
            medicine,
        });
    } catch (error) {
        console.error("Update Medicine Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Medicine already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update medicine.",
        });
    }
};

// ===============================
// ADD STOCK / BATCH
// ===============================
const addMedicineBatch = async (req, res) => {
    try {
        const {
            medicine,
            batchNumber,
            purchasePrice,
            sellingPrice,
            quantity,
            manufactureDate,
            expiryDate,
            supplier = "",
        } = req.body;

        if (!mongoose.isValidObjectId(medicine)) {
            return res.status(400).json({
                success: false,
                message: "Valid medicine is required.",
            });
        }

        const medicineData = await Medicine.findById(medicine);

        if (!medicineData) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        if (medicineData.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Cannot add stock to an inactive medicine.",
            });
        }

        if (!batchNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Batch number is required.",
            });
        }

        const purchase = Number(purchasePrice);
        const selling = Number(sellingPrice);
        const qty = Number(quantity);

        if (
            !Number.isFinite(purchase) ||
            purchase < 0 ||
            !Number.isFinite(selling) ||
            selling < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid purchase or selling price.",
            });
        }

        if (
            !Number.isInteger(qty) ||
            qty <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a whole number greater than zero.",
            });
        }

        if (!expiryDate) {
            return res.status(400).json({
                success: false,
                message: "Expiry date is required.",
            });
        }

        const expiry = new Date(expiryDate);

        if (
            Number.isNaN(expiry.getTime()) ||
            expiry <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Expiry date must be a future date.",
            });
        }

        let manufacture = null;

        if (manufactureDate) {
            manufacture = new Date(manufactureDate);

            if (Number.isNaN(manufacture.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid manufacture date.",
                });
            }

            if (manufacture >= expiry) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Manufacture date must be before expiry date.",
                });
            }
        }

        const existingBatch =
            await MedicineBatch.findOne({
                medicine,
                batchNumber: batchNumber.trim(),
            });

        if (existingBatch) {
            return res.status(409).json({
                success: false,
                message:
                    "This batch already exists for the selected medicine.",
            });
        }

        const batch = await MedicineBatch.create({
            medicine,
            batchNumber: batchNumber.trim(),
            purchasePrice: purchase,
            sellingPrice: selling,
            quantity: qty,
            initialQuantity: qty,
            manufactureDate: manufacture,
            expiryDate: expiry,
            supplier,
        });

        const populatedBatch =
            await MedicineBatch.findById(batch._id)
                .populate(
                    "medicine",
                    "name genericName unit manufacturer"
                );

        return res.status(201).json({
            success: true,
            message: "Medicine stock added successfully.",
            batch: populatedBatch,
        });
    } catch (error) {
        console.error("Add Medicine Batch Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "This batch already exists for the selected medicine.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add medicine stock.",
        });
    }
};
// ===============================
// BULK STOCK ENTRY
// ===============================

const addBulkMedicineStock = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { items } = req.body;

        // -------------------------------
        // BASIC VALIDATION
        // -------------------------------

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one stock item is required.",
            });
        }

        // Prevent excessively large request
        if (items.length > 100) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum 100 stock rows can be added at one time.",
            });
        }

        let createdBatches = [];

        await session.withTransaction(async () => {
            const preparedItems = [];

            // Used to detect duplicate medicine + batch
            // inside the same bulk request.
            const requestBatchKeys = new Set();

            for (let index = 0; index < items.length; index++) {
                const item = items[index];

                const rowNumber = index + 1;

                const {
                    medicine,
                    batchNumber,
                    purchasePrice,
                    sellingPrice,
                    quantity,
                    manufactureDate,
                    expiryDate,
                    supplier = "",
                } = item;

                // -------------------------------
                // MEDICINE ID
                // -------------------------------

                if (!mongoose.isValidObjectId(medicine)) {
                    const error = new Error(
                        `Row ${rowNumber}: Valid medicine is required.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                const medicineData = await Medicine.findById(
                    medicine
                ).session(session);

                if (!medicineData) {
                    const error = new Error(
                        `Row ${rowNumber}: Medicine not found.`
                    );

                    error.statusCode = 404;

                    throw error;
                }

                if (medicineData.status !== "active") {
                    const error = new Error(
                        `Row ${rowNumber}: ${medicineData.name} is inactive.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                // -------------------------------
                // BATCH NUMBER
                // -------------------------------

                if (!batchNumber?.trim()) {
                    const error = new Error(
                        `Row ${rowNumber}: Batch number is required.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                const cleanBatchNumber = batchNumber.trim();

                // Detect duplicate row in same bulk request
                const batchKey =
                    `${medicine}:${cleanBatchNumber.toLowerCase()}`;

                if (requestBatchKeys.has(batchKey)) {
                    const error = new Error(
                        `Row ${rowNumber}: Duplicate batch "${cleanBatchNumber}" for ${medicineData.name} in this bulk entry.`
                    );

                    error.statusCode = 409;

                    throw error;
                }

                requestBatchKeys.add(batchKey);

                // -------------------------------
                // PRICES
                // -------------------------------

                const purchase = Number(purchasePrice);
                const selling = Number(sellingPrice);

                if (
                    !Number.isFinite(purchase) ||
                    purchase < 0 ||
                    !Number.isFinite(selling) ||
                    selling < 0
                ) {
                    const error = new Error(
                        `Row ${rowNumber}: Invalid purchase or selling price.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                // -------------------------------
                // QUANTITY
                // -------------------------------

                const qty = Number(quantity);

                if (
                    !Number.isInteger(qty) ||
                    qty <= 0
                ) {
                    const error = new Error(
                        `Row ${rowNumber}: Quantity must be a whole number greater than zero.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                // -------------------------------
                // EXPIRY DATE
                // -------------------------------

                if (!expiryDate) {
                    const error = new Error(
                        `Row ${rowNumber}: Expiry date is required.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                const expiry = new Date(expiryDate);

                if (
                    Number.isNaN(expiry.getTime()) ||
                    expiry <= new Date()
                ) {
                    const error = new Error(
                        `Row ${rowNumber}: Expiry date must be a future date.`
                    );

                    error.statusCode = 400;

                    throw error;
                }

                // -------------------------------
                // MANUFACTURE DATE
                // -------------------------------

                let manufacture = null;

                if (manufactureDate) {
                    manufacture = new Date(manufactureDate);

                    if (
                        Number.isNaN(
                            manufacture.getTime()
                        )
                    ) {
                        const error = new Error(
                            `Row ${rowNumber}: Invalid manufacture date.`
                        );

                        error.statusCode = 400;

                        throw error;
                    }

                    if (manufacture >= expiry) {
                        const error = new Error(
                            `Row ${rowNumber}: Manufacture date must be before expiry date.`
                        );

                        error.statusCode = 400;

                        throw error;
                    }
                }

                // -------------------------------
                // CHECK EXISTING DATABASE BATCH
                // -------------------------------

                const existingBatch =
                    await MedicineBatch.findOne({
                        medicine,
                        batchNumber: cleanBatchNumber,
                    }).session(session);

                if (existingBatch) {
                    const error = new Error(
                        `Row ${rowNumber}: Batch "${cleanBatchNumber}" already exists for ${medicineData.name}.`
                    );

                    error.statusCode = 409;

                    throw error;
                }

                // -------------------------------
                // PREPARE BATCH
                // -------------------------------

                preparedItems.push({
                    medicine,
                    batchNumber: cleanBatchNumber,

                    purchasePrice: purchase,
                    sellingPrice: selling,

                    quantity: qty,
                    initialQuantity: qty,

                    manufactureDate: manufacture,
                    expiryDate: expiry,

                    supplier:
                        typeof supplier === "string"
                            ? supplier.trim()
                            : "",
                });
            }

            // -------------------------------
            // CREATE ALL BATCHES
            // -------------------------------

            createdBatches =
                await MedicineBatch.insertMany(
                    preparedItems,
                    {
                        session,
                    }
                );
        });

        // -------------------------------
        // POPULATE CREATED BATCHES
        // -------------------------------

        const batchIds = createdBatches.map(
            (batch) => batch._id
        );

        const populatedBatches =
            await MedicineBatch.find({
                _id: {
                    $in: batchIds,
                },
            })
                .populate(
                    "medicine",
                    "name genericName category manufacturer unit status"
                )
                .sort({
                    createdAt: 1,
                });

        return res.status(201).json({
            success: true,

            message:
                `${populatedBatches.length} stock batch${
                    populatedBatches.length === 1
                        ? ""
                        : "es"
                } added successfully.`,

            count: populatedBatches.length,

            batches: populatedBatches,
        });
    } catch (error) {
        console.error(
            "Bulk Medicine Stock Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,

                message:
                    "One of the medicine batches already exists.",
            });
        }

        return res
            .status(error.statusCode || 500)
            .json({
                success: false,

                message:
                    error.statusCode
                        ? error.message
                        : "Failed to add bulk medicine stock.",
            });
    } finally {
        await session.endSession();
    }
};
// ===============================
// GET STOCK
// ===============================
const getMedicineStock = async (req, res) => {
    try {
        const batches = await MedicineBatch.find()
            .populate(
                "medicine",
                "name genericName category manufacturer unit status"
            )
            .sort({
                expiryDate: 1,
            });

        return res.status(200).json({
            success: true,
            count: batches.length,
            batches,
        });
    } catch (error) {
        console.error("Get Medicine Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch medicine stock.",
        });
    }
};
// ===============================
// CREATE PHARMACY SALE
// ===============================
const createPharmacySale = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            patient,
            medicalRecord = null,
            items,
            discount = 0,
            paidAmount = 0,
            paymentMethod = "cash",
            notes = "",
        } = req.body;

        // -------------------------------
        // BASIC VALIDATION
        // -------------------------------

        if (!mongoose.isValidObjectId(patient)) {
            return res.status(400).json({
                success: false,
                message: "Valid patient is required.",
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one medicine is required.",
            });
        }

        const discountValue = Number(discount);
        const paidValue = Number(paidAmount);

        if (
            !Number.isFinite(discountValue) ||
            discountValue < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid discount.",
            });
        }

        if (
            !Number.isFinite(paidValue) ||
            paidValue < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid paid amount.",
            });
        }

        const allowedPaymentMethods = [
            "cash",
            "upi",
            "card",
            "bank_transfer",
            "other",
        ];

        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method.",
            });
        }

        // -------------------------------
        // CHECK PATIENT
        // -------------------------------

        const patientData = await Patient.findById(patient);

        if (!patientData) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }

        if (patientData.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Patient is inactive.",
            });
        }

        // -------------------------------
        // OPTIONAL PRESCRIPTION
        // -------------------------------

        let medicalRecordId = null;

        if (medicalRecord) {
            if (!mongoose.isValidObjectId(medicalRecord)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid medical record.",
                });
            }

            const record = await MedicalRecord.findById(
                medicalRecord
            );

            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: "Medical record not found.",
                });
            }

            if (
                record.patient.toString() !==
                patientData._id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Prescription does not belong to this patient.",
                });
            }

            medicalRecordId = record._id;
        }

        let createdSale;

        await session.withTransaction(async () => {
            const saleItems = [];
            let subtotal = 0;

            // ---------------------------------
            // PROCESS EACH MEDICINE
            // ---------------------------------

            for (const item of items) {
                if (!mongoose.isValidObjectId(item.medicine)) {
                    const error = new Error(
                        "Invalid medicine selected."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                const requestedQuantity = Number(item.quantity);

                if (
                    !Number.isInteger(requestedQuantity) ||
                    requestedQuantity <= 0
                ) {
                    const error = new Error(
                        "Medicine quantity must be a whole number greater than zero."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                const medicineData =
                    await Medicine.findById(
                        item.medicine
                    ).session(session);

                if (!medicineData) {
                    const error = new Error(
                        "Medicine not found."
                    );
                    error.statusCode = 404;
                    throw error;
                }

                if (medicineData.status !== "active") {
                    const error = new Error(
                        `${medicineData.name} is inactive.`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // ---------------------------------
                // FEFO:
                // Earliest expiry batch first
                // ---------------------------------

                const batches = await MedicineBatch.find({
                    medicine: medicineData._id,
                    status: "active",
                    quantity: { $gt: 0 },
                    expiryDate: { $gt: new Date() },
                })
                    .sort({ expiryDate: 1 })
                    .session(session);

                const availableQuantity = batches.reduce(
                    (sum, batch) =>
                        sum + Number(batch.quantity),
                    0
                );

                if (availableQuantity < requestedQuantity) {
                    const error = new Error(
                        `Insufficient stock for ${medicineData.name}. Available: ${availableQuantity}`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                let remainingQuantity = requestedQuantity;

                // A single requested medicine can come
                // from multiple batches.
                for (const batch of batches) {
                    if (remainingQuantity <= 0) break;

                    const quantityFromBatch = Math.min(
                        batch.quantity,
                        remainingQuantity
                    );

                    const amount =
                        quantityFromBatch *
                        Number(batch.sellingPrice);

                    saleItems.push({
                        medicine: medicineData._id,
                        batch: batch._id,
                        quantity: quantityFromBatch,
                        unitPrice: batch.sellingPrice,
                        amount,
                    });

                    subtotal += amount;

                    batch.quantity -= quantityFromBatch;

                    await batch.save({ session });

                    remainingQuantity -= quantityFromBatch;
                }
            }

            // ---------------------------------
            // TOTALS
            // ---------------------------------

            if (discountValue > subtotal) {
                const error = new Error(
                    "Discount cannot exceed subtotal."
                );
                error.statusCode = 400;
                throw error;
            }

            const totalAmount =
                subtotal - discountValue;

            if (paidValue > totalAmount) {
                const error = new Error(
                    "Paid amount cannot exceed total amount."
                );
                error.statusCode = 400;
                throw error;
            }

            const balanceAmount =
                totalAmount - paidValue;

            let paymentStatus = "unpaid";

            if (
                paidValue > 0 &&
                balanceAmount > 0
            ) {
                paymentStatus = "partial";
            }

            if (balanceAmount === 0) {
                paymentStatus = "paid";
            }

            // Unique practical sale ID
            const saleObjectId =
                new mongoose.Types.ObjectId();

            const saleId = `SALE-${saleObjectId
                .toString()
                .slice(-8)
                .toUpperCase()}`;

            const sales = await PharmacySale.create(
    [
        {
            _id: saleObjectId,
            saleId,
            patient: patientData._id,
            medicalRecord: medicalRecordId,
            items: saleItems,
            subtotal,
            discount: discountValue,
            totalAmount,
            paidAmount: paidValue,
            balanceAmount,
            paymentStatus,
            paymentMethod,
            notes,
            soldBy: req.user._id,
        },
    ],
    { session }
);

createdSale = sales[0];

// ---------------------------------
// SAVE INITIAL PAYMENT HISTORY
// ---------------------------------

if (paidValue > 0) {
    const paymentObjectId =
        new mongoose.Types.ObjectId();

    const paymentId = `PPAY-${paymentObjectId
        .toString()
        .slice(-8)
        .toUpperCase()}`;

    await PharmacyPayment.create(
        [
            {
                _id: paymentObjectId,
                paymentId,
                sale: createdSale._id,
                amount: paidValue,
                paymentMethod,
                receivedBy: req.user._id,
            },
        ],
        { session }
    );
}
        });

        const populatedSale =
            await PharmacySale.findById(
                createdSale._id
            )
                .populate({
                    path: "patient",
                    populate: {
                        path: "user",
                        select: "name email mobile",
                    },
                })
                .populate(
                    "items.medicine",
                    "name genericName unit manufacturer"
                )
                .populate(
                    "items.batch",
                    "batchNumber expiryDate"
                )
                .populate(
                    "soldBy",
                    "name role"
                );

        return res.status(201).json({
            success: true,
            message: "Medicine sale completed successfully.",
            sale: populatedSale,
        });
    } catch (error) {
        console.error(
            "Create Pharmacy Sale Error:",
            error
        );

        return res
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.statusCode
                        ? error.message
                        : "Failed to complete medicine sale.",
            });
    } finally {
        await session.endSession();
    }
};
// ===============================
// GET PHARMACY SALES
// ===============================
const getPharmacySales = async (req, res) => {
    try {
        const filter = {};

        // Patient can see only their own purchases
        if (req.user.role === "patient") {
            const patient = await Patient.findOne({
                user: req.user._id,
            });

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: "Patient profile not found.",
                });
            }

            filter.patient = patient._id;
        } else if (
            !["admin", "receptionist"].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission.",
            });
        }

        const sales = await PharmacySale.find(filter)
            .populate({
                path: "patient",
                populate: {
                    path: "user",
                    select: "name email mobile",
                },
            })
            .populate(
                "medicalRecord",
                "medicalRecordId diagnosis prescription"
            )
            .populate(
                "items.medicine",
                "name genericName unit manufacturer"
            )
            .populate(
                "items.batch",
                "batchNumber expiryDate"
            )
            .populate(
                "soldBy",
                "name role"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: sales.length,
            sales,
        });
    } catch (error) {
        console.error("Get Pharmacy Sales Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pharmacy sales.",
        });
    }
};

// ===============================
// GET PHARMACY SALE BY ID
// ===============================
const getPharmacySaleById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sale ID.",
            });
        }

        const sale = await PharmacySale.findById(req.params.id)
            .populate({
                path: "patient",
                populate: {
                    path: "user",
                    select: "name email mobile",
                },
            })
            .populate(
                "medicalRecord",
                "medicalRecordId diagnosis prescription"
            )
            .populate(
                "items.medicine",
                "name genericName unit manufacturer"
            )
            .populate(
                "items.batch",
                "batchNumber expiryDate"
            )
            .populate(
                "soldBy",
                "name role"
            );

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy sale not found.",
            });
        }

        // Patient ownership check
        if (req.user.role === "patient") {
            const patient = await Patient.findOne({
                user: req.user._id,
            });

            if (
                !patient ||
                sale.patient._id.toString() !==
                    patient._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission.",
                });
            }
        } else if (
            !["admin", "receptionist"].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission.",
            });
        }

        return res.status(200).json({
            success: true,
            sale,
        });
    } catch (error) {
        console.error("Get Pharmacy Sale Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pharmacy sale.",
        });
    }
};
// ===============================
// GET PHARMACY PRESCRIPTIONS
// ===============================
const getPharmacyPrescriptions = async (req, res) => {
    try {
        const filter = {};

        // Optional patient filter:
        // /pharmacy/prescriptions?patient=PATIENT_MONGODB_ID
        if (req.query.patient) {
            if (!mongoose.isValidObjectId(req.query.patient)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid patient ID.",
                });
            }

            filter.patient = req.query.patient;
        }

        const records = await MedicalRecord.find(filter)
            .select(
                "medicalRecordId patient prescription createdAt"
            )
            .populate({
                path: "patient",
                select: "patientId user",
                populate: {
                    path: "user",
                    select: "name",
                },
            })
            .sort({ createdAt: -1 });

        // Only return pharmacy-required information
        const prescriptions = records.map((record) => ({
            _id: record._id,
            medicalRecordId: record.medicalRecordId,

            patient: record.patient
                ? {
                      _id: record.patient._id,
                      patientId:
                          record.patient.patientId,
                      name:
                          record.patient.user?.name ||
                          "",
                  }
                : null,

            prescription:
                record.prescription || [],

            prescriptionDate:
                record.createdAt,
        }));

        return res.status(200).json({
            success: true,
            count: prescriptions.length,
            prescriptions,
        });
    } catch (error) {
        console.error(
            "Get Pharmacy Prescriptions Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch prescriptions.",
        });
    }
};
// ===============================
// RECORD PHARMACY PAYMENT
// ===============================
const recordPharmacyPayment = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            amount,
            paymentMethod,
            referenceNumber = "",
            notes = "",
        } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid pharmacy sale ID.",
            });
        }

        const paymentAmount = Number(amount);

        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than zero.",
            });
        }

        const allowedMethods = [
            "cash",
            "upi",
            "card",
            "bank_transfer",
            "other",
        ];

        if (!allowedMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method.",
            });
        }

        let createdPayment;
        let updatedSale;

        await session.withTransaction(async () => {
            const sale = await PharmacySale.findById(
                req.params.id
            ).session(session);

            if (!sale) {
                const error = new Error(
                    "Pharmacy sale not found."
                );
                error.statusCode = 404;
                throw error;
            }

            if (sale.balanceAmount <= 0) {
                const error = new Error(
                    "This pharmacy sale is already fully paid."
                );
                error.statusCode = 400;
                throw error;
            }

            if (paymentAmount > sale.balanceAmount) {
                const error = new Error(
                    `Payment cannot exceed balance amount ₹${Number(
                        sale.balanceAmount
                    ).toFixed(2)}.`
                );

                error.statusCode = 400;
                throw error;
            }

            const paymentObjectId =
                new mongoose.Types.ObjectId();

            const paymentId = `PPAY-${paymentObjectId
                .toString()
                .slice(-8)
                .toUpperCase()}`;

            const payments =
                await PharmacyPayment.create(
                    [
                        {
                            _id: paymentObjectId,
                            paymentId,
                            sale: sale._id,
                            amount: paymentAmount,
                            paymentMethod,
                            referenceNumber:
                                referenceNumber.trim(),
                            notes: notes.trim(),
                            receivedBy: req.user._id,
                        },
                    ],
                    { session }
                );

            createdPayment = payments[0];

            sale.paidAmount =
                Number(sale.paidAmount || 0) +
                paymentAmount;

            sale.balanceAmount = Math.max(
                0,
                Number(sale.totalAmount || 0) -
                    sale.paidAmount
            );

            if (sale.balanceAmount === 0) {
                sale.paymentStatus = "paid";
            } else if (sale.paidAmount > 0) {
                sale.paymentStatus = "partial";
            } else {
                sale.paymentStatus = "unpaid";
            }

            sale.paymentMethod = paymentMethod;

            await sale.save({ session });

            updatedSale = sale;
        });

        const payment =
            await PharmacyPayment.findById(
                createdPayment._id
            ).populate(
                "receivedBy",
                "name role"
            );

        const sale = await PharmacySale.findById(
            updatedSale._id
        )
            .populate({
                path: "patient",
                populate: {
                    path: "user",
                    select: "name email mobile",
                },
            })
            .populate(
                "items.medicine",
                "name genericName unit manufacturer"
            )
            .populate(
                "items.batch",
                "batchNumber expiryDate"
            );

        return res.status(201).json({
            success: true,
            message:
                "Pharmacy payment recorded successfully.",
            payment,
            sale,
        });
    } catch (error) {
        console.error(
            "Record Pharmacy Payment Error:",
            error
        );

        return res
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.statusCode
                        ? error.message
                        : "Failed to record pharmacy payment.",
            });
    } finally {
        await session.endSession();
    }
};


// ===============================
// GET PHARMACY PAYMENT HISTORY
// ===============================
const getPharmacyPaymentHistory = async (
    req,
    res
) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid pharmacy sale ID.",
            });
        }

        const sale = await PharmacySale.findById(
            req.params.id
        ).populate({
            path: "patient",
            populate: {
                path: "user",
                select: "name email mobile",
            },
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy sale not found.",
            });
        }

        // Patient can only see their own payments
        if (req.user.role === "patient") {
            const patient = await Patient.findOne({
                user: req.user._id,
            });

            if (
                !patient ||
                sale.patient._id.toString() !==
                    patient._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have permission.",
                });
            }
        }

        const payments =
            await PharmacyPayment.find({
                sale: sale._id,
            })
                .populate(
                    "receivedBy",
                    "name role"
                )
                .sort({ paidAt: 1 });

        return res.status(200).json({
            success: true,
            count: payments.length,
            sale: {
                _id: sale._id,
                saleId: sale.saleId,
                totalAmount: sale.totalAmount,
                paidAmount: sale.paidAmount,
                balanceAmount:
                    sale.balanceAmount,
                paymentStatus:
                    sale.paymentStatus,
            },
            payments,
        });
    } catch (error) {
        console.error(
            "Get Pharmacy Payment History Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch pharmacy payment history.",
        });
    }
};
export {
    createMedicine,
    getMedicines,
    updateMedicine,

    addMedicineBatch,
    addBulkMedicineStock,
    getMedicineStock,

    createPharmacySale,
    getPharmacySales,
    getPharmacySaleById,
    getPharmacyPrescriptions,

    recordPharmacyPayment,
    getPharmacyPaymentHistory,
};