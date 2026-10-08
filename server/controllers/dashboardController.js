import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import PharmacyPayment from "../models/PharmacyPayment.js";

// =====================================
// ADMIN DASHBOARD
// =====================================

export const getAdminDashboard = async (req, res) => {
    try {
        // ---------------------------------
        // TODAY DATE RANGE
        // ---------------------------------
        const now = new Date();

        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0
        );

        const endOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0,
            0,
            0,
            0
        );

        // ---------------------------------
        // TOTAL PATIENTS
        // ---------------------------------
        const totalPatients =
            await Patient.countDocuments({
                status: "active",
            });

        // ---------------------------------
        // TOTAL DOCTORS
        // ---------------------------------
        const totalDoctors =
            await Doctor.countDocuments({
                status: "active",
            });

        // ---------------------------------
        // TODAY APPOINTMENTS
        // ---------------------------------
        const todayAppointments =
            await Appointment.countDocuments({
                appointmentDate: {
                    $gte: startOfToday,
                    $lt: endOfToday,
                },
            });

        // ---------------------------------
        // HOSPITAL PAYMENTS TODAY
        // ---------------------------------
        const hospitalPayments =
            await Payment.aggregate([
                {
                    $match: {
                        paidAt: {
                            $gte: startOfToday,
                            $lt: endOfToday,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount",
                        },
                    },
                },
            ]);

        const hospitalRevenue =
            hospitalPayments.length > 0
                ? hospitalPayments[0].total
                : 0;

        // ---------------------------------
        // PHARMACY PAYMENTS TODAY
        // ---------------------------------
        const pharmacyPayments =
            await PharmacyPayment.aggregate([
                {
                    $match: {
                        paidAt: {
                            $gte: startOfToday,
                            $lt: endOfToday,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount",
                        },
                    },
                },
            ]);

        const pharmacyRevenue =
            pharmacyPayments.length > 0
                ? pharmacyPayments[0].total
                : 0;

        const todayRevenue =
            hospitalRevenue + pharmacyRevenue;

        // ---------------------------------
        // APPOINTMENT OVERVIEW
        // ---------------------------------
        const appointmentStats =
            await Appointment.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]);

        const appointmentOverview = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };

        appointmentStats.forEach((item) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    appointmentOverview,
                    item._id
                )
            ) {
                appointmentOverview[item._id] =
                    item.count;
            }
        });

        // ---------------------------------
        // RECENT APPOINTMENTS
        // ---------------------------------
        const recentAppointments =
            await Appointment.find()
                .populate({
                    path: "patient",
                    select: "patientId",
                    populate: {
                        path: "user",
                        select: "name",
                    },
                })
                .populate({
                    path: "doctor",
                    select: "doctorId",
                    populate: {
                        path: "user",
                        select: "name",
                    },
                })
                .sort({
                    createdAt: -1,
                })
                .limit(5);

        const recentActivity =
            recentAppointments.map(
                (appointment) => ({
                    _id: appointment._id,
                    appointmentId:
                        appointment.appointmentId,

                    patientName:
                        appointment.patient?.user
                            ?.name || "Unknown Patient",

                    doctorName:
                        appointment.doctor?.user
                            ?.name || "Unknown Doctor",

                    status:
                        appointment.status,

                    appointmentDate:
                        appointment.appointmentDate,

                    appointmentTime:
                        appointment.appointmentTime,

                    createdAt:
                        appointment.createdAt,
                })
            );

        return res.status(200).json({
            success: true,

            stats: {
                totalPatients,
                totalDoctors,
                todayAppointments,
                todayRevenue,
            },

            revenue: {
                hospital: hospitalRevenue,
                pharmacy: pharmacyRevenue,
                total: todayRevenue,
            },

            appointmentOverview,

            recentActivity,
        });
    } catch (error) {
        console.error(
            "Admin Dashboard Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load dashboard information.",
        });
    }
};