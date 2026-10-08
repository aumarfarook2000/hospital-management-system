import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";

// Generate Doctor ID
const generateDoctorId = async () => {
    const lastDoctor = await Doctor.findOne()
        .sort({ createdAt: -1 })
        .select("doctorId");

    if (!lastDoctor) {
        return "DOC-0001";
    }

    const lastNumber = parseInt(
        lastDoctor.doctorId.replace("DOC-", ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `DOC-${String(nextNumber).padStart(4, "0")}`;
};

// ==========================================
// CREATE DOCTOR
// ==========================================

const createDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            password,
            specialization,
            qualification,
            experience,
            consultationFee,
            gender,
            dateOfBirth,
            address,
            bio,
            availableDays,
            availableFrom,
            availableTo,
        } = req.body;

        // Required fields
        if (
            !name ||
            !email ||
            !password ||
            !specialization ||
            !qualification
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password, specialization and qualification are required.",
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already exists.",
            });
        }

        // Generate doctor ID
        const doctorId = await generateDoctorId();

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        // Create User
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            mobile,
            password: hashedPassword,
            role: "doctor",
            status: "active",
        });

        try {
            // Create Doctor profile
            const doctor = await Doctor.create({
                user: user._id,
                doctorId,
                specialization,
                qualification,
                experience: experience || 0,
                consultationFee:
                    consultationFee || 0,
                gender,
                dateOfBirth,
                address,
                bio,
                availableDays:
                    availableDays || [],
                availableFrom,
                availableTo,
                status: "active",
            });

            // Link profile to User
            user.profileId = doctor._id;
            await user.save();

            res.status(201).json({
                success: true,
                message:
                    "Doctor created successfully.",
                doctor: {
                    id: doctor._id,
                    doctorId: doctor.doctorId,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    specialization:
                        doctor.specialization,
                    qualification:
                        doctor.qualification,
                    experience:
                        doctor.experience,
                    consultationFee:
                        doctor.consultationFee,
                    gender: doctor.gender,
                    status: doctor.status,
                },
            });
        } catch (doctorError) {
            // If Doctor creation fails,
            // remove the User we just created.
            await User.findByIdAndDelete(user._id);

            throw doctorError;
        }
    } catch (error) {
        console.error(
            "Create doctor error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================================
// GET ALL DOCTORS
// ==========================================

const getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .populate(
                "user",
                "name email mobile status"
            )
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: doctors.length,
            doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================================
// GET SINGLE DOCTOR
// ==========================================

const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(
            req.params.id
        ).populate(
            "user",
            "name email mobile status"
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        res.json({
            success: true,
            doctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================================
// UPDATE DOCTOR
// ==========================================

const updateDoctor = async (req, res) => {
    try {
        const doctor =
            await Doctor.findById(
                req.params.id
            );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        const user = await User.findById(
            doctor.user
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor user account not found.",
            });
        }

        const {
            name,
            email,
            mobile,
            specialization,
            qualification,
            experience,
            consultationFee,
            gender,
            dateOfBirth,
            address,
            bio,
            availableDays,
            availableFrom,
            availableTo,
        } = req.body;

        // Update User
        if (name !== undefined) {
            user.name = name;
        }

        if (email !== undefined) {
            const emailExists =
                await User.findOne({
                    email:
                        email.toLowerCase(),
                    _id: {
                        $ne: user._id,
                    },
                });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Email already exists.",
                });
            }

            user.email =
                email.toLowerCase();
        }

        if (mobile !== undefined) {
            user.mobile = mobile;
        }

        await user.save();

        // Update Doctor
        if (
            specialization !== undefined
        ) {
            doctor.specialization =
                specialization;
        }

        if (
            qualification !== undefined
        ) {
            doctor.qualification =
                qualification;
        }

        if (
            experience !== undefined
        ) {
            doctor.experience =
                experience;
        }

        if (
            consultationFee !==
            undefined
        ) {
            doctor.consultationFee =
                consultationFee;
        }

        if (gender !== undefined) {
            doctor.gender = gender;
        }

        if (
            dateOfBirth !== undefined
        ) {
            doctor.dateOfBirth =
                dateOfBirth;
        }

        if (address !== undefined) {
            doctor.address = address;
        }

        if (bio !== undefined) {
            doctor.bio = bio;
        }

        if (
            availableDays !== undefined
        ) {
            doctor.availableDays =
                availableDays;
        }

        if (
            availableFrom !== undefined
        ) {
            doctor.availableFrom =
                availableFrom;
        }

        if (
            availableTo !== undefined
        ) {
            doctor.availableTo =
                availableTo;
        }

        await doctor.save();

        res.json({
            success: true,
            message:
                "Doctor updated successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================================
// UPDATE DOCTOR STATUS
// ==========================================

const updateDoctorStatus = async (
    req,
    res
) => {
    try {
        const { status } = req.body;

        if (
            !["active", "inactive"].includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid status.",
            });
        }

        const doctor =
            await Doctor.findById(
                req.params.id
            );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        doctor.status = status;
        await doctor.save();

        // Also update User status
        await User.findByIdAndUpdate(
            doctor.user,
            {
                status,
            }
        );

        res.json({
            success: true,
            message:
                "Doctor status updated successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    }).populate(
      "user",
      "name email mobile status"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load doctor profile.",
    });
  }
};

const updateMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const {
      name,
      mobile,
      gender,
      dateOfBirth,
      address,
      bio,
    } = req.body;

    // Doctors can edit personal/contact details.
    // Admin-managed fields remain read-only.
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = String(name).trim();
    }

    if (mobile !== undefined) {
      user.mobile = mobile;
    }

    if (gender !== undefined) {
      doctor.gender = gender;
    }

    if (dateOfBirth !== undefined) {
      doctor.dateOfBirth = dateOfBirth || null;
    }

    if (address !== undefined) {
      doctor.address = address;
    }

    if (bio !== undefined) {
      doctor.bio = bio;
    }

    await user.save();
    await doctor.save();

    const updatedDoctor = await Doctor.findById(
      doctor._id
    ).populate(
      "user",
      "name email mobile status"
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor profile.",
    });
  }
};


export {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  getMyDoctorProfile,
  updateMyDoctorProfile,
};
