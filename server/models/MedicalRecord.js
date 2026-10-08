import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
    {
        medicineName: {
            type: String,
            required: true,
            trim: true,
        },

        dosage: {
            type: String,
            trim: true,
            default: "",
        },

        frequency: {
            type: String,
            trim: true,
            default: "",
        },

        duration: {
            type: String,
            trim: true,
            default: "",
        },

        instructions: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        _id: false,
    }
);

const medicalRecordSchema = new mongoose.Schema(
    {
        medicalRecordId: {
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

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },

        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            unique: true,
        },

        symptoms: {
            type: String,
            trim: true,
            default: "",
        },

        diagnosis: {
            type: String,
            trim: true,
            default: "",
        },

        vitals: {
            bloodPressure: {
                type: String,
                trim: true,
                default: "",
            },

            temperature: {
                type: String,
                trim: true,
                default: "",
            },

            weight: {
                type: String,
                trim: true,
                default: "",
            },

            pulse: {
                type: String,
                trim: true,
                default: "",
            },

            spo2: {
                type: String,
                trim: true,
                default: "",
            },
        },

        prescription: {
            type: [medicineSchema],
            default: [],
        },

        tests: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        followUpDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "MedicalRecord",
    medicalRecordSchema
);