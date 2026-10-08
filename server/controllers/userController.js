import bcrypt from "bcryptjs";
import User from "../models/User.js";

const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const allowedRoles = [
            "admin",
            "doctor",
            "receptionist",
            "patient",
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role.",
            });
        }

        const users = await User.find({ role })
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const createStaffUser = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            password,
            role,
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and role are required.",
            });
        }

        if (
            !["admin", "doctor", "receptionist"].includes(
                role
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only admin, doctor and receptionist accounts can be created here.",
            });
        }

        const exists = await User.findOne({
            email: email.toLowerCase(),
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            mobile,
            password: hashedPassword,
            role,
        });

        res.status(201).json({
            success: true,
            message: `${role} account created successfully.`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status.",
            });
        }

        const user = await User.findById(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        user.status = status;
        await user.save();

        res.json({
            success: true,
            message: "User status updated.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// =====================================
// UPDATE STAFF
// =====================================

const updateStaff = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            role,
            password,
        } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        // Only admin/receptionist staff can be edited here.
        // Doctors and patients have separate profile modules.
        if (
            user.role !== "admin" &&
            user.role !== "receptionist"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctors and patients must be edited from their respective modules.",
            });
        }

        const allowedRoles = [
            "admin",
            "receptionist",
        ];

        if (
            role &&
            !allowedRoles.includes(role)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff role.",
            });
        }

        // Check duplicate email
        if (
            email &&
            email.toLowerCase() !==
                user.email.toLowerCase()
        ) {
            const existingUser =
                await User.findOne({
                    email: email
                        .trim()
                        .toLowerCase(),
                    _id: {
                        $ne: user._id,
                    },
                });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Email already exists.",
                });
            }
        }

        if (name !== undefined) {
            user.name = name.trim();
        }

        if (email !== undefined) {
            user.email = email
                .trim()
                .toLowerCase();
        }

        if (mobile !== undefined) {
            user.mobile = mobile.trim();
        }

        if (role !== undefined) {
            user.role = role;
        }

        // Password is optional while editing
        if (password && password.trim()) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must be at least 6 characters.",
                });
            }

            user.password = await bcrypt.hash(
                password,
                10
            );
        }

        await user.save();

        const updatedUser =
            await User.findById(
                user._id
            ).select("-password");

        return res.status(200).json({
            success: true,
            message:
                "Staff updated successfully.",
            user: updatedUser,
        });
    } catch (error) {
        console.error(
            "Update Staff Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update staff.",
        });
    }
};

const getMyStaffProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password");

        if (!user || user.role !== "receptionist") {
            return res.status(404).json({
                success: false,
                message: "Receptionist profile not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get Staff Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load profile.",
        });
    }
};

const updateMyStaffProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user || user.role !== "receptionist") {
            return res.status(404).json({
                success: false,
                message: "Receptionist profile not found.",
            });
        }

        const { name, mobile } = req.body;

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                !name.trim()
            ) {
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

        await user.save();

        const updatedUser = await User.findById(
            user._id
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Update Staff Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
        });
    }
};

const changeMyStaffPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Both passwords are required.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 8 characters.",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different.",
            });
        }

        const user = await User.findById(req.user._id)
            .select("+password");

        if (!user || user.role !== "receptionist") {
            return res.status(404).json({
                success: false,
                message: "Receptionist account not found.",
            });
        }

        const validPassword = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect.",
            });
        }

        user.password = await bcrypt.hash(
            newPassword,
            12
        );

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
        });
    } catch (error) {
        console.error("Change Staff Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change password.",
        });
    }
};

export {
    getUsers,
    getUsersByRole,
    createStaffUser,
    updateUserStatus,
    updateStaff,
    getMyStaffProfile,
    updateMyStaffProfile,
    changeMyStaffPassword,
};
