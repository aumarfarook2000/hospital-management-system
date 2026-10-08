
import { useEffect, useState } from "react";
import {
  FiUser,
  FiEdit2,
  FiSave,
  FiX,
  FiRefreshCw,
  FiLock,
  FiShield,
} from "react-icons/fi";

import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const emptyForm = {
  name: "",
  mobile: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContactName: "",
  emergencyContactMobile: "",
};

const emptyPasswords = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const getError = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong.";

const profileToForm = (patient) => ({
  name: patient.user?.name || "",
  mobile: patient.user?.mobile || "",
  dateOfBirth: patient.dateOfBirth
    ? patient.dateOfBirth.slice(0, 10)
    : "",
  gender: patient.gender || "",
  address: patient.address || "",
  emergencyContactName:
    patient.emergencyContactName || "",
  emergencyContactMobile:
    patient.emergencyContactMobile || "",
});

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500";

function Info({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-sm text-gray-500">{label}</p>
      <p className="break-words font-medium text-gray-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={inputClass}
        {...props}
      />
    </div>
  );
}

export default function Profile() {
  const { formatDate } = useSettings();

  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [passwords, setPasswords] =
    useState(emptyPasswords);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/patients/me");

      setPatient(data.patient);
      setForm(profileToForm(data.patient));
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data } = await api.put(
        "/patients/me",
        form
      );

      setPatient(data.patient);
      setForm(profileToForm(data.patient));
      setEditing(false);
      setSuccess(data.message);
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      setError("New passwords do not match.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const { data } = await api.put(
        "/patients/me/password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }
      );

      setSuccess(data.message);
      setPasswords(emptyPasswords);
      setShowPassword(false);
    } catch (err) {
      setError(getError(err));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-gray-500">
        Loading patient profile...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          {error || "Patient profile not found."}
        </p>
        <button
          onClick={loadProfile}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const user = patient.user || {};

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            My Profile
          </h1>
          <p className="mt-1 text-gray-500">
            View and manage your patient information
          </p>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          disabled={saving || changingPassword}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-100 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg bg-green-100 p-4 text-green-700"
        >
          {success}
        </div>
      )}

      {/* PATIENT ID CARD */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FiUser size={36} />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">
              {user.name}
            </h2>

            <p className="text-gray-500">
              Patient ID: {patient.patientId}
            </p>

            <p className="text-sm text-gray-500">
              {user.email}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              patient.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {patient.status}
          </span>
        </div>
      </div>

      {/* PERSONAL DETAILS */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-gray-800">
            Personal Information
          </h3>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setError("");
                setSuccess("");
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              <FiEdit2 />
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <Field
                label="Mobile Number"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
              />

              <Field
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().slice(0, 10)}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Gender
                </label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Field
                label="Emergency Contact Name"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={handleChange}
              />

              <Field
                label="Emergency Contact Mobile"
                name="emergencyContactMobile"
                value={form.emergencyContactMobile}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Address
              </label>

              <textarea
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
              >
                <FiSave />
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setForm(profileToForm(patient));
                  setEditing(false);
                  setError("");
                }}
                className="flex items-center gap-2 rounded-lg border px-5 py-3"
              >
                <FiX />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Info label="Full Name" value={user.name} />
            <Info label="Email" value={user.email} />
            <Info label="Mobile" value={user.mobile} />
            <Info
              label="Date of Birth"
              value={
                patient.dateOfBirth
                  ? formatDate(patient.dateOfBirth)
                  : ""
              }
            />
            <Info label="Gender" value={patient.gender} />
            <Info
              label="Blood Group"
              value={patient.bloodGroup}
            />
            <Info
              label="Emergency Contact Name"
              value={patient.emergencyContactName}
            />
            <Info
              label="Emergency Contact Mobile"
              value={patient.emergencyContactMobile}
            />
            <div className="md:col-span-2">
              <Info
                label="Address"
                value={patient.address}
              />
            </div>
          </div>
        )}
      </div>

      {/* MEDICAL INFORMATION */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-800">
          <FiShield className="text-blue-600" />
          Medical Information
        </h3>

        <p className="mb-6 text-sm text-gray-500">
          Contact hospital staff to correct your medical
          information.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Info
            label="Blood Group"
            value={patient.bloodGroup}
          />
          <Info
            label="Allergies"
            value={patient.allergies}
          />
          <div className="md:col-span-2">
            <Info
              label="Medical History"
              value={patient.medicalHistory}
            />
          </div>
        </div>
      </div>

      {/* PASSWORD */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <FiLock className="text-blue-600" />
              Account Security
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Update your login password
            </p>
          </div>

          {!showPassword && (
            <button
              type="button"
              onClick={() => {
                setShowPassword(true);
                setError("");
                setSuccess("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Change Password
            </button>
          )}
        </div>

        {showPassword && (
          <form
            onSubmit={handlePasswordChange}
            className="mt-6 max-w-lg space-y-4"
          >
            {[
              ["currentPassword", "Current Password"],
              ["newPassword", "New Password"],
              ["confirmPassword", "Confirm New Password"],
            ].map(([name, label]) => (
              <Field
                key={name}
                label={label}
                name={name}
                type="password"
                value={passwords[name]}
                required
                autoComplete={
                  name === "currentPassword"
                    ? "current-password"
                    : "new-password"
                }
                onChange={(event) =>
                  setPasswords((previous) => ({
                    ...previous,
                    [name]: event.target.value,
                  }))
                }
              />
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
              >
                {changingPassword
                  ? "Updating..."
                  : "Update Password"}
              </button>

              <button
                type="button"
                disabled={changingPassword}
                onClick={() => {
                  setShowPassword(false);
                  setPasswords(emptyPasswords);
                  setError("");
                }}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
