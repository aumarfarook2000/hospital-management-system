import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            default: 1,
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

const billSchema = new mongoose.Schema(
    {
        billId: {
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

        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },

        items: {
            type: [billItemSchema],
            default: [],
        },

        subtotal: {
            type: Number,
            default: 0,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        
        taxPercentage: {        
    type: Number,
    default: 0,
    min: 0,
    max: 100,
        },

        taxableAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        taxAmount: {
    type: Number,
    default: 0,
    min: 0,
        },

        totalAmount: {
            type: Number,
            default: 0,
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
            enum: ["cash", "upi", "card", "bank_transfer", "other"],
            default: "cash",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Bill", billSchema);