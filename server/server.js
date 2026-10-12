import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";

import {
    notFound,
    errorHandler,
} from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

connectDB();

const allowedOrigins = [
    "http://localhost:5173",
    "https://hms-frontend-flame.vercel.app/",
    process.env.CLIENT_URL?.replace(/\/+$/, ""),
].filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Hospital Management System API is running.",
    });
});

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        message: "HMS API is healthy.",
        timestamp: new Date(),
    });
});

app.use(
    "/api/v1/auth",
    authRoutes
);

app.use(
    "/api/v1/users",
    userRoutes
);

app.use(
    "/api/v1/doctors",
    doctorRoutes
);

app.use(
    "/api/v1/patients",
    patientRoutes
);

app.use(
    "/api/v1/appointments", 
    appointmentRoutes
);

app.use(
    "/api/v1/medical-records", 
    medicalRecordRoutes
);

app.use(
    "/api/v1/bills", 
    billRoutes
);

app.use(
    "/api/v1/pharmacy", 
    pharmacyRoutes
);

app.use(
    "/api/v1/dashboard",
    dashboardRoutes
);

app.use(
    "/api/v1/preferences",
    preferenceRoutes
);

app.use(
    "/api/v1/settings",
    settingRoutes
);

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});