import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
    {
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
        },

        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicineBatch",
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const pharmacySaleSchema = new mongoose.Schema(
    {
        saleId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },

        // Optional link to doctor's prescription
        medicalRecord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalRecord",
            default: null,
        },

        items: {
            type: [saleItemSchema],
            required: true,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        balanceAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        paymentStatus: {
            type: String,
            enum: ["unpaid", "partial", "paid"],
            default: "unpaid",
        },

        paymentMethod: {
            type: String,
            enum: [
                "cash",
                "upi",
                "card",
                "bank_transfer",
                "other",
            ],
            default: "cash",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        soldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

pharmacySaleSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model(
    "PharmacySale",
    pharmacySaleSchema
);