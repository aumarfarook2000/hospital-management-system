import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import DashboardLayout from "../components/layout/DashboardLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Unauthorized from "../pages/Unauthorized";
import Placeholder from "../pages/Placeholder";

import AdminDashboard from "../pages/admin/Dashboard";
import DoctorDashboard from "../pages/doctor/Dashboard";
import ReceptionDashboard from "../pages/reception/Dashboard";
import PatientDashboard from "../pages/patient/Dashboard";

import Doctors from "../pages/admin/Doctors";
import Patients from "../pages/admin/Patients";
import Appointments from "../pages/admin/Appointments";

import Consultation from "../pages/doctor/Consultation";

import MedicalRecords from "../pages/MedicalRecords";
import MedicalRecordDetails from "../pages/MedicalRecordDetails";

import Billing from "../pages/admin/Billing";

import Medicines from "../pages/admin/Medicines";
import MedicineStock from "../pages/admin/MedicineStock";
import PharmacySale from "../pages/admin/PharmacySale";
import PharmacySalesHistory from "../pages/admin/PharmacySalesHistory";
import Users from "../pages/admin/Users";
import Appearance from "../pages/Appearance";
import Settings from "../pages/admin/Settings";

import DoctorPatients from "../pages/doctor/Patients";
import DoctorProfile from "../pages/doctor/Profile";
import ReceptionProfile from "../pages/reception/Profile";
import PatientDoctors from "../pages/patient/Doctors";
import PatientProfile from "../pages/patient/Profile";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

const AppRoutes = () => {
  return (
    <Routes>
      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* =========================
          PROTECTED ROUTES
      ========================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* =========================
              ADMIN
          ========================== */}

          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="/admin/users" element={<Users />} />

            <Route path="/admin/doctors" element={<Doctors />} />

            <Route path="/admin/patients" element={<Patients />} />

            <Route path="/admin/appointments" element={<Appointments />} />

            <Route path="/admin/medical-records" element={<MedicalRecords />} />

            <Route
              path="/admin/medical-records/:id"
              element={<MedicalRecordDetails />}
            />

            <Route path="/admin/billing" element={<Billing />} />

            <Route path="/admin/appearance" element={<Appearance />} />

            {/* PHARMACY */}

            <Route path="/admin/pharmacy/medicines" element={<Medicines />} />

            <Route path="/admin/pharmacy/stock" element={<MedicineStock />} />

            <Route path="/admin/pharmacy/sale" element={<PharmacySale />} />

            <Route
              path="/admin/pharmacy/sales"
              element={<PharmacySalesHistory />}
            />

            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          {/* =========================
              DOCTOR
          ========================== */}

          <Route element={<RoleRoute allowedRoles={["doctor"]} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

            <Route path="/doctor/appointments" element={<Appointments />} />

            <Route path="/doctor/patients" element={<DoctorPatients />} />

            <Route
              path="/doctor/consultation/:appointmentId"
              element={<Consultation />}
            />

            <Route
              path="/doctor/medical-records"
              element={<MedicalRecords />}
            />

            <Route
              path="/doctor/medical-records/:id"
              element={<MedicalRecordDetails />}
            />

            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/appearance" element={<Appearance />} />
          </Route>

          {/* =========================
              RECEPTIONIST
          ========================== */}

          <Route element={<RoleRoute allowedRoles={["receptionist"]} />}>
            <Route
              path="/reception/dashboard"
              element={<ReceptionDashboard />}
            />

            <Route path="/reception/patients" element={<Patients />} />

            <Route path="/reception/appointments" element={<Appointments />} />

            <Route path="/reception/billing" element={<Billing />} />
            <Route path="/reception/appearance" element={<Appearance />} />

            {/* PHARMACY */}

            <Route
              path="/reception/pharmacy/medicines"
              element={<Medicines />}
            />

            <Route
              path="/reception/pharmacy/stock"
              element={<MedicineStock />}
            />

            <Route path="/reception/pharmacy/sale" element={<PharmacySale />} />

            <Route
              path="/reception/pharmacy/sales"
              element={<PharmacySalesHistory />}
            />

            <Route path="/reception/profile" element={<ReceptionProfile />} />
          </Route>

          {/* =========================
              PATIENT
          ========================== */}

          <Route element={<RoleRoute allowedRoles={["patient"]} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />

            <Route path="/patient/doctors" element={<PatientDoctors />} />

            <Route path="/patient/appointments" element={<Appointments />} />

            <Route
              path="/patient/medical-records"
              element={<MedicalRecords />}
            />

            <Route
              path="/patient/medical-records/:id"
              element={<MedicalRecordDetails />}
            />

            <Route path="/patient/billing" element={<Billing />} />

            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/appearance" element={<Appearance />} />
          </Route>
        </Route>
      </Route>

      {/* =========================
          DEFAULT / FALLBACK
      ========================== */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password/:token" element={<ResetPassword />} />
    </Routes>
  );
};

export default AppRoutes;
