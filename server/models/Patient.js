import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        patientId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        dateOfBirth: {
            type: Date,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },

        bloodGroup: {
            type: String,
            enum: [
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-",
            ],
        },

        address: {
            type: String,
            trim: true,
        },

        emergencyContactName: {
            type: String,
            trim: true,
        },

        emergencyContactMobile: {
            type: String,
            trim: true,
        },

        allergies: {
            type: String,
            trim: true,
        },

        medicalHistory: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

const Patient = mongoose.model(
    "Patient",
    patientSchema
);

export default Patient;