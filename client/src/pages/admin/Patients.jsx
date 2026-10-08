import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api/v1";

function Patients() {
    const { user } = useAuth();

    const [selectedPatient, setSelectedPatient] =
        useState(null);

    const [patients, setPatients] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    const [editingPatient, setEditingPatient] =
        useState(null);

    const [formData, setFormData] =
        useState({
            name: "",
            email: "",
            mobile: "",
            password: "",
            dateOfBirth: "",
            gender: "",
            bloodGroup: "",
            address: "",
            emergencyContactName: "",
            emergencyContactMobile: "",
            allergies: "",
            medicalHistory: "",
        });

    // ==========================================
    // TOKEN
    // ==========================================

    const getToken = () => {
        return localStorage.getItem(
            "hms_token"
        );
    };

    // ==========================================
    // FETCH PATIENTS
    // ==========================================

    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/patients`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch patients."
                );
            }

            setPatients(
                data.patients || []
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // ==========================================
    // INPUT CHANGE
    // ==========================================

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
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
            dateOfBirth: "",
            gender: "",
            bloodGroup: "",
            address: "",
            emergencyContactName: "",
            emergencyContactMobile: "",
            allergies: "",
            medicalHistory: "",
        });

        setEditingPatient(null);
    };

    // ==========================================
    // ADD PATIENT
    // ==========================================

    const handleAddPatient = () => {
        resetForm();
        setShowForm(true);
    };

    // ==========================================
    // EDIT PATIENT
    // ==========================================

    const handleEdit = (patient) => {
        setEditingPatient(patient);

        setFormData({
            name:
                patient.user?.name ||
                "",

            email:
                patient.user?.email ||
                "",

            mobile:
                patient.user?.mobile ||
                "",

            password: "",

            dateOfBirth:
                patient.dateOfBirth
                    ? patient.dateOfBirth.split(
                          "T"
                      )[0]
                    : "",

            gender:
                patient.gender || "",

            bloodGroup:
                patient.bloodGroup || "",

            address:
                patient.address || "",

            emergencyContactName:
                patient.emergencyContactName ||
                "",

            emergencyContactMobile:
                patient.emergencyContactMobile ||
                "",

            allergies:
                patient.allergies || "",

            medicalHistory:
                patient.medicalHistory ||
                "",
        });

        setShowForm(true);
    };

    // ==========================================
    // SUBMIT
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            const url =
                editingPatient
                    ? `${API_URL}/patients/${editingPatient._id}`
                    : `${API_URL}/patients`;

            const method =
                editingPatient
                    ? "PUT"
                    : "POST";

            const body = {
                ...formData,
            };

            if (
                editingPatient &&
                !body.password
            ) {
                delete body.password;
            }

            const response = await fetch(
                url,
                {
                    method,

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${getToken()}`,
                    },

                    body: JSON.stringify(
                        body
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Operation failed."
                );
            }

            alert(data.message);

            setShowForm(false);

            resetForm();

            fetchPatients();

        } catch (err) {
            setError(err.message);
        }
    };

    // ==========================================
    // STATUS
    // ==========================================

    const handleStatusChange =
        async (patient) => {

            const newStatus =
                patient.status ===
                "active"
                    ? "inactive"
                    : "active";

            const confirmed =
                window.confirm(
                    `Are you sure you want to ${
                        newStatus ===
                        "active"
                            ? "activate"
                            : "deactivate"
                    } this patient?`
                );

            if (!confirmed) return;

            try {
                setError("");

                const response =
                    await fetch(
                        `${API_URL}/patients/${patient._id}/status`,
                        {
                            method:
                                "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getToken()}`,
                            },

                            body: JSON.stringify(
                                {
                                    status:
                                        newStatus,
                                }
                            ),
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

                fetchPatients();

            } catch (err) {
                setError(
                    err.message
                );
            }
        };

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredPatients =
        patients.filter(
            (patient) => {

                const searchText =
                    search.toLowerCase();

                return (
                    patient.patientId
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    patient.user?.name
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    patient.user?.email
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    patient.user?.mobile
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||

                    patient.bloodGroup
                        ?.toLowerCase()
                        .includes(
                            searchText
                        )
                );
            }
        );

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* HEADER */}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Patients
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Manage hospital patients
                    </p>
                </div>

                {user?.role !==
                    "doctor" && (
                    <button
                        onClick={
                            handleAddPatient
                        }
                        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                    >
                        + Add Patient
                    </button>
                )}

            </div>

            {/* ERROR */}

            {error && (
                <div className="mb-5 rounded-lg bg-red-100 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}

            {/* SEARCH */}

            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">

                <input
                    type="text"
                    placeholder="Search patient by name, ID, email, mobile or blood group..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

            </div>

            {/* TABLE */}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                {loading ? (
                    <div className="p-10 text-center text-gray-500">
                        Loading patients...
                    </div>
                ) : filteredPatients.length ===
                  0 ? (
                    <div className="p-10 text-center text-gray-500">
                        No patients found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="border-b bg-gray-50">

                                <tr>

                                    <th className="px-5 py-4 text-left">
                                        Patient ID
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Patient
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Mobile
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Gender
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Blood Group
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

                                {filteredPatients.map(
                                    (
                                        patient
                                    ) => (

                                        <tr
                                            key={
                                                patient._id
                                            }
                                            className="border-b hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4 font-medium">
                                                {
                                                    patient.patientId
                                                }
                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-gray-800">
                                                    {
                                                        patient
                                                            .user
                                                            ?.name
                                                    }
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    {
                                                        patient
                                                            .user
                                                            ?.email
                                                    }
                                                </div>

                                            </td>

                                            <td className="px-5 py-4">
                                                {patient
                                                    .user
                                                    ?.mobile ||
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4 capitalize">
                                                {patient.gender ||
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4">
                                                {patient.bloodGroup ||
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`rounded-full px-3 py-1 text-sm ${
                                                        patient.status ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {
                                                        patient.status
                                                    }
                                                </span>

                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex flex-wrap gap-2">

                                                    {/* VIEW */}

                                                    <button
                                                        onClick={() =>
                                                            setSelectedPatient(
                                                                patient
                                                            )
                                                        }
                                                        className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
                                                    >
                                                        View
                                                    </button>

                                                    {/* EDIT */}

                                                    {user?.role !==
                                                        "doctor" && (
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(
                                                                    patient
                                                                )
                                                            }
                                                            className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    {/* STATUS - ADMIN ONLY */}

                                                    {user?.role ===
                                                        "admin" && (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    patient
                                                                )
                                                            }
                                                            className={`rounded-lg px-3 py-2 ${
                                                                patient.status ===
                                                                "active"
                                                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                                            }`}
                                                        >
                                                            {patient.status ===
                                                            "active"
                                                                ? "Disable"
                                                                : "Enable"}
                                                        </button>
                                                    )}

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
                ADD / EDIT PATIENT MODAL
            ====================================== */}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">

                            <h2 className="text-xl font-bold">

                                {editingPatient
                                    ? "Edit Patient"
                                    : "Add Patient"}

                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(
                                        false
                                    );

                                    resetForm();
                                }}
                                className="text-2xl text-gray-500 hover:text-gray-800"
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-6 p-6"
                        >

                            {/* PERSONAL INFORMATION */}

                            <div>

                                <h3 className="mb-4 text-lg font-semibold">
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

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
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    {!editingPatient && (
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
                                            className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}

                                    <input
                                        name="dateOfBirth"
                                        type="date"
                                        value={
                                            formData.dateOfBirth
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <select
                                        name="gender"
                                        value={
                                            formData.gender
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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

                                    <select
                                        name="bloodGroup"
                                        value={
                                            formData.bloodGroup
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >

                                        <option value="">
                                            Select Blood Group
                                        </option>

                                        {[
                                            "A+",
                                            "A-",
                                            "B+",
                                            "B-",
                                            "AB+",
                                            "AB-",
                                            "O+",
                                            "O-",
                                        ].map(
                                            (
                                                group
                                            ) => (
                                                <option
                                                    key={
                                                        group
                                                    }
                                                    value={
                                                        group
                                                    }
                                                >
                                                    {
                                                        group
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* EMERGENCY CONTACT */}

                            <div>

                                <h3 className="mb-4 text-lg font-semibold">
                                    Emergency Contact
                                </h3>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                    <input
                                        name="emergencyContactName"
                                        value={
                                            formData.emergencyContactName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Emergency Contact Name"
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        name="emergencyContactMobile"
                                        value={
                                            formData.emergencyContactMobile
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Emergency Contact Mobile"
                                        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                            </div>

                            {/* MEDICAL INFORMATION */}

                            <div>

                                <h3 className="mb-4 text-lg font-semibold">
                                    Medical Information
                                </h3>

                                <div className="space-y-4">

                                    <textarea
                                        name="allergies"
                                        value={
                                            formData.allergies
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Allergies"
                                        rows="3"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <textarea
                                        name="medicalHistory"
                                        value={
                                            formData.medicalHistory
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Medical History"
                                        rows="4"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

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
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                            </div>

                            <div className="flex justify-end gap-3 border-t pt-5">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(
                                            false
                                        );

                                        resetForm();
                                    }}
                                    className="rounded-lg border px-5 py-3"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                                >

                                    {editingPatient
                                        ? "Update Patient"
                                        : "Create Patient"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ======================================
                VIEW PATIENT DETAILS
            ====================================== */}

            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

                        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">

                            <div>

                                <h2 className="text-xl font-bold">
                                    Patient Details
                                </h2>

                                <p className="text-sm text-gray-500">
                                    {
                                        selectedPatient.patientId
                                    }
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedPatient(
                                        null
                                    )
                                }
                                className="text-2xl text-gray-500 hover:text-gray-800"
                            >
                                ×
                            </button>

                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Name
                                </p>

                                <p className="font-medium">
                                    {selectedPatient
                                        .user
                                        ?.name ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Email
                                </p>

                                <p className="font-medium">
                                    {selectedPatient
                                        .user
                                        ?.email ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Mobile
                                </p>

                                <p className="font-medium">
                                    {selectedPatient
                                        .user
                                        ?.mobile ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Gender
                                </p>

                                <p className="font-medium capitalize">
                                    {selectedPatient.gender ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Blood Group
                                </p>

                                <p className="font-medium">
                                    {selectedPatient.bloodGroup ||
                                        "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Date of Birth
                                </p>

                                <p className="font-medium">

                                    {selectedPatient.dateOfBirth
                                        ? new Date(
                                              selectedPatient.dateOfBirth
                                          ).toLocaleDateString()
                                        : "-"}

                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Emergency Contact
                                </p>

                                <p className="font-medium">
                                    {selectedPatient.emergencyContactName ||
                                        "-"}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {selectedPatient.emergencyContactMobile ||
                                        ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Status
                                </p>

                                <span
                                    className={`inline-block rounded-full px-3 py-1 text-sm ${
                                        selectedPatient.status ===
                                        "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {
                                        selectedPatient.status
                                    }
                                </span>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="text-sm text-gray-500">
                                    Address
                                </p>

                                <p className="font-medium">
                                    {selectedPatient.address ||
                                        "-"}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="text-sm text-gray-500">
                                    Allergies
                                </p>

                                <p className="font-medium">
                                    {selectedPatient.allergies ||
                                        "None recorded"}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="text-sm text-gray-500">
                                    Medical History
                                </p>

                                <p className="font-medium">
                                    {selectedPatient.medicalHistory ||
                                        "No medical history recorded"}
                                </p>
                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Patients;