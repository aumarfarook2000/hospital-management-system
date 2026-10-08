import mongoose from "mongoose";

const pharmacyPaymentSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        sale: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PharmacySale",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
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
            required: true,
        },

        referenceNumber: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        paidAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

pharmacyPaymentSchema.index({
    sale: 1,
    paidAt: -1,
});

export default mongoose.model(
    "PharmacyPayment",
    pharmacyPaymentSchema
);