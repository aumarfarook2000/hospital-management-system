
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

// ==========================================
// ERROR HELPER
// ==========================================

const sendServerError = (res, error, message) => {
  console.error(message, error);

  return res.status(500).json({
    success: false,
    message,
  });
};

// ==========================================
// GENERATE PATIENT ID
// ==========================================

const generatePatientId = async () => {
  const lastPatient = await Patient.findOne({
    patientId: /^PAT-\d+$/,
  })
    .sort({ createdAt: -1 })
    .select("patientId");

  if (!lastPatient) {
    return "PAT-0001";
  }

  const lastNumber = parseInt(
    lastPatient.patientId.replace("PAT-", ""),
    10
  );

  const nextNumber = lastNumber + 1;

  return `PAT-${String(nextNumber).padStart(4, "0")}`;
};

// ==========================================
// GET LOGGED-IN DOCTOR PROFILE
// ==========================================

const getLoggedInDoctor = async (userId) => {
  return Doctor.findOne({
    user: userId,
  }).select("_id");
};

// ==========================================
// CHECK DOCTOR-PATIENT ACCESS
// ==========================================

const doctorCanAccessPatient = async (
  doctorId,
  patientId
) => {
  const appointment = await Appointment.exists({
    doctor: doctorId,
    patient: patientId,
  });

  return Boolean(appointment);
};

// ==========================================
// CREATE PATIENT
// ADMIN + RECEPTIONIST
// ==========================================

const createPatient = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactMobile,
      allergies,
      medicalHistory,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists.",
      });
    }

    const patientId = await generatePatientId();

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      role: "patient",
      status: "active",
    });

    try {
      const patient = await Patient.create({
        user: user._id,
        patientId,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        emergencyContactName,
        emergencyContactMobile,
        allergies,
        medicalHistory,
        status: "active",
      });

      user.profileId = patient._id;
      await user.save();

      const populatedPatient = await Patient.findById(
        patient._id
      ).populate(
        "user",
        "name email mobile status"
      );

      return res.status(201).json({
        success: true,
        message: "Patient created successfully.",
        patient: populatedPatient,
      });
    } catch (patientError) {
      // Remove the new patient and user if linking fails.
      await Patient.deleteOne({
        user: user._id,
      });

      await User.findByIdAndDelete(user._id);

      throw patientError;
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Patient ID or email already exists. Please try again.",
      });
    }

    return sendServerError(
      res,
      error,
      "Failed to create patient."
    );
  }
};

// ==========================================
// GET PATIENTS
// ADMIN / RECEPTIONIST = ALL
// DOCTOR = ASSIGNED PATIENTS ONLY
// ==========================================

const getPatients = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "doctor") {
      const doctor = await getLoggedInDoctor(
        req.user._id
      );

      if (!doctor) {
        return res.status(403).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      const patientIds = await Appointment.distinct(
        "patient",
        {
          doctor: doctor._id,
        }
      );

      filter = {
        _id: {
          $in: patientIds,
        },
      };
    }

    const patients = await Patient.find(filter)
      .populate(
        "user",
        "name email mobile status"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Failed to fetch patients."
    );
  }
};

// ==========================================
// GET PATIENT BY ID
// VERIFY DOCTOR ACCESS
// ==========================================

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    if (req.user.role === "doctor") {
      const doctor = await getLoggedInDoctor(
        req.user._id
      );

      if (!doctor) {
        return res.status(403).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      const allowed = await doctorCanAccessPatient(
        doctor._id,
        id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to this patient.",
        });
      }
    }

    const patient = await Patient.findById(
      id
    ).populate(
      "user",
      "name email mobile status"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Failed to fetch patient."
    );
  }
};

// ==========================================
// DOCTOR PATIENT APPOINTMENT HISTORY
// ==========================================

const getDoctorPatientAppointments = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    const doctor = await getLoggedInDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    const allowed = await doctorCanAccessPatient(
      doctor._id,
      id
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned to this patient.",
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      patient: id,
    })
      .select(
        "appointmentId appointmentDate appointmentTime reason notes status"
      )
      .sort({
        appointmentDate: -1,
        appointmentTime: -1,
      });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Failed to fetch patient appointments."
    );
  }
};

