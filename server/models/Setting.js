import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      trim: true,
      default: "Hospital Management System",
    },

    hospitalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    hospitalPhone: {
      type: String,
      trim: true,
      default: "",
    },

    hospitalAddress: {
      type: String,
      trim: true,
      default: "",
    },

    appointmentDuration: {
      type: Number,
      min: 5,
      default: 30,
    },

    workingFrom: {
      type: String,
      default: "09:00",
    },

    workingTo: {
      type: String,
      default: "18:00",
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
    },

    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    invoicePrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INV",
    },

    lowStockLevel: {
      type: Number,
      min: 0,
      default: 10,
    },

    expiryWarningDays: {
      type: Number,
      min: 0,
      default: 30,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    dateFormat: {
      type: String,
      enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      default: "DD/MM/YYYY",
    },
    emailResetSubject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "Reset Your Password - Hospital Management System",
    },

    emailResetHeading: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "Reset Your Password",
    },

    emailResetMessage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default:
        "We received a request to reset your account password. Click the button below to create a new password.",
    },

    emailResetButtonText: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Reset Password",
    },

    emailResetButtonColor: {
      type: String,
      default: "#2563eb",
      match: /^#[0-9a-fA-F]{6}$/,
    },

    emailResetFooter: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "This is an automated security email. Please do not reply.",
    },
    
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Setting", settingSchema);
