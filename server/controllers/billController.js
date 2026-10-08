import mongoose from "mongoose";

import Bill from "../models/Bill.js";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Payment from "../models/Payment.js";
import Setting from "../models/Setting.js";

// ==========================================
// POPULATE BILL
// ==========================================

const populateBill = (query) =>
    query
        .populate({
            path: "patient",
            populate: {
                path: "user",
                select: "name email mobile",
            },
        })
        .populate({
            path: "appointment",
            select:
                "appointmentId appointmentDate appointmentTime status",
        })
        .populate(
            "createdBy",
            "name role"
        );

// ==========================================
// ROUND MONEY
// ==========================================

const roundMoney = (value) =>
    Math.round(
        (Number(value) +
            Number.EPSILON) *
            100
    ) / 100;

// ==========================================
// GET BILLING SETTINGS
// ==========================================

const getBillingSettings =
    async () => {
        const settings =
            await Setting.findOne();

        return {
            taxPercentage:
                Number(
                    settings
                        ?.taxPercentage
                ) || 0,

            invoicePrefix:
                settings
                    ?.invoicePrefix
                    ?.trim()
                    ?.toUpperCase() ||
                "INV",

            currency:
                settings
                    ?.currency ||
                "INR",
        };
    };

// ==========================================
// CALCULATE TOTALS
// ==========================================

const calculateTotals = (
    items,
    discount = 0,
    taxPercentage = 0,
    paidAmount = 0
) => {
    const subtotal =
        roundMoney(
            items.reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    Number(
                        item.amount ||
                            0
                    ),
                0
            )
        );

    const discountValue =
        roundMoney(
            Number(discount) ||
                0
        );

    const taxableAmount =
        roundMoney(
            Math.max(
                0,
                subtotal -
                    discountValue
            )
        );

    const taxRate =
        Math.max(
            0,
            Number(
                taxPercentage
            ) || 0
        );

    const taxAmount =
        roundMoney(
            taxableAmount *
                (taxRate / 100)
        );

    const totalAmount =
        roundMoney(
            taxableAmount +
                taxAmount
        );

    const paidValue =
        roundMoney(
            Number(
                paidAmount
            ) || 0
        );

    const balanceAmount =
        roundMoney(
            Math.max(
                0,
                totalAmount -
                    paidValue
            )
        );

    const paymentStatus =
        balanceAmount === 0
            ? "paid"
            : paidValue > 0
              ? "partial"
              : "unpaid";

    return {
        subtotal,
        discount:
            discountValue,
        taxableAmount,
        taxPercentage:
            taxRate,
        taxAmount,
        totalAmount,
        paidAmount:
            paidValue,
        balanceAmount,
        paymentStatus,
    };
};

// ==========================================
// GENERATE BILL ID
// ==========================================

const generateBillId =
    async (
        invoicePrefix
    ) => {
        const prefix =
            String(
                invoicePrefix ||
                    "INV"
            )
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-Z0-9_-]/g,
                    ""
                ) || "INV";

        /*
         * Find the latest bill using
         * the CURRENT prefix.
         *
         * This means changing the
         * prefix in Settings starts a
         * new numbering sequence.
         */

        const escapedPrefix =
            prefix.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        const lastBill =
            await Bill.findOne({
                billId: {
                    $regex:
                        new RegExp(
                            `^${escapedPrefix}-\\d+$`
                        ),
                },
            }).sort({
                createdAt: -1,
            });

        let nextNumber = 1;

        if (lastBill) {
            const match =
                lastBill.billId.match(
                    /(\d+)$/
                );

            if (match) {
                nextNumber =
                    Number(
                        match[1]
                    ) + 1;
            }
        }

        return `${prefix}-${String(
            nextNumber
        ).padStart(6, "0")}`;
    };

// ==========================================
// CREATE BILL
// ==========================================

