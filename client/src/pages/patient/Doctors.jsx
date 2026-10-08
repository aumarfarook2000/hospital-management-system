
import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiUser,
  FiCalendar,
  FiClock,
  FiRefreshCw,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";

import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const getError = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong.";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const todayInIndia = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const initialBooking = {
  appointmentDate: "",
  appointmentTime: "",
  reason: "",
};

export default function Doctors() {
  const { formatCurrency } = useSettings();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [booking, setBooking] = useState(initialBooking);
  const [saving, setSaving] = useState(false);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/doctors");

      setDoctors(
        (data.doctors || []).filter(
          (doctor) =>
            doctor.status === "active" &&
            doctor.user?.status === "active"
        )
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const text = [
        doctor.user?.name,
        doctor.specialization,
        doctor.qualification,
        doctor.doctorId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [doctors, search]);

  const openBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setBooking(initialBooking);
    setError("");
    setSuccess("");
  };

  const closeBooking = () => {
    if (saving) return;

    setSelectedDoctor(null);
    setBooking(initialBooking);
  };

  const handleBooking = async (event) => {
    event.preventDefault();

    if (!selectedDoctor) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data } = await api.post(
        "/appointments/my-booking",
        {
          doctor: selectedDoctor._id,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          reason: booking.reason,
        }
      );

      setSuccess(
        `${data.message} Appointment ID: ${
          data.appointment?.appointmentId || "-"
        }`
      );

      setSelectedDoctor(null);
      setBooking(initialBooking);
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedDateDay = booking.appointmentDate
    ? days[
        new Date(
          `${booking.appointmentDate}T00:00:00Z`
        ).getUTCDay()
      ]
    : "";

  const availableOnSelectedDay =
    selectedDoctor?.availableDays?.some(
      (day) =>
        String(day).toLowerCase() ===
        selectedDateDay.toLowerCase()
    ) || false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Find Doctor
          </h1>
          <p className="mt-1 text-gray-500">
            Search doctors and book an appointment
          </p>
        </div>

        <button
          type="button"
          onClick={loadDoctors}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
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
          className="flex items-start gap-2 rounded-lg bg-green-100 p-4 text-green-700"
        >
          <FiCheckCircle className="mt-1 shrink-0" />
          {success}
        </div>
      )}

      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, specialization or qualification"
          className="w-full rounded-xl border bg-white py-3 pl-11 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      <p className="text-sm text-gray-500">
        {filteredDoctors.length} doctors found
      </p>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500">
          Loading doctors...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500">
          No available doctors found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor._id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FiUser size={26} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-gray-800">
                    Dr. {doctor.user?.name || "Unknown"}
                  </h2>
                  <p className="text-sm text-blue-600">
                    {doctor.specialization || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <p>
                  <span className="text-gray-500">
                    Qualification:
                  </span>{" "}
                  <span className="font-medium">
                    {doctor.qualification || "-"}
                  </span>
                </p>

                <p>
                  <span className="text-gray-500">
                    Experience:
                  </span>{" "}
                  <span className="font-medium">
                    {doctor.experience || 0} years
                  </span>
                </p>

                <p>
                  <span className="text-gray-500">
                    Consultation Fee:
                  </span>{" "}
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(
                      doctor.consultationFee || 0
                    )}
                  </span>
                </p>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-gray-500">
                    <FiCalendar />
                    Available Days
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {(doctor.availableDays || []).length ? (
                      doctor.availableDays.map((day) => (
                        <span
                          key={day}
                          className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                        >
                          {day}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">
                        Not configured
                      </span>
                    )}
                  </div>
                </div>

                <p className="flex items-center gap-2">
                  <FiClock className="text-gray-500" />
                  {doctor.availableFrom || "-"} to{" "}
                  {doctor.availableTo || "-"}
                </p>

                {doctor.bio && (
                  <p className="line-clamp-3 text-gray-600">
                    {doctor.bio}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => openBooking(doctor)}
                disabled={
                  !doctor.availableDays?.length ||
                  !doctor.availableFrom ||
                  !doctor.availableTo
                }
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book doctor appointment"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Book Appointment
                </h2>
                <p className="mt-1 text-gray-500">
                  Dr. {selectedDoctor.user?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBooking}
                disabled={saving}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="mb-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p>
                <strong>Available:</strong>{" "}
                {(selectedDoctor.availableDays || []).join(
                  ", "
                )}
              </p>
              <p className="mt-2">
                <strong>Hours:</strong>{" "}
                {selectedDoctor.availableFrom} to{" "}
                {selectedDoctor.availableTo}
              </p>
              <p className="mt-2">
                <strong>Fee:</strong>{" "}
                {formatCurrency(
                  selectedDoctor.consultationFee || 0
                )}
              </p>
            </div>

            <form
              onSubmit={handleBooking}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Appointment Date
                </label>

                <input
                  type="date"
                  required
                  min={todayInIndia()}
                  value={booking.appointmentDate}
                  onChange={(event) =>
                    setBooking((prev) => ({
                      ...prev,
                      appointmentDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />

                {booking.appointmentDate &&
                  !availableOnSelectedDay && (
                    <p className="mt-2 text-sm text-red-600">
                      Doctor is unavailable on{" "}
                      {selectedDateDay}.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Appointment Time
                </label>

                <input
                  type="time"
                  required
                  value={booking.appointmentTime}
                  min={selectedDoctor.availableFrom || undefined}
                  max={selectedDoctor.availableTo || undefined}
                  onChange={(event) =>
                    setBooking((prev) => ({
                      ...prev,
                      appointmentTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reason for Visit
                </label>

                <textarea
                  rows={3}
                  value={booking.reason}
                  onChange={(event) =>
                    setBooking((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Describe your reason for consultation"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  !booking.appointmentDate ||
                  !booking.appointmentTime ||
                  !availableOnSelectedDay
                }
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving
                  ? "Booking..."
                  : "Confirm Appointment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
