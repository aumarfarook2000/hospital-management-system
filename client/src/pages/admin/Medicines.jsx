
import { useEffect, useMemo, useState } from "react";
import api from "../../api";

const createEmptyForm = () => ({
  name: "",
  genericName: "",
  category: "",
  manufacturer: "",
  unit: "tablet",
  prescriptionRequired: false,
  status: "active",
});

const unitOptions = [
  "tablet",
  "capsule",
  "strip",
  "bottle",
  "vial",
  "ampoule",
  "tube",
  "piece",
  "other",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const getError = (err) =>
  err.response?.data?.message ||
  err.message ||
  "Something went wrong.";

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] =
    useState(null);
  const [formData, setFormData] = useState(
    createEmptyForm
  );

  // ======================================
  // FETCH MEDICINES
  // ======================================

  const fetchMedicines = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        "/pharmacy/medicines"
      );

      setMedicines(data.medicines || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // ======================================
  // SUMMARY
  // ======================================

  const summary = useMemo(() => {
    return {
      total: medicines.length,

      active: medicines.filter(
        (medicine) => medicine.status === "active"
      ).length,

      inactive: medicines.filter(
        (medicine) => medicine.status === "inactive"
      ).length,

      prescription: medicines.filter(
        (medicine) => medicine.prescriptionRequired
      ).length,
    };
  }, [medicines]);

  // ======================================
  // FILTER
  // ======================================

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const matchesSearch = [
        medicine.name,
        medicine.genericName,
        medicine.category,
        medicine.manufacturer,
        medicine.unit,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "all" ||
        medicine.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [medicines, search, statusFilter]);

  // ======================================
  // FORM
  // ======================================

  const openAdd = () => {
    setEditingMedicine(null);
    setFormData(createEmptyForm());
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (medicine) => {
    setEditingMedicine(medicine);

    setFormData({
      name: medicine.name || "",
      genericName: medicine.genericName || "",
      category: medicine.category || "",
      manufacturer: medicine.manufacturer || "",
      unit: medicine.unit || "tablet",
      prescriptionRequired: Boolean(
        medicine.prescriptionRequired
      ),
      status: medicine.status || "active",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingMedicine(null);
    setFormData(createEmptyForm());
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ======================================
  // VALIDATION
  // ======================================

  const validateForm = () => {
    const name = formData.name.trim();

    if (!name) {
      return "Medicine name is required.";
    }

    if (name.length < 2) {
      return "Medicine name must contain at least 2 characters.";
    }

    const duplicate = medicines.some(
      (medicine) =>
        medicine._id !== editingMedicine?._id &&
        medicine.name?.trim().toLowerCase() ===
          name.toLowerCase()
    );

    if (duplicate) {
      return "A medicine with this name already exists.";
    }

    if (!unitOptions.includes(formData.unit)) {
      return "Please select a valid unit.";
    }

    if (
      !["active", "inactive"].includes(
        formData.status
      )
    ) {
      return "Please select a valid status.";
    }

    return "";
  };

  // ======================================
  // SAVE MEDICINE
  // ======================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      genericName: formData.genericName.trim(),
      category: formData.category.trim(),
      manufacturer: formData.manufacturer.trim(),
      unit: formData.unit,
      prescriptionRequired:
        formData.prescriptionRequired,
      status: formData.status,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingMedicine) {
        await api.put(
          `/pharmacy/medicines/${editingMedicine._id}`,
          payload
        );

        setSuccess(
          "Medicine updated successfully."
        );
      } else {
        await api.post(
          "/pharmacy/medicines",
          payload
        );

        setSuccess(
          "Medicine added successfully."
        );
      }

      setShowForm(false);
      setEditingMedicine(null);
      setFormData(createEmptyForm());

      await fetchMedicines();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // PAGE
  // ======================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Medicines
          </h1>

          <p className="mt-1 text-gray-500">
            Manage pharmacy medicine catalogue
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          + Add Medicine
        </button>
      </div>

      {/* ALERTS */}

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

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Medicines",
            value: summary.total,
          },
          {
            label: "Active Medicines",
            value: summary.active,
          },
          {
            label: "Inactive Medicines",
            value: summary.inactive,
          },
          {
            label: "Prescription Required",
            value: summary.prescription,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">
              {item.label}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-800">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTER */}

      <div className="grid gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Search Medicines
          </label>

          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Name, generic, category, manufacturer..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className={inputClass}
          >
            <option value="all">
              All Medicines
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* MEDICINES TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading medicines...
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No medicines found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {[
                    "Medicine",
                    "Generic",
                    "Category",
                    "Manufacturer",
                    "Unit",
                    "Prescription",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-4"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map((medicine) => (
                  <tr
                    key={medicine._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium">
                      {medicine.name}
                    </td>

                    <td className="px-5 py-4">
                      {medicine.genericName || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {medicine.category || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {medicine.manufacturer || "-"}
                    </td>

                    <td className="px-5 py-4 capitalize">
                      {medicine.unit}
                    </td>

                    <td className="px-5 py-4">
                      {medicine.prescriptionRequired
                        ? "Required"
                        : "No"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          medicine.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {medicine.status || "unknown"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(medicine)
                        }
                        className="rounded-lg bg-yellow-100 px-3 py-2 text-yellow-700 hover:bg-yellow-200"
                      >
                        Edit
                      </button>
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {editingMedicine
                    ? "Edit Medicine"
                    : "Add Medicine"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter medicine catalogue details
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-2xl text-gray-600 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Medicine Name *
                </label>

                <input
                  name="name"
                  required
                  minLength={2}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Example: Paracetamol 500mg"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Generic Name
                  </label>

                  <input
                    name="genericName"
                    value={formData.genericName}
                    onChange={handleChange}
                    placeholder="Paracetamol"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category
                  </label>

                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Analgesic"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Manufacturer
                </label>

                <input
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="Manufacturer name"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Unit *
                  </label>

                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {unitOptions.map((unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {unit.charAt(0).toUpperCase() +
                          unit.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status *
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="active">
                      Active
                    </option>
                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <input
                  type="checkbox"
                  name="prescriptionRequired"
                  checked={
                    formData.prescriptionRequired
                  }
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium">
                  Prescription required for this medicine
                </span>
              </label>

              {error && (
                <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border px-5 py-3 disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingMedicine
                      ? "Update Medicine"
                      : "Add Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Medicines;
