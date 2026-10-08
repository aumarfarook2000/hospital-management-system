import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        doctorId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        specialization: {
            type: String,
            required: true,
            trim: true,
        },

        qualification: {
            type: String,
            required: true,
            trim: true,
        },

        experience: {
            type: Number,
            default: 0,
            min: 0,
        },

        consultationFee: {
            type: Number,
            default: 0,
            min: 0,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },

        dateOfBirth: {
            type: Date,
        },

        address: {
            type: String,
            trim: true,
        },

        bio: {
            type: String,
            trim: true,
        },

        availableDays: [
            {
                type: String,
                enum: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                ],
            },
        ],

        availableFrom: {
            type: String,
        },

        availableTo: {
            type: String,
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

const Doctor = mongoose.model(
    "Doctor",
    doctorSchema
);

export default Doctor;