const createBill = async (
    req,
    res
) => {
    try {
        const {
            appointment,
            items = [],
            discount = 0,
            notes = "",
        } = req.body;

        // ----------------------------------
        // VALIDATE APPOINTMENT ID
        // ----------------------------------

        if (
            !mongoose.isValidObjectId(
                appointment
            )
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Valid appointment is required.",
                });
        }

        // ----------------------------------
        // FIND APPOINTMENT
        // ----------------------------------

        const appointmentData =
            await Appointment.findById(
                appointment
            );

        if (
            !appointmentData
        ) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Appointment not found.",
                });
        }

        // ----------------------------------
        // PREVENT DUPLICATE BILL
        // ----------------------------------

        const existingBill =
            await Bill.findOne({
                appointment,
            });

        if (existingBill) {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "A bill already exists for this appointment.",
                });
        }

        // ----------------------------------
        // VALIDATE ITEMS
        // ----------------------------------

        if (
            !Array.isArray(
                items
            ) ||
            items.length === 0
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "At least one bill item is required.",
                });
        }

        const normalizedItems =
            [];

        for (
            const item of items
        ) {
            const quantity =
                Number(
                    item.quantity
                );

            const unitPrice =
                Number(
                    item.unitPrice
                );

            if (
                !item.description
                    ?.trim() ||
                !Number.isFinite(
                    quantity
                ) ||
                quantity <= 0 ||
                !Number.isFinite(
                    unitPrice
                ) ||
                unitPrice < 0
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,
                        message:
                            "Invalid bill item.",
                    });
            }

            normalizedItems.push({
                description:
                    item.description.trim(),

                quantity,

                unitPrice:
                    roundMoney(
                        unitPrice
                    ),

                amount:
                    roundMoney(
                        quantity *
                            unitPrice
                    ),
            });
        }

        // ----------------------------------
        // VALIDATE DISCOUNT
        // ----------------------------------

        const discountValue =
            Number(discount);

        if (
            !Number.isFinite(
                discountValue
            ) ||
            discountValue < 0
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid discount.",
                });
        }

        const subtotal =
            roundMoney(
                normalizedItems.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        item.amount,
                    0
                )
            );

        if (
            discountValue >
            subtotal
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Discount cannot exceed subtotal.",
                });
        }

        // ----------------------------------
        // LOAD ADMIN BILLING SETTINGS
        // ----------------------------------

        const billingSettings =
            await getBillingSettings();

        // ----------------------------------
        // CALCULATE TOTALS
        // ----------------------------------

        const totals =
            calculateTotals(
                normalizedItems,
                discountValue,
                billingSettings.taxPercentage
            );

        // ----------------------------------
        // GENERATE INVOICE ID
        // ----------------------------------

        const billId =
            await generateBillId(
                billingSettings.invoicePrefix
            );

        // ----------------------------------
        // CREATE BILL
        // ----------------------------------

        const bill =
            await Bill.create({
                billId,

                patient:
                    appointmentData.patient,

                appointment,

                items:
                    normalizedItems,

                ...totals,

                notes:
                    String(
                        notes || ""
                    ).trim(),

                createdBy:
                    req.user._id,
            });

        const populatedBill =
            await populateBill(
                Bill.findById(
                    bill._id
                )
            );

        return res
            .status(201)
            .json({
                success: true,

                message:
                    "Bill created successfully.",

                bill:
                    populatedBill,

                currency:
                    billingSettings.currency,
            });
    } catch (error) {
        console.error(
            "Create Bill Error:",
            error
        );

        // Duplicate unique bill ID
        if (
            error?.code ===
            11000
        ) {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "Invoice number conflict. Please try creating the bill again.",
                });
        }

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Failed to create bill.",
            });
    }
};

// ==========================================
// GET BILLS
// ==========================================

const getBills = async (
    req,
    res
) => {
    try {
        const filter = {};

        if (
            req.user.role ===
            "patient"
        ) {
            const patient =
                await Patient.findOne({
                    user:
                        req.user._id,
                });

            if (!patient) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,
                        message:
                            "Patient profile not found.",
                    });
            }

            filter.patient =
                patient._id;
        } else if (
            ![
                "admin",
                "receptionist",
            ].includes(
                req.user.role
            )
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "You do not have permission.",
                });
        }

        const bills =
            await populateBill(
                Bill.find(
                    filter
                ).sort({
                    createdAt:
                        -1,
                })
            );

        return res
            .status(200)
            .json({
                success: true,
                count:
                    bills.length,
                bills,
            });
    } catch (error) {
        console.error(
            "Get Bills Error:",
            error
        );

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Failed to fetch bills.",
            });
    }
};

// ==========================================
// GET BILL BY ID
// ==========================================

const getBillById =
    async (req, res) => {
        try {
            if (
                !mongoose.isValidObjectId(
                    req.params.id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,
                        message:
                            "Invalid bill ID.",
                    });
            }

            const bill =
                await Bill.findById(
                    req.params.id
                );

            if (!bill) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,
                        message:
                            "Bill not found.",
                    });
            }

            // PATIENT ACCESS

            if (
                req.user.role ===
                "patient"
            ) {
                const patient =
                    await Patient.findOne(
                        {
                            user:
                                req
                                    .user
                                    ._id,
                        }
                    );

                if (
                    !patient ||
                    bill.patient.toString() !==
                        patient._id.toString()
                ) {
                    return res
                        .status(403)
                        .json({
                            success:
                                false,
                            message:
                                "You do not have permission.",
                        });
                }
            } else if (
                ![
                    "admin",
                    "receptionist",
                ].includes(
                    req.user.role
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success:
                            false,
                        message:
                            "You do not have permission.",
                    });
            }

            const populatedBill =
                await populateBill(
                    Bill.findById(
                        bill._id
                    )
                );

            return res
                .status(200)
                .json({
                    success: true,
                    bill:
                        populatedBill,
                });
        } catch (error) {
            console.error(
                "Get Bill Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Failed to fetch bill.",
                });
        }
    };

// ==========================================
// RECORD PAYMENT
// ==========================================

