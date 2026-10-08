import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        genericName: {
            type: String,
            trim: true,
            default: "",
        },

        category: {
            type: String,
            trim: true,
            default: "",
        },

        manufacturer: {
            type: String,
            trim: true,
            default: "",
        },

        unit: {
            type: String,
            enum: [
                "tablet",
                "capsule",
                "strip",
                "bottle",
                "vial",
                "ampoule",
                "tube",
                "piece",
                "other",
            ],
            default: "tablet",
        },

        prescriptionRequired: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

medicineSchema.index({ name: 1 });

export default mongoose.model("Medicine", medicineSchema);