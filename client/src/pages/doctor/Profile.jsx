
import { useEffect, useState } from "react";
import {
  FiUser,
  FiEdit2,
  FiSave,
  FiX,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiCalendar,
  FiClock,
  FiBriefcase,
} from "react-icons/fi";

import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialForm = {
  name: "",
  mobile: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  bio: "",
};

const toDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const getError = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong.";

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words font-medium text-gray-800">
        {value === undefined ||
        value === null ||
        value === ""
          ? "-"
          : value}
      </p>
    </div>
  );
}

function Profile() {
  const { formatDate, formatCurrency } = useSettings();

  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setFormFromDoctor = (data) => {
    setForm({
      name: data.user?.name || "",
      mobile: data.user?.mobile || "",
      gender: data.gender || "",
      dateOfBirth: toDateInput(data.dateOfBirth),
      address: data.address || "",
      bio: data.bio || "",
    });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/doctors/me");

      setDoctor(data.doctor);
      setFormFromDoctor(data.doctor);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    if (doctor) {
      setFormFromDoctor(doctor);
    }

    setEditing(false);
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data } = await api.put(
        "/doctors/me",
        {
          ...form,
          dateOfBirth: form.dateOfBirth || null,
        }
      );

      setDoctor(data.doctor);
      setFormFromDoctor(data.doctor);
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm">
        Loading doctor profile...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-red-50 p-5 text-red-700">
          {error || "Doctor profile not found."}
        </div>

        <button
          onClick={fetchProfile}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            My Profile
          </h1>
          <p className="mt-1 text-gray-500">
            View and manage your doctor profile
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProfile}
          disabled={loading || saving}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
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

      {/* PROFILE HEADER */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FiUser size={38} />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">
              Dr. {doctor.user?.name || "-"}
            </h2>

            <p className="mt-1 text-gray-500">
              {doctor.specialization || "-"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Doctor ID: {doctor.doctorId}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              doctor.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {doctor.status || "-"}
          </span>
        </div>
      </div>

      {/* PERSONAL DETAILS */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <FiUser className="text-blue-600" />
            Personal Information
          </h3>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setSuccess("");
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <FiEdit2 />
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={handleSave}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Mobile
                </label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Professional Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FiSave />
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border px-5 py-3 hover:bg-gray-50"
              >
                <FiX />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <Detail
              label="Full Name"
              value={doctor.user?.name}
            />
            <Detail
              label="Email"
              value={doctor.user?.email}
            />
            <Detail
              label="Mobile"
              value={doctor.user?.mobile}
            />
            <Detail
              label="Gender"
              value={doctor.gender}
            />
            <Detail
              label="Date of Birth"
              value={
                doctor.dateOfBirth
                  ? formatDate(doctor.dateOfBirth)
                  : "-"
              }
            />
            <Detail
              label="Address"
              value={doctor.address}
            />
            <div className="md:col-span-2">
              <Detail
                label="Professional Bio"
                value={doctor.bio}
              />
            </div>
          </div>
        )}
      </div>

      {/* PROFESSIONAL DETAILS */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FiBriefcase className="text-blue-600" />
          Professional Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <Detail
            label="Specialization"
            value={doctor.specialization}
          />

          <Detail
            label="Qualification"
            value={doctor.qualification}
          />

          <Detail
            label="Experience"
            value={`${doctor.experience || 0} years`}
          />

          <Detail
            label="Consultation Fee"
            value={formatCurrency(
              doctor.consultationFee || 0
            )}
          />
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Contact the hospital administrator to update
          professional details and consultation fees.
        </p>
      </div>

      {/* AVAILABILITY */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FiClock className="text-blue-600" />
          Availability
        </h3>

        <div className="mb-5">
          <p className="mb-3 text-sm text-gray-500">
            Available Days
          </p>

          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => {
              const selected =
                doctor.availableDays?.some(
                  (value) =>
                    value.toLowerCase() ===
                    day.toLowerCase()
                );

              return (
                <span
                  key={day}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    selected
                      ? "bg-blue-100 font-medium text-blue-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {day.slice(0, 3)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Detail
            label="Available From"
            value={doctor.availableFrom}
          />

          <Detail
            label="Available To"
            value={doctor.availableTo}
          />
        </div>
      </div>
    </div>
  );
}

export default Profile;