// ==========================================
// UPDATE PATIENT
// ADMIN + RECEPTIONIST
// ==========================================

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const {
      name,
      email,
      mobile,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactMobile,
      allergies,
      medicalHistory,
    } = req.body;

    const user = await User.findById(
      patient.user
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Patient user account not found.",
      });
    }

    // Check email change
    if (email !== undefined) {
      const normalizedEmail = String(email)
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty.",
        });
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: user._id,
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "This email is already in use.",
          });
        }

        user.email = normalizedEmail;
      }
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Patient name cannot be empty.",
        });
      }

      user.name = String(name).trim();
    }

    if (mobile !== undefined) {
      user.mobile = mobile;
    }

    await user.save();

    // Update patient fields
    if (dateOfBirth !== undefined) {
      patient.dateOfBirth = dateOfBirth;
    }

    if (gender !== undefined) {
      patient.gender = gender;
    }

    if (bloodGroup !== undefined) {
      patient.bloodGroup = bloodGroup;
    }

    if (address !== undefined) {
      patient.address = address;
    }

    if (emergencyContactName !== undefined) {
      patient.emergencyContactName =
        emergencyContactName;
    }

    if (emergencyContactMobile !== undefined) {
      patient.emergencyContactMobile =
        emergencyContactMobile;
    }

    if (allergies !== undefined) {
      patient.allergies = allergies;
    }

    if (medicalHistory !== undefined) {
      patient.medicalHistory = medicalHistory;
    }

    await patient.save();

    const updatedPatient = await Patient.findById(
      patient._id
    ).populate(
      "user",
      "name email mobile status"
    );

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      patient: updatedPatient,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    return sendServerError(
      res,
      error,
      "Failed to update patient."
    );
  }
};

// ==========================================
// UPDATE PATIENT STATUS
// ADMIN ONLY
// ==========================================

const updatePatientStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    if (
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    patient.status = status;
    await patient.save();

    await User.findByIdAndUpdate(
      patient.user,
      {
        status,
      }
    );

    return res.status(200).json({
      success: true,
      message: `Patient ${
        status === "active"
          ? "activated"
          : "deactivated"
      } successfully.`,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Failed to update patient status."
    );
  }
};


const getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
    }).populate("user", "name email mobile role status");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    return res.json({
      success: true,
      patient,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Failed to fetch your profile."
    );
  }
};

const updateMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Patient account not found.",
      });
    }

    const {
      name,
      mobile,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactMobile,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Valid name is required.",
        });
      }
      user.name = name.trim();
    }

    if (mobile !== undefined) {
      if (typeof mobile !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid mobile number.",
        });
      }
      user.mobile = mobile.trim();
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth === "") {
        patient.dateOfBirth = undefined;
      } else {
        const date = new Date(`${dateOfBirth}T00:00:00.000Z`);

        if (
          typeof dateOfBirth !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== dateOfBirth ||
          date > new Date()
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid date of birth.",
          });
        }

        patient.dateOfBirth = date;
      }
    }

    if (gender !== undefined) {
      if (
        gender !== "" &&
        !["male", "female", "other"].includes(gender)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender.",
        });
      }

      patient.gender = gender || undefined;
    }

    for (const [key, value] of Object.entries({
      address,
      emergencyContactName,
      emergencyContactMobile,
    })) {
      if (value !== undefined) {
        if (typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `Invalid ${key}.`,
          });
        }
        patient[key] = value.trim();
      }
    }

    // Patient ID, blood group, allergies, medical history,
    // email, role and status are not self-editable.

    await patient.validate();
    await user.save();
    await patient.save();

    const updatedPatient = await Patient.findById(
      patient._id
    ).populate("user", "name email mobile role status");

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      patient: updatedPatient,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(
      res,
      error,
      "Failed to update your profile."
    );
  }
};

const changeMyPatientPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and a new password of at least 8 characters are required.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "Choose a different new password.",
      });
    }

    const user = await User.findById(
      req.user._id
    ).select("+password");

    if (!user || user.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient account not found.",
      });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!matches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Failed to change your password."
    );
  }
};

export {
  createPatient,
  getPatients,
  getPatientById,
  getDoctorPatientAppointments,
  updatePatient,
  updatePatientStatus,
  getMyPatientProfile,
  updateMyPatientProfile,
  changeMyPatientPassword,
};

