import mongoose from "mongoose";

const medicineBatchSchema = new mongoose.Schema(
    {
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
            index: true,
        },

        batchNumber: {
            type: String,
            required: true,
            trim: true,
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0,
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
        },

        initialQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        manufactureDate: {
            type: Date,
            default: null,
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        supplier: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

// Same medicine cannot have the same batch number twice
medicineBatchSchema.index(
    { medicine: 1, batchNumber: 1 },
    { unique: true }
);

// Useful for finding medicines expiring soon
medicineBatchSchema.index({ expiryDate: 1 });

export default mongoose.model(
    "MedicineBatch",
    medicineBatchSchema
);