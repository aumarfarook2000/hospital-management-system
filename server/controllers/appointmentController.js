import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import MedicalRecord from "../models/MedicalRecord.js";

// ==========================================
// GENERATE APPOINTMENT ID
// ==========================================

const generateAppointmentId = async () => {
  const lastAppointment = await Appointment.findOne().sort({
    createdAt: -1,
  });

  if (!lastAppointment) {
    return "APT-0001";
  }

  const lastNumber = parseInt(
    lastAppointment.appointmentId.replace("APT-", ""),
    10,
  );

  return `APT-${String(lastNumber + 1).padStart(4, "0")}`;
};

// ==========================================
// CREATE APPOINTMENT
// ==========================================

const createAppointment = async (req, res) => {
  try {
    const { patient, doctor, appointmentDate, appointmentTime, reason } =
      req.body;

    if (!patient || !doctor || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Patient, doctor, date and time are required.",
      });
    }

    const patientData = await Patient.findById(patient);

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    if (patientData.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Inactive patient cannot book appointment.",
      });
    }

    const doctorData = await Doctor.findById(doctor);

    if (!doctorData) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    if (doctorData.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently inactive.",
      });
    }

    // Prevent same doctor from having
    // two appointments at same date/time

    const existingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: {
        $ne: "cancelled",
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "Doctor already has an appointment at this date and time.",
      });
    }

    const appointmentId = await generateAppointmentId();

    const appointment = await Appointment.create({
      appointmentId,

      patient,

      doctor,

      appointmentDate,

      appointmentTime,

      reason: reason || "",

      status: "pending",

      bookedBy: req.user._id,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
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
      .populate("bookedBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully.",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Create Appointment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create appointment.",
    });
  }
};

// ==========================================
// GET ALL / ROLE BASED APPOINTMENTS
// ==========================================

const getAppointments = async (req, res) => {
  try {
    let filter = {};

    // Doctor should see only own appointments

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({
        user: req.user._id,
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      filter.doctor = doctor._id;
    }

    // Patient should see only own appointments

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({
        user: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found.",
        });
      }

      filter.patient = patient._id;
    }

    const appointments = await Appointment.find(filter)
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
      .populate("bookedBy", "name email role")
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get Appointments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments.",
    });
  }
};

// ==========================================
// GET APPOINTMENT BY ID
// ==========================================

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
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
      .populate("bookedBy", "name email role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // Doctor access check

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({
        user: req.user._id,
      });

      if (
        !doctor ||
        appointment.doctor._id.toString() !== doctor._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission.",
        });
      }
    }

    // Patient access check

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({
        user: req.user._id,
      });

      if (
        !patient ||
        appointment.patient._id.toString() !== patient._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get Appointment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment.",
    });
  }
};

// ==========================================
// UPDATE APPOINTMENT
// Admin / Receptionist
// ==========================================

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const { patient, doctor, appointmentDate, appointmentTime, reason, notes } =
      req.body;

    if (patient) {
      const patientData = await Patient.findById(patient);

      if (!patientData) {
        return res.status(404).json({
          success: false,
          message: "Patient not found.",
        });
      }

      appointment.patient = patient;
    }

    if (doctor) {
      const doctorData = await Doctor.findById(doctor);

      if (!doctorData) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found.",
        });
      }

      appointment.doctor = doctor;
    }

    if (appointmentDate) {
      appointment.appointmentDate = appointmentDate;
    }

    if (appointmentTime) {
      appointment.appointmentTime = appointmentTime;
    }

    if (reason !== undefined) {
      appointment.reason = reason;
    }

    if (notes !== undefined) {
      appointment.notes = notes;
    }

    // Prevent duplicate doctor slot

    const duplicate = await Appointment.findOne({
      _id: {
        $ne: appointment._id,
      },

      doctor: appointment.doctor,

      appointmentDate: new Date(appointment.appointmentDate),

      appointmentTime: appointment.appointmentTime,

      status: {
        $ne: "cancelled",
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Doctor already has an appointment at this date and time.",
      });
    }

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
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
      });

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update Appointment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment.",
    });
  }
};

// ==========================================
// UPDATE APPOINTMENT STATUS
// ==========================================

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status.",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // Doctor can only update own appointment

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({
        user: req.user._id,
      });

      if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this appointment.",
        });
      }
    }

    // A consultation record is required before completion
    if (status === "completed") {
      const medicalRecord = await MedicalRecord.findOne({
        appointment: appointment._id,
      });

      if (!medicalRecord) {
        return res.status(400).json({
          success: false,
          message:
            "Save the medical record before completing this appointment.",
        });
      }
    }

    appointment.status = status;

    if (notes !== undefined) {
      appointment.notes = notes;
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Appointment Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status.",
    });
  }
};

const bookMyAppointment = async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, reason } = req.body;

    const patientData = await Patient.findOne({
      user: req.user._id,
    });

    if (!patientData || patientData.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Active patient profile required.",
      });
    }

    const doctorData = await Doctor.findById(doctor);

    if (!doctorData || doctorData.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Doctor is unavailable.",
      });
    }

    // Strict date format: YYYY-MM-DD
    if (
      typeof appointmentDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date.",
      });
    }

    const date = new Date(`${appointmentDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== appointmentDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date.",
      });
    }

    // Hospital timezone: India
    const nowParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

    const part = (type) =>
      nowParts.find((item) => item.type === type)?.value;

    const today = `${part("year")}-${part("month")}-${part("day")}`;
    const currentTime = `${part("hour")}:${part("minute")}`;

    if (appointmentDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book a past date.",
      });
    }

    if (
      typeof appointmentTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Use HH:mm time format.",
      });
    }

    if (
      appointmentDate === today &&
      appointmentTime <= currentTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a future time.",
      });
    }

    const dayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date);

    const availableDays = doctorData.availableDays || [];

    if (
      !availableDays.some(
        (day) =>
          String(day).toLowerCase() === dayName.toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Doctor is unavailable on ${dayName}.`,
      });
    }

    const from = doctorData.availableFrom;
    const to = doctorData.availableTo;

    if (
      !from ||
      !to ||
      appointmentTime < from ||
      appointmentTime >= to
    ) {
      return res.status(400).json({
        success: false,
        message: "Time is outside doctor's working hours.",
      });
    }

    const existing = await Appointment.findOne({
      doctor: doctorData._id,
      appointmentDate: date,
      appointmentTime,
      status: { $ne: "cancelled" },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked.",
      });
    }

    const appointment = await Appointment.create({
      appointmentId: await generateAppointmentId(),
      patient: patientData._id,
      doctor: doctorData._id,
      appointmentDate: date,
      appointmentTime,
      reason: typeof reason === "string" ? reason.trim() : "",
      bookedBy: req.user._id,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Patient booking error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Booking conflict. Please try another slot.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to book appointment.",
    });
  }
};

export {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  bookMyAppointment,
};