const recordPayment =
    async (req, res) => {
        const session =
            await mongoose.startSession();

        try {
            const {
                amount,
                paymentMethod,
                referenceNumber = "",
                notes = "",
            } = req.body;

            if (
                !mongoose.isValidObjectId(
                    req.params.id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,
                        message:
                            "Invalid bill ID.",
                    });
            }

            const paymentAmount =
                roundMoney(
                    Number(
                        amount
                    )
                );

            if (
                !Number.isFinite(
                    paymentAmount
                ) ||
                paymentAmount <=
                    0
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,
                        message:
                            "Payment amount must be greater than zero.",
                    });
            }

            const allowedMethods =
                [
                    "cash",
                    "upi",
                    "card",
                    "bank_transfer",
                    "other",
                ];

            if (
                !allowedMethods.includes(
                    paymentMethod
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,
                        message:
                            "Invalid payment method.",
                    });
            }

            let savedPayment;
            let updatedBill;

            await session.withTransaction(
                async () => {
                    const bill =
                        await Bill.findById(
                            req.params.id
                        ).session(
                            session
                        );

                    if (!bill) {
                        const error =
                            new Error(
                                "Bill not found."
                            );

                        error.statusCode =
                            404;

                        throw error;
                    }

                    if (
                        paymentAmount >
                        bill.balanceAmount
                    ) {
                        const error =
                            new Error(
                                "Payment cannot exceed the remaining balance."
                            );

                        error.statusCode =
                            400;

                        throw error;
                    }

                    // PAYMENT ID

                    const paymentObjectId =
                        new mongoose.Types.ObjectId();

                    const paymentId =
                        `PAY-${paymentObjectId
                            .toString()
                            .slice(-8)
                            .toUpperCase()}`;

                    const payments =
                        await Payment.create(
                            [
                                {
                                    _id: paymentObjectId,

                                    paymentId,

                                    bill:
                                        bill._id,

                                    amount:
                                        paymentAmount,

                                    paymentMethod,

                                    referenceNumber:
                                        String(
                                            referenceNumber ||
                                                ""
                                        ).trim(),

                                    notes:
                                        String(
                                            notes ||
                                                ""
                                        ).trim(),

                                    receivedBy:
                                        req
                                            .user
                                            ._id,
                                },
                            ],
                            {
                                session,
                            }
                        );

                    savedPayment =
                        payments[0];

                    bill.paidAmount =
                        roundMoney(
                            bill.paidAmount +
                                paymentAmount
                        );

                    bill.balanceAmount =
                        roundMoney(
                            Math.max(
                                0,
                                bill.totalAmount -
                                    bill.paidAmount
                            )
                        );

                    bill.paymentStatus =
                        bill.balanceAmount ===
                        0
                            ? "paid"
                            : "partial";

                    bill.paymentMethod =
                        paymentMethod;

                    await bill.save({
                        session,
                    });

                    updatedBill =
                        bill;
                }
            );

            return res
                .status(201)
                .json({
                    success: true,

                    message:
                        "Payment recorded successfully.",

                    payment:
                        savedPayment,

                    bill:
                        updatedBill,
                });
        } catch (error) {
            console.error(
                "Record Payment Error:",
                error
            );

            return res
                .status(
                    error.statusCode ||
                        500
                )
                .json({
                    success: false,

                    message:
                        error.statusCode
                            ? error.message
                            : "Failed to record payment.",
                });
        } finally {
            await session.endSession();
        }
    };

// ==========================================
// GET PAYMENT HISTORY
// ==========================================

const getPaymentHistory =
    async (req, res) => {
        try {
            if (
                !mongoose.isValidObjectId(
                    req.params.id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,
                        message:
                            "Invalid bill ID.",
                    });
            }

            const bill =
                await Bill.findById(
                    req.params.id
                );

            if (!bill) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,
                        message:
                            "Bill not found.",
                    });
            }

            // PATIENT CAN SEE ONLY OWN BILL

            if (
                req.user.role ===
                "patient"
            ) {
                const patient =
                    await Patient.findOne(
                        {
                            user:
                                req
                                    .user
                                    ._id,
                        }
                    );

                if (
                    !patient ||
                    bill.patient.toString() !==
                        patient._id.toString()
                ) {
                    return res
                        .status(403)
                        .json({
                            success:
                                false,
                            message:
                                "You do not have permission.",
                        });
                }
            } else if (
                ![
                    "admin",
                    "receptionist",
                ].includes(
                    req.user.role
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success:
                            false,
                        message:
                            "You do not have permission.",
                    });
            }

            const payments =
                await Payment.find({
                    bill:
                        bill._id,
                })
                    .populate(
                        "receivedBy",
                        "name role"
                    )
                    .sort({
                        paidAt: -1,
                    });

            return res
                .status(200)
                .json({
                    success: true,

                    count:
                        payments.length,

                    payments,
                });
        } catch (error) {
            console.error(
                "Get Payment History Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to fetch payment history.",
                });
        }
    };

export {
    createBill,
    getBills,
    getBillById,
    recordPayment,
    getPaymentHistory,
};