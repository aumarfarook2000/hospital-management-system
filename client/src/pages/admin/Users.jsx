import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiX,
  FiEdit2,
} from "react-icons/fi";

import api from "../../api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "receptionist",
  });

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const getError = (err) =>
    err.response?.data?.message ||
    err.message ||
    "Something went wrong.";

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/users");

      setUsers(data.users || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const text = search.toLowerCase();

      const matchesSearch = [
        user.name,
        user.email,
        user.mobile,
        user.role,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(text)
      );

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  const stats = useMemo(() => {
    return {
      total: users.length,

      active: users.filter(
        (user) => user.status === "active"
      ).length,

      inactive: users.filter(
        (user) => user.status === "inactive"
      ).length,

      staff: users.filter(
        (user) =>
          user.role === "admin" ||
          user.role === "receptionist"
      ).length,
    };
  }, [users]);

  // ==========================================
  // OPEN ADD STAFF MODAL
  // ==========================================

  const openAddModal = () => {
    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "receptionist",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT STAFF MODAL
  // ==========================================

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      password: "",
      role: user.role || "receptionist",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "receptionist",
    });
  };

  // ==========================================
  // ADD / EDIT STAFF
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingUser) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          role: form.role,
        };

        // Only send password when entered
        if (form.password.trim()) {
          payload.password = form.password;
        }

        await api.put(
          `/users/staff/${editingUser._id}`,
          payload
        );

        closeModal();

        setSuccess(
          "Staff account updated successfully."
        );
      } else {
        await api.post("/users/staff", {
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
          role: form.role,
        });

        closeModal();

        setSuccess(
          "Staff account created successfully."
        );
      }

      await fetchUsers();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE
  // ==========================================

  const handleStatus = async (user) => {
    const newStatus =
      user.status === "active"
        ? "inactive"
        : "active";

    try {
      setError("");
      setSuccess("");

      await api.put(
        `/users/${user._id}/status`,
        {
          status: newStatus,
        }
      );

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      setSuccess(
        `${user.name} is now ${newStatus}.`
      );
    } catch (err) {
      setError(getError(err));
    }
  };

  // ==========================================
  // ROLE BADGE STYLE
  // ==========================================

  const roleStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";

      case "doctor":
        return "bg-blue-100 text-blue-700";

      case "receptionist":
        return "bg-amber-100 text-amber-700";

      case "patient":
        return "bg-emerald-100 text-emerald-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            User Management
          </h1>

          <p className="mt-1 text-slate-500">
            Manage hospital users and staff accounts.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus size={18} />
          Add Staff
        </button>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* STATS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={FiUsers}
        />

        <StatCard
          title="Active Users"
          value={stats.active}
          icon={FiUserCheck}
        />

        <StatCard
          title="Inactive Users"
          value={stats.inactive}
          icon={FiUserX}
        />

        <StatCard
          title="Staff Accounts"
          value={stats.staff}
          icon={FiUsers}
        />
      </div>

      {/* SEARCH */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, email, mobile or role..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">
              All Roles
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="doctor">
              Doctor
            </option>

            <option value="receptionist">
              Receptionist
            </option>

            <option value="patient">
              Patient
            </option>
          </select>
        </div>
      </div>

      {/* USERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">
                    User
                  </th>

                  <th className="px-5 py-4">
                    Contact
                  </th>

                  <th className="px-5 py-4">
                    Role
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Last Login
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600">
                          {user.name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {user.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {user.mobile || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleStyle(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {user.lastLogin
                        ? new Date(
                            user.lastLogin
                          ).toLocaleString(
                            "en-IN"
                          )
                        : "Never"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* EDIT ONLY ADMIN / RECEPTIONIST */}

                        {(user.role === "admin" ||
                          user.role ===
                            "receptionist") && (
                          <button
                            onClick={() =>
                              openEditModal(
                                user
                              )
                            }
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            <FiEdit2
                              size={14}
                            />
                            Edit
                          </button>
                        )}

                        {/* STATUS */}

                        <button
                          onClick={() =>
                            handleStatus(user)
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            user.status ===
                            "active"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {user.status ===
                          "active"
                            ? "Deactivate"
                            : "Activate"}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingUser
                    ? "Edit Staff"
                    : "Add Staff"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingUser
                    ? "Update staff account information."
                    : "Create a hospital staff login account."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >
              {/* NAME */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email *
                </label>

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              {/* MOBILE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mobile
                </label>

                <input
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mobile: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              {/* ROLE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role *
                </label>

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="receptionist">
                    Receptionist
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
              </div>

              {/* PASSWORD */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password{" "}
                  {editingUser
                    ? "(optional)"
                    : "*"}
                </label>

                <input
                  type="password"
                  required={!editingUser}
                  minLength={
                    form.password
                      ? 6
                      : undefined
                  }
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current password"
                      : "Minimum 6 characters"
                  }
                />

                {editingUser && (
                  <p className="mt-1 text-xs text-slate-500">
                    Leave password blank if
                    you do not want to change
                    it.
                  </p>
                )}
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingUser
                      ? "Updating..."
                      : "Creating..."
                    : editingUser
                      ? "Update Staff"
                      : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({
  title,
  value,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

export default Users;