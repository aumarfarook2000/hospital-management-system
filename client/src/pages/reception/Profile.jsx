
import { useEffect, useState } from "react";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiShield,
    FiEdit2,
    FiSave,
    FiX,
    FiLock,
    FiRefreshCw,
    FiEye,
    FiEyeOff,
} from "react-icons/fi";

import api from "../../api";

const initialPassword = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const getError = (error) =>
    error.response?.data?.message ||
    error.message ||
    "Something went wrong.";

const Profile = () => {
    const [user, setUser] = useState(null);

    const [form, setForm] = useState({
        name: "",
        mobile: "",
    });

    const [passwordForm, setPasswordForm] =
        useState(initialPassword);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] =
        useState(false);

    const [editing, setEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] =
        useState(false);
    const [showPasswords, setShowPasswords] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const { data } = await api.get("/users/me");

            setUser(data.user);

            setForm({
                name: data.user.name || "",
                mobile: data.user.mobile || "",
            });
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((prev) => ({
            ...prev,
            [name]: value,
        }));
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
                "/users/me",
                {
                    name: form.name,
                    mobile: form.mobile,
                }
            );

            setUser(data.user);
            setEditing(false);
            setSuccess(data.message);
        } catch (err) {
            setError(getError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            setError("New passwords do not match.");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setError(
                "New password must be at least 8 characters."
            );
            return;
        }

        try {
            setChangingPassword(true);

            const { data } = await api.put(
                "/users/me/password",
                {
                    currentPassword:
                        passwordForm.currentPassword,
                    newPassword:
                        passwordForm.newPassword,
                }
            );

            setSuccess(data.message);
            setPasswordForm(initialPassword);
            setShowPasswordForm(false);
            setShowPasswords(false);
        } catch (err) {
            setError(getError(err));
        } finally {
            setChangingPassword(false);
        }
    };

    const cancelEdit = () => {
        setForm({
            name: user?.name || "",
            mobile: user?.mobile || "",
        });

        setEditing(false);
        setError("");
    };

    if (loading) {
        return (
            <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm">
                Loading receptionist profile...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl bg-red-50 p-5 text-red-700">
                    {error || "Profile not found."}
                </div>

                <button
                    onClick={loadProfile}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        My Profile
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Manage your receptionist account
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadProfile}
                    disabled={saving || changingPassword}
                    className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 hover:bg-gray-50"
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

            {/* PROFILE CARD */}

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FiUser size={38} />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {user.name}
                        </h2>

                        <p className="mt-1 text-gray-500">
                            Receptionist
                        </p>
                    </div>

                    <span
                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                            user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {user.status}
                    </span>
                </div>
            </div>

            {/* PERSONAL INFORMATION */}

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
                                    onChange={handleFormChange}
                                    required
                                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Mobile Number
                                </label>

                                <input
                                    name="mobile"
                                    value={form.mobile}
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                            >
                                <FiSave />
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg border px-5 py-3"
                            >
                                <FiX />
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                                <FiUser />
                                Full Name
                            </p>

                            <p className="font-medium text-gray-800">
                                {user.name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                                <FiMail />
                                Email Address
                            </p>

                            <p className="break-all font-medium text-gray-800">
                                {user.email || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                                <FiPhone />
                                Mobile Number
                            </p>

                            <p className="font-medium text-gray-800">
                                {user.mobile || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                                <FiShield />
                                Account Role
                            </p>

                            <p className="font-medium capitalize text-gray-800">
                                {user.role}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* PASSWORD SECTION */}

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <FiLock className="text-blue-600" />
                            Account Security
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Change your account password
                        </p>
                    </div>

                    {!showPasswordForm && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowPasswordForm(true);
                                setError("");
                                setSuccess("");
                            }}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Change Password
                        </button>
                    )}
                </div>

                {showPasswordForm && (
                    <form
                        onSubmit={handleChangePassword}
                        className="max-w-xl space-y-4"
                    >
                        {[
                            {
                                name: "currentPassword",
                                label: "Current Password",
                            },
                            {
                                name: "newPassword",
                                label: "New Password",
                            },
                            {
                                name: "confirmPassword",
                                label: "Confirm New Password",
                            },
                        ].map((field) => (
                            <div key={field.name}>
                                <label className="mb-2 block text-sm font-medium">
                                    {field.label}
                                </label>

                                <input
                                    type={
                                        showPasswords
                                            ? "text"
                                            : "password"
                                    }
                                    name={field.name}
                                    value={
                                        passwordForm[field.name]
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    required
                                    autoComplete={
                                        field.name ===
                                        "currentPassword"
                                            ? "current-password"
                                            : "new-password"
                                    }
                                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                setShowPasswords(
                                    (prev) => !prev
                                )
                            }
                            className="flex items-center gap-2 text-sm text-blue-600"
                        >
                            {showPasswords ? (
                                <FiEyeOff />
                            ) : (
                                <FiEye />
                            )}

                            {showPasswords
                                ? "Hide Passwords"
                                : "Show Passwords"}
                        </button>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={changingPassword}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                            >
                                <FiLock />
                                {changingPassword
                                    ? "Updating..."
                                    : "Update Password"}
                            </button>

                            <button
                                type="button"
                                disabled={changingPassword}
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordForm(
                                        initialPassword
                                    );
                                    setShowPasswords(false);
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
};

export default Profile;
