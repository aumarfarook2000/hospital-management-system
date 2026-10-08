import mongoose from "mongoose";
import MedicalRecord from "../models/MedicalRecord.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";

const populateRecord = (query) =>
    query
        .populate({
            path: "patient",
            populate: {
                path: "user",
                select: "name email mobile",
            },
        })
        .populate({
            path: "doctor",
            populate: {
                path: "user",
                select: "name email mobile",
            },
        })
        .populate(
            "appointment",
            "appointmentId appointmentDate appointmentTime status"
        );

const getOwnDoctor = async (userId) =>
    Doctor.findOne({ user: userId });

const getOwnPatient = async (userId) =>
    Patient.findOne({ user: userId });

const canViewRecord = async (user, record) => {
    if (user.role === "admin") return true;

    if (user.role === "doctor") {
        const doctor = await getOwnDoctor(user._id);
        return doctor &&
            record.doctor.toString() === doctor._id.toString();
    }

    if (user.role === "patient") {
        const patient = await getOwnPatient(user._id);
        return patient &&
            record.patient.toString() === patient._id.toString();
    }

    return false;
};

// Generate MED-0001, MED-0002...
const generateMedicalRecordId = async () => {
    const lastRecord = await MedicalRecord.findOne()
        .sort({ createdAt: -1 });

    if (!lastRecord) return "MED-0001";

    const lastNumber = parseInt(
        lastRecord.medicalRecordId.replace("MED-", ""),
        10
    );

    return `MED-${String(lastNumber + 1).padStart(4, "0")}`;
};

// CREATE MEDICAL RECORD
const createMedicalRecord = async (req, res) => {
    try {
        const {
            appointment,
            symptoms,
            diagnosis,
            vitals,
            prescription,
            tests,
            notes,
            followUpDate,
        } = req.body;

        if (!mongoose.isValidObjectId(appointment)) {
            return res.status(400).json({
                success: false,
                message: "Valid appointment is required.",
            });
        }

        const appointmentData = await Appointment.findById(appointment);

        if (!appointmentData) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        const doctor = await getOwnDoctor(req.user._id);

        if (
            !doctor ||
            appointmentData.doctor.toString() !== doctor._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can create records only for your own appointments.",
            });
        }

        if (appointmentData.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot create a record for a cancelled appointment.",
            });
        }

        const existingRecord = await MedicalRecord.findOne({
            appointment,
        });

        if (existingRecord) {
            return res.status(409).json({
                success: false,
                message: "A medical record already exists for this appointment.",
            });
        }

        const medicalRecord = await MedicalRecord.create({
            medicalRecordId: await generateMedicalRecordId(),
            patient: appointmentData.patient,
            doctor: appointmentData.doctor,
            appointment,
            symptoms,
            diagnosis,
            vitals,
            prescription,
            tests,
            notes,
            followUpDate,
        });

        const populatedRecord = await populateRecord(
            MedicalRecord.findById(medicalRecord._id)
        );

        return res.status(201).json({
            success: true,
            message: "Medical record created successfully.",
            medicalRecord: populatedRecord,
        });
    } catch (error) {
        console.error("Create Medical Record Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A medical record already exists or the generated ID conflicts.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create medical record.",
        });
    }
};

// GET RECORDS
const getMedicalRecords = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === "doctor") {
            const doctor = await getOwnDoctor(req.user._id);

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: "Doctor profile not found.",
                });
            }

            filter.doctor = doctor._id;
        } else if (req.user.role === "patient") {
            const patient = await getOwnPatient(req.user._id);

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: "Patient profile not found.",
                });
            }

            filter.patient = patient._id;
        } else if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You do not have permission.",
            });
        }

        const medicalRecords = await populateRecord(
            MedicalRecord.find(filter).sort({ createdAt: -1 })
        );

        return res.status(200).json({
            success: true,
            count: medicalRecords.length,
            medicalRecords,
        });
    } catch (error) {
        console.error("Get Medical Records Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch medical records.",
        });
    }
};

// GET RECORD BY ID
const getMedicalRecordById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medical record ID.",
            });
        }

        const record = await MedicalRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found.",
            });
        }

        if (!(await canViewRecord(req.user, record))) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission.",
            });
        }

        const medicalRecord = await populateRecord(
            MedicalRecord.findById(record._id)
        );

        return res.status(200).json({
            success: true,
            medicalRecord,
        });
    } catch (error) {
        console.error("Get Medical Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch medical record.",
        });
    }
};

// UPDATE MEDICAL RECORD
const updateMedicalRecord = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medical record ID.",
            });
        }

        const record = await MedicalRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found.",
            });
        }

        const doctor = await getOwnDoctor(req.user._id);

        if (
            !doctor ||
            record.doctor.toString() !== doctor._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can update only your own medical records.",
            });
        }

        const allowedFields = [
            "symptoms",
            "diagnosis",
            "vitals",
            "prescription",
            "tests",
            "notes",
            "followUpDate",
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                record[field] = req.body[field];
            }
        }

        await record.save();

        const medicalRecord = await populateRecord(
            MedicalRecord.findById(record._id)
        );

        return res.status(200).json({
            success: true,
            message: "Medical record updated successfully.",
            medicalRecord,
        });
    } catch (error) {
        console.error("Update Medical Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update medical record.",
        });
    }
};

export {
    createMedicalRecord,
    getMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
};