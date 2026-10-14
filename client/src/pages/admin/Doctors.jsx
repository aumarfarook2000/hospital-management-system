import { useEffect, useState } from "react";
import api from "../../api";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}`
    : "http://localhost:5000/api/v1",



function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] =
        useState(null);

    const [formData, setFormData] = useState({
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
    });

    // ==========================================
    // GET TOKEN
    // ==========================================

    const getToken = () => {
        return localStorage.getItem("hms_token");
    };

    // ==========================================
    // FETCH DOCTORS
    // ==========================================

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/doctors`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch doctors."
                );
            }

            setDoctors(data.doctors || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

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
            const exists =
                prev.availableDays.includes(day);

            return {
                ...prev,
                availableDays: exists
                    ? prev.availableDays.filter(
                          (item) => item !== day
                      )
                    : [
                          ...prev.availableDays,
                          day,
                      ],
            };
        });
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData({
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
        });

        setEditingDoctor(null);
    };

    // ==========================================
    // OPEN ADD FORM
    // ==========================================

    const handleAddDoctor = () => {
        resetForm();
        setShowForm(true);
    };

    // ==========================================
    // OPEN EDIT FORM
    // ==========================================

    const handleEdit = (doctor) => {
        setEditingDoctor(doctor);

        setFormData({
            name: doctor.user?.name || "",
            email: doctor.user?.email || "",
            mobile: doctor.user?.mobile || "",
            password: "",
            specialization:
                doctor.specialization || "",
            qualification:
                doctor.qualification || "",
            experience:
                doctor.experience || 0,
            consultationFee:
                doctor.consultationFee || 0,
            gender: doctor.gender || "",
            dateOfBirth: doctor.dateOfBirth
                ? doctor.dateOfBirth.split("T")[0]
                : "",
            address: doctor.address || "",
            bio: doctor.bio || "",
            availableDays:
                doctor.availableDays || [],
            availableFrom:
                doctor.availableFrom || "",
            availableTo:
                doctor.availableTo || "",
        });

        setShowForm(true);
    };

    // ==========================================
    // SUBMIT FORM
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            const url = editingDoctor
                ? `${API_URL}/doctors/${editingDoctor._id}`
                : `${API_URL}/doctors`;

            const method = editingDoctor
                ? "PUT"
                : "POST";

            const body = {
                ...formData,
                experience: Number(
                    formData.experience
                ),
                consultationFee: Number(
                    formData.consultationFee
                ),
            };

            // Don't send empty password while editing
            if (
                editingDoctor &&
                !body.password
            ) {
                delete body.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Operation failed."
                );
            }

            alert(data.message);

            setShowForm(false);
            resetForm();

            fetchDoctors();
        } catch (err) {
            setError(err.message);
        }
    };

    // ==========================================
    // STATUS CHANGE
    // ==========================================

    const handleStatusChange = async (
        doctor
    ) => {
        const newStatus =
            doctor.status === "active"
                ? "inactive"
                : "active";

        const confirmed = window.confirm(
            `Are you sure you want to ${newStatus} this doctor?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_URL}/doctors/${doctor._id}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Status update failed."
                );
            }

            fetchDoctors();
        } catch (err) {
            setError(err.message);
        }
    };

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredDoctors = doctors.filter(
        (doctor) => {
            const searchText =
                search.toLowerCase();

            return (
                doctor.doctorId
                    ?.toLowerCase()
                    .includes(searchText) ||
                doctor.user?.name
                    ?.toLowerCase()
                    .includes(searchText) ||
                doctor.user?.email
                    ?.toLowerCase()
                    .includes(searchText) ||
                doctor.specialization
                    ?.toLowerCase()
                    .includes(searchText)
            );
        }
    );

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* HEADER */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Doctors
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Manage hospital doctors
                    </p>
                </div>

                <button
                    onClick={handleAddDoctor}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
                >
                    + Add Doctor
                </button>
            </div>

            {/* ERROR */}

            {error && (
                <div className="mb-5 bg-red-100 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* SEARCH */}

            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">

                <input
                    type="text"
                    placeholder="Search by doctor name, ID, email or specialization..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

            </div>

            {/* TABLE */}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">

                {loading ? (
                    <div className="p-10 text-center text-gray-500">
                        Loading doctors...
                    </div>
                ) : filteredDoctors.length ===
                  0 ? (
                    <div className="p-10 text-center text-gray-500">
                        No doctors found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-gray-50 border-b">

                                <tr>
                                    <th className="text-left px-5 py-4">
                                        Doctor ID
                                    </th>

                                    <th className="text-left px-5 py-4">
                                        Doctor
                                    </th>

                                    <th className="text-left px-5 py-4">
                                        Specialization
                                    </th>

                                    <th className="text-left px-5 py-4">
                                        Experience
                                    </th>

                                    <th className="text-left px-5 py-4">
                                        Fee
                                    </th>

                                    <th className="text-left px-5 py-4">
                                        Status
                                    </th>

                                    <th className="text-left px-5 py-4">
                                        Action
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {filteredDoctors.map(
                                    (doctor) => (
                                        <tr
                                            key={
                                                doctor._id
                                            }
                                            className="border-b hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4 font-medium">
                                                {
                                                    doctor.doctorId
                                                }
                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-gray-800">
                                                    Dr.{" "}
                                                    {
                                                        doctor
                                                            .user
                                                            ?.name
                                                    }
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    {
                                                        doctor
                                                            .user
                                                            ?.email
                                                    }
                                                </div>

                                            </td>

                                            <td className="px-5 py-4">
                                                {
                                                    doctor.specialization
                                                }
                                            </td>

                                            <td className="px-5 py-4">
                                                {
                                                    doctor.experience
                                                }{" "}
                                                years
                                            </td>

                                            <td className="px-5 py-4">
                                                ₹
                                                {
                                                    doctor.consultationFee
                                                }
                                            </td>

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm ${
                                                        doctor.status ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {
                                                        doctor.status
                                                    }
                                                </span>

                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex gap-2">

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                doctor
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                doctor
                                                            )
                                                        }
                                                        className={`px-3 py-2 rounded-lg ${
                                                            doctor.status ===
                                                            "active"
                                                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                                : "bg-green-100 text-green-700 hover:bg-green-200"
                                                        }`}
                                                    >
                                                        {doctor.status ===
                                                        "active"
                                                            ? "Disable"
                                                            : "Enable"}
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ======================================
                ADD / EDIT MODAL
            ====================================== */}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

                        {/* MODAL HEADER */}

                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">

                            <h2 className="text-xl font-bold">
                                {editingDoctor
                                    ? "Edit Doctor"
                                    : "Add Doctor"}
                            </h2>

                            <button
                                onClick={() => {
                                    setShowForm(
                                        false
                                    );
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-6 space-y-6"
                        >

                            {/* PERSONAL INFORMATION */}

                            <div>

                                <h3 className="font-semibold text-lg mb-4">
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <input
                                        name="name"
                                        value={
                                            formData.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Full Name"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="email"
                                        type="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Email"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="mobile"
                                        value={
                                            formData.mobile
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Mobile Number"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    {!editingDoctor && (
                                        <input
                                            name="password"
                                            type="password"
                                            value={
                                                formData.password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Password"
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}

                                    <select
                                        name="gender"
                                        value={
                                            formData.gender
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            Select Gender
                                        </option>

                                        <option value="male">
                                            Male
                                        </option>

                                        <option value="female">
                                            Female
                                        </option>

                                        <option value="other">
                                            Other
                                        </option>
                                    </select>

                                    <input
                                        name="dateOfBirth"
                                        type="date"
                                        value={
                                            formData.dateOfBirth
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                            </div>

                            {/* PROFESSIONAL INFORMATION */}

                            <div>

                                <h3 className="font-semibold text-lg mb-4">
                                    Professional Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <input
                                        name="specialization"
                                        value={
                                            formData.specialization
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Specialization"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="qualification"
                                        value={
                                            formData.qualification
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Qualification"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="experience"
                                        type="number"
                                        min="0"
                                        value={
                                            formData.experience
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Experience in years"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="consultationFee"
                                        type="number"
                                        min="0"
                                        value={
                                            formData.consultationFee
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Consultation Fee"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                            </div>

                            {/* AVAILABILITY */}

                            <div>

                                <h3 className="font-semibold text-lg mb-4">
                                    Availability
                                </h3>

                                <div className="flex flex-wrap gap-3 mb-4">

                                    {days.map(
                                        (day) => (
                                            <label
                                                key={
                                                    day
                                                }
                                                className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.availableDays.includes(
                                                        day
                                                    )}
                                                    onChange={() =>
                                                        handleDayChange(
                                                            day
                                                        )
                                                    }
                                                />

                                                {day}
                                            </label>
                                        )
                                    )}

                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <input
                                        name="availableFrom"
                                        type="time"
                                        value={
                                            formData.availableFrom
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="availableTo"
                                        type="time"
                                        value={
                                            formData.availableTo
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                            </div>

                            {/* ADDRESS / BIO */}

                            <div className="space-y-4">

                                <textarea
                                    name="address"
                                    value={
                                        formData.address
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Address"
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <textarea
                                    name="bio"
                                    value={
                                        formData.bio
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Doctor Bio"
                                    rows="4"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                            </div>

                            {/* BUTTONS */}

                            <div className="flex justify-end gap-3 border-t pt-5">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(
                                            false
                                        );
                                        resetForm();
                                    }}
                                    className="px-5 py-3 border rounded-lg"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingDoctor
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