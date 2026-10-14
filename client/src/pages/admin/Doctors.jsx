
import { useCallback, useEffect, useState } from "react";
import api from "../../api";

const INITIAL_FORM = {
    name: "",
    email: "",
    mobile: "",
    password: "",
    specialization: "",
    qualification: "",
    experience: 0,
    consultationFee: 0,
    gender: "",
    dateOfBirth: "",
    address: "",
    bio: "",
    availableDays: [],
    availableFrom: "",
    availableTo: "",
};

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

function getErrorMessage(error, fallback) {
    return (
        error.response?.data?.message ||
        error.message ||
        fallback
    );
}

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({ ...INITIAL_FORM });

    // ==========================================
    // FETCH DOCTORS
    // Uses the base URL configured in api.js
    // ==========================================

    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/doctors");

            setDoctors(response.data.doctors || []);
        } catch (err) {
            setError(
                getErrorMessage(err, "Failed to fetch doctors.")
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    // ==========================================
    // FORM INPUT
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // AVAILABLE DAYS
    // ==========================================

    const handleDayChange = (day) => {
        setFormData((prev) => {
            const exists = prev.availableDays.includes(day);

            return {
                ...prev,
                availableDays: exists
                    ? prev.availableDays.filter(
                          (item) => item !== day
                      )
                    : [...prev.availableDays, day],
            };
        });
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData({ ...INITIAL_FORM });
        setEditingDoctor(null);
    };

    // ==========================================
    // OPEN ADD FORM
    // ==========================================

    const handleAddDoctor = () => {
        setError("");
        resetForm();
        setShowForm(true);
    };

    // ==========================================
    // OPEN EDIT FORM
    // ==========================================

    const handleEdit = (doctor) => {
        setError("");
        setEditingDoctor(doctor);

        setFormData({
            name: doctor.user?.name || "",
            email: doctor.user?.email || "",
            mobile: doctor.user?.mobile || "",
            password: "",
            specialization: doctor.specialization || "",
            qualification: doctor.qualification || "",
            experience: doctor.experience ?? 0,
            consultationFee: doctor.consultationFee ?? 0,
            gender: doctor.gender || "",
            dateOfBirth: doctor.dateOfBirth
                ? doctor.dateOfBirth.split("T")[0]
                : "",
            address: doctor.address || "",
            bio: doctor.bio || "",
            availableDays: doctor.availableDays || [],
            availableFrom: doctor.availableFrom || "",
            availableTo: doctor.availableTo || "",
        });

        setShowForm(true);
    };

    // ==========================================
    // CLOSE FORM
    // ==========================================

    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        resetForm();
    };

    // ==========================================
    // ADD / UPDATE DOCTOR
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const body = {
                ...formData,
                experience: Number(formData.experience),
                consultationFee: Number(
                    formData.consultationFee
                ),
            };

            // Do not send an empty password while editing.
            if (editingDoctor && !body.password) {
                delete body.password;
            }

            let response;

            if (editingDoctor) {
                response = await api.put(
                    `/doctors/${editingDoctor._id}`,
                    body
                );
            } else {
                response = await api.post("/doctors", body);
            }

            const message =
                response.data.message ||
                (editingDoctor
                    ? "Doctor updated successfully."
                    : "Doctor created successfully.");

            setShowForm(false);
            resetForm();

            await fetchDoctors();

            // The doctor was saved even if refreshing the list fails.
            window.alert(message);
        } catch (err) {
            setError(
                getErrorMessage(err, "Doctor operation failed.")
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // ENABLE / DISABLE DOCTOR
    // ==========================================

    const handleStatusChange = async (doctor) => {
        const newStatus =
            doctor.status === "active" ? "inactive" : "active";

        const confirmed = window.confirm(
            `Are you sure you want to ${newStatus} this doctor?`
        );

        if (!confirmed) return;

        try {
            setError("");

            await api.put(
                `/doctors/${doctor._id}/status`,
                { status: newStatus }
            );

            await fetchDoctors();
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "Doctor status update failed."
                )
            );
        }
    };

    // ==========================================
    // SEARCH
    // ==========================================

    const searchText = search.trim().toLowerCase();

    const filteredDoctors = doctors.filter((doctor) => {
        return (
            doctor.doctorId?.toLowerCase().includes(searchText) ||
            doctor.user?.name?.toLowerCase().includes(searchText) ||
            doctor.user?.email?.toLowerCase().includes(searchText) ||
            doctor.specialization?.toLowerCase().includes(searchText)
        );
    });

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* HEADER */}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Doctors
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Manage hospital doctors
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddDoctor}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                >
                    + Add Doctor
                </button>
            </div>

            {/* ERROR */}

            {error && (
                <div
                    role="alert"
                    className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-red-100 px-4 py-3 text-red-700"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="font-bold"
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* SEARCH */}

            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <input
                    type="text"
                    placeholder="Search by doctor name, ID, email or specialization..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* DOCTORS TABLE */}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">
                        Loading doctors...
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        {search
                            ? "No doctors match your search."
                            : "No doctors found."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left">
                                        Doctor ID
                                    </th>
                                    <th className="px-5 py-4 text-left">
                                        Doctor
                                    </th>
                                    <th className="px-5 py-4 text-left">
                                        Specialization
                                    </th>
                                    <th className="px-5 py-4 text-left">
                                        Experience
                                    </th>
                                    <th className="px-5 py-4 text-left">
                                        Fee
                                    </th>
                                    <th className="px-5 py-4 text-left">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-left">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredDoctors.map((doctor) => (
                                    <tr
                                        key={doctor._id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4 font-medium">
                                            {doctor.doctorId || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-800">
                                                Dr. {doctor.user?.name || "—"}
                                            </div>

                                            <div className="text-sm text-gray-500">
                                                {doctor.user?.email || "—"}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            {doctor.specialization || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            {doctor.experience ?? 0} years
                                        </td>

                                        <td className="px-5 py-4">
                                            ₹
                                            {Number(
                                                doctor.consultationFee || 0
                                            ).toLocaleString("en-IN")}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-sm ${
                                                    doctor.status === "active"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {doctor.status || "unknown"}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(doctor)
                                                    }
                                                    className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            doctor
                                                        )
                                                    }
                                                    className={`rounded-lg px-3 py-2 ${
                                                        doctor.status === "active"
                                                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                                    }`}
                                                >
                                                    {doctor.status === "active"
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
                        {/* MODAL HEADER */}

                        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                            <h2 className="text-xl font-bold">
                                {editingDoctor
                                    ? "Edit Doctor"
                                    : "Add Doctor"}
                            </h2>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="text-2xl text-gray-500 hover:text-gray-800 disabled:opacity-50"
                                aria-label="Close form"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 p-6"
                        >
                            {/* PERSONAL INFORMATION */}

                            <section>
                                <h3 className="mb-4 text-lg font-semibold">
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="mobile"
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="Mobile Number"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    {!editingDoctor && (
                                        <input
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Password"
                                            required
                                            autoComplete="new-password"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}

                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            Select Gender
                                        </option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>

                                    <input
                                        name="dateOfBirth"
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </section>

                            {/* PROFESSIONAL INFORMATION */}

                            <section>
                                <h3 className="mb-4 text-lg font-semibold">
                                    Professional Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        placeholder="Specialization"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        placeholder="Qualification"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="experience"
                                        type="number"
                                        min="0"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        placeholder="Experience in years"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="consultationFee"
                                        type="number"
                                        min="0"
                                        value={formData.consultationFee}
                                        onChange={handleChange}
                                        placeholder="Consultation Fee"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </section>

                            {/* AVAILABILITY */}

                            <section>
                                <h3 className="mb-4 text-lg font-semibold">
                                    Availability
                                </h3>

                                <div className="mb-4 flex flex-wrap gap-3">
                                    {DAYS.map((day) => (
                                        <label
                                            key={day}
                                            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.availableDays.includes(
                                                    day
                                                )}
                                                onChange={() =>
                                                    handleDayChange(day)
                                                }
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="availableFrom"
                                            className="mb-1 block text-sm text-gray-600"
                                        >
                                            Available From
                                        </label>
                                        <input
                                            id="availableFrom"
                                            name="availableFrom"
                                            type="time"
                                            value={formData.availableFrom}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="availableTo"
                                            className="mb-1 block text-sm text-gray-600"
                                        >
                                            Available To
                                        </label>
                                        <input
                                            id="availableTo"
                                            name="availableTo"
                                            type="time"
                                            value={formData.availableTo}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ADDRESS / BIO */}

                            <section className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="address"
                                        className="mb-1 block text-sm text-gray-600"
                                    >
                                        Address
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Address"
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="bio"
                                        className="mb-1 block text-sm text-gray-600"
                                    >
                                        Doctor Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Doctor Bio"
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </section>

                            {/* BUTTONS */}

                            <div className="flex justify-end gap-3 border-t pt-5">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-lg border px-5 py-3 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingDoctor
                                          ? "Update Doctor"
                                          : "Create Doctor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Doctors;
