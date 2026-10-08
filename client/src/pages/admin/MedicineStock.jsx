
import { useEffect, useState } from "react";
import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const emptyForm = {
  medicine: "",
  batchNumber: "",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "",
  manufactureDate: "",
  expiryDate: "",
  supplier: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const getError = (err) =>
  err.response?.data?.message ||
  err.message ||
  "Something went wrong.";

const prepareStock = (item) => ({
  medicine: item.medicine,
  batchNumber: item.batchNumber.trim(),
  purchasePrice: Number(item.purchasePrice),
  sellingPrice: Number(item.sellingPrice),
  quantity: Number(item.quantity),
  manufactureDate: item.manufactureDate || undefined,
  expiryDate: item.expiryDate,
  supplier: item.supplier.trim(),
});

function MedicineStock() {
  const {
    settings,
    formatDate,
    formatCurrency,
  } = useSettings();

  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  const [bulkRows, setBulkRows] = useState([
    { ...emptyForm },
  ]);

  const lowStockLevel = Number(
    settings?.lowStockLevel ?? 10
  );

  const expiryWarningDays = Number(
    settings?.expiryWarningDays ?? 30
  );

  const fetchStock = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        "/pharmacy/stock"
      );

      setBatches(data.batches || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const { data } = await api.get(
        "/pharmacy/medicines"
      );

      setMedicines(
        (data.medicines || []).filter(
          (medicine) =>
            medicine.status === "active"
        )
      );
    } catch (err) {
      setError(getError(err));
    }
  };

  useEffect(() => {
    fetchStock();
    fetchMedicines();
  }, []);

  const openSingleStock = () => {
    setFormData({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openBulkStock = () => {
    setBulkRows([{ ...emptyForm }]);
    setError("");
    setSuccess("");
    setShowBulkForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post(
        "/pharmacy/stock",
        prepareStock(formData)
      );

      setShowForm(false);
      setFormData({ ...emptyForm });

      await fetchStock();

      setSuccess(
        "Medicine stock added successfully."
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // BULK STOCK
  // =====================================

  const addBulkRow = () => {
    if (bulkRows.length >= 100) {
      setError(
        "Maximum 100 stock rows are allowed."
      );
      return;
    }

    setBulkRows((prev) => [
      ...prev,
      { ...emptyForm },
    ]);
  };

  const removeBulkRow = (index) => {
    setBulkRows((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateBulkRow = (index, name, value) => {
    setBulkRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, [name]: value }
          : row
      )
    );
  };

  const bulkPurchaseTotal = bulkRows.reduce(
    (total, row) =>
      total +
      Number(row.purchasePrice || 0) *
        Number(row.quantity || 0),
    0
  );

  const bulkSellingTotal = bulkRows.reduce(
    (total, row) =>
      total +
      Number(row.sellingPrice || 0) *
        Number(row.quantity || 0),
    0
  );

  const validateBulkRows = () => {
    const seen = new Set();

    for (let i = 0; i < bulkRows.length; i++) {
      const row = bulkRows[i];
      const number = i + 1;

      if (
        !row.medicine ||
        !row.batchNumber.trim() ||
        row.purchasePrice === "" ||
        row.sellingPrice === "" ||
        row.quantity === "" ||
        !row.expiryDate
      ) {
        return `Complete all required fields in row ${number}.`;
      }

      if (
        !Number.isInteger(Number(row.quantity)) ||
        Number(row.quantity) <= 0
      ) {
        return `Enter a valid quantity in row ${number}.`;
      }

      if (
        !Number.isFinite(Number(row.purchasePrice)) ||
        Number(row.purchasePrice) < 0 ||
        !Number.isFinite(Number(row.sellingPrice)) ||
        Number(row.sellingPrice) < 0
      ) {
        return `Enter valid prices in row ${number}.`;
      }

      const key = [
        row.medicine,
        row.batchNumber.trim().toLowerCase(),
      ].join(":");

      if (seen.has(key)) {
        return `Duplicate medicine and batch number in row ${number}.`;
      }

      seen.add(key);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiry = new Date(
        `${row.expiryDate}T00:00:00`
      );

      if (
        Number.isNaN(expiry.getTime()) ||
        expiry <= today
      ) {
        return `Expiry date must be in the future in row ${number}.`;
      }

      if (
        row.manufactureDate &&
        row.manufactureDate > row.expiryDate
      ) {
        return `Manufacture date cannot be after expiry date in row ${number}.`;
      }
    }

    return "";
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    const validationError = validateBulkRows();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data } = await api.post(
        "/pharmacy/stock/bulk",
        {
          items: bulkRows.map(prepareStock),
        }
      );

      setShowBulkForm(false);
      setBulkRows([{ ...emptyForm }]);

      await fetchStock();

      setSuccess(
        data.message ||
          `${bulkRows.length} stock batches added successfully.`
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // STOCK STATUS
  // =====================================

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryPart = String(expiryDate).slice(
      0,
      10
    );

    const expiry = new Date(
      `${expiryPart}T00:00:00`
    );

    if (Number.isNaN(expiry.getTime())) {
      return null;
    }

    return Math.round(
      (expiry.getTime() - today.getTime()) /
        86400000
    );
  };

  const getStockStatus = (batch) => {
    const quantity = Number(batch.quantity || 0);

    const days = getDaysUntilExpiry(
      batch.expiryDate
    );

    if (days !== null && days < 0) {
      return {
        type: "expired",
        label: "Expired",
        className: "bg-red-100 text-red-700",
      };
    }

    if (quantity <= 0) {
      return {
        type: "out",
        label: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (
      days !== null &&
      days <= expiryWarningDays
    ) {
      return {
        type: "expiring",
        label:
          days === 0
            ? "Expires Today"
            : `Expiring in ${days} day${
                days === 1 ? "" : "s"
              }`,
        className:
          "bg-orange-100 text-orange-700",
      };
    }

    if (quantity <= lowStockLevel) {
      return {
        type: "low",
        label: "Low Stock",
        className:
          "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      type: "available",
      label: "Available",
      className: "bg-green-100 text-green-700",
    };
  };

  const filteredBatches = batches.filter(
    (batch) =>
      [
        batch.medicine?.name,
        batch.medicine?.genericName,
        batch.batchNumber,
        batch.supplier,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
  );

  const statusCounts = batches.reduce(
    (counts, batch) => {
      const status = getStockStatus(batch);

      counts[status.type] += 1;

      return counts;
    },
    {
      available: 0,
      low: 0,
      expiring: 0,
      expired: 0,
      out: 0,
    }
  );

  const stockQuantity = batches.reduce(
    (total, batch) =>
      total + Number(batch.quantity || 0),
    0
  );

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Medicine Stock
          </h1>

          <p className="mt-1 text-gray-500">
            Manage medicine batches, quantities,
            prices and expiry dates.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openSingleStock}
            className="rounded-lg border border-blue-600 bg-white px-5 py-3 font-medium text-blue-600 hover:bg-blue-50"
          >
            + Add Stock
          </button>

          <button
            type="button"
            onClick={openBulkStock}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            + Add Bulk Stock
          </button>
        </div>
      </div>

      {/* SETTINGS */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Low stock warning:{" "}
        <strong>{lowStockLevel} units</strong>
        {" • "}
        Expiry warning:{" "}
        <strong>{expiryWarningDays} days</strong>
        {" • "}
        Total quantity:{" "}
        <strong>{stockQuantity}</strong>
      </div>

      {/* ALERTS */}

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg bg-red-100 p-4 text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
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

      {/* SUMMARY */}

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Available"
            value={statusCounts.available}
            className="border-green-200 bg-green-50 text-green-700"
          />

          <SummaryCard
            title="Low Stock"
            value={statusCounts.low}
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          />

          <SummaryCard
            title="Expiring Soon"
            value={statusCounts.expiring}
            className="border-orange-200 bg-orange-50 text-orange-700"
          />

          <SummaryCard
            title="Expired"
            value={statusCounts.expired}
            className="border-red-200 bg-red-50 text-red-700"
          />

          <SummaryCard
            title="Out of Stock"
            value={statusCounts.out}
            className="border-red-200 bg-red-50 text-red-700"
          />
        </div>
      )}

      {/* SEARCH */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search medicine, batch or supplier..."
          className={inputClass}
        />
      </div>

      {/* STOCK TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading stock...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No medicine stock found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {[
                    "Medicine",
                    "Batch",
                    "Quantity",
                    "Purchase",
                    "Selling",
                    "Expiry",
                    "Supplier",
                    "Status",
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
                {filteredBatches.map((batch) => {
                  const status =
                    getStockStatus(batch);

                  return (
                    <tr
                      key={batch._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800">
                          {batch.medicine?.name || "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {batch.medicine?.unit || ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {batch.batchNumber}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {batch.quantity}
                      </td>

                      <td className="px-5 py-4">
                        {formatCurrency(
                          Number(batch.purchasePrice || 0)
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {formatCurrency(
                          Number(batch.sellingPrice || 0)
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {batch.expiryDate
                          ? formatDate(batch.expiryDate)
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        {batch.supplier || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE STOCK MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">
                Add Medicine Stock
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-2xl text-gray-500"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <StockFields
                row={formData}
                medicines={medicines}
                onChange={(name, value) =>
                  setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                  }))
                }
                inputClass={inputClass}
              />

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK STOCK MODAL */}

      {showBulkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Add Bulk Medicine Stock
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add multiple registered medicine
                  batches in one transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowBulkForm(false)
                }
                disabled={saving}
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleBulkSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {bulkRows.map((row, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">
                        Stock Row {index + 1}
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          removeBulkRow(index)
                        }
                        disabled={
                          bulkRows.length === 1 ||
                          saving
                        }
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>

                    <StockFields
                      row={row}
                      medicines={medicines}
                      onChange={(name, value) =>
                        updateBulkRow(
                          index,
                          name,
                          value
                        )
                      }
                      inputClass={inputClass}
                    />

                    <div className="mt-4 flex flex-wrap gap-5 border-t pt-3 text-sm">
                      <span className="text-gray-600">
                        Purchase Total:{" "}
                        <strong className="text-gray-900">
                          {formatCurrency(
                            Number(
                              row.purchasePrice || 0
                            ) *
                              Number(
                                row.quantity || 0
                              )
                          )}
                        </strong>
                      </span>

                      <span className="text-gray-600">
                        Selling Value:{" "}
                        <strong className="text-gray-900">
                          {formatCurrency(
                            Number(
                              row.sellingPrice || 0
                            ) *
                              Number(
                                row.quantity || 0
                              )
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBulkRow}
                  disabled={
                    bulkRows.length >= 100 || saving
                  }
                  className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  + Add Another Stock Row
                </button>
              </div>

              {/* TOTALS AND ACTIONS */}

              <div className="shrink-0 border-t bg-white p-5">
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Total Batches
                    </p>
                    <p className="text-xl font-bold">
                      {bulkRows.length}
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">
                      Total Purchase Value
                    </p>
                    <p className="text-lg font-bold text-blue-800">
                      {formatCurrency(
                        bulkPurchaseTotal
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-700">
                      Total Selling Value
                    </p>
                    <p className="text-lg font-bold text-green-800">
                      {formatCurrency(
                        bulkSellingTotal
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowBulkForm(false)
                    }
                    disabled={saving}
                    className="rounded-lg border px-5 py-3 text-gray-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving All..."
                      : `Save All ${bulkRows.length} Batches`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================
// REUSABLE STOCK FIELDS
// =====================================

function StockFields({
  row,
  medicines,
  onChange,
  inputClass,
}) {
  const field = (name) => ({
    name,
    value: row[name],
    onChange: (e) =>
      onChange(name, e.target.value),
    className: inputClass,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Medicine *
        </label>

        <select
          {...field("medicine")}
          required
        >
          <option value="">
            Select Medicine
          </option>

          {medicines.map((medicine) => (
            <option
              key={medicine._id}
              value={medicine._id}
            >
              {medicine.name} ({medicine.unit})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Batch Number *
        </label>

        <input
          {...field("batchNumber")}
          required
          placeholder="Example: MED-001"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Quantity *
        </label>

        <input
          {...field("quantity")}
          type="number"
          min="1"
          step="1"
          required
          placeholder="100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Purchase Price (per unit) *
        </label>

        <input
          {...field("purchasePrice")}
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="1.50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Selling Price (per unit) *
        </label>

        <input
          {...field("sellingPrice")}
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="2.50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Manufacture Date
        </label>

        <input
          {...field("manufactureDate")}
          type="date"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Expiry Date *
        </label>

        <input
          {...field("expiryDate")}
          type="date"
          required
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-2">
        <label className="mb-1 block text-sm font-medium">
          Supplier
        </label>

        <input
          {...field("supplier")}
          placeholder="Supplier name"
        />
      </div>
    </div>
  );
}

// =====================================
// SUMMARY CARD
// =====================================

function SummaryCard({
  title,
  value,
  className,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
    >
      <p className="text-sm font-medium">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs opacity-75">
        batches
      </p>
    </div>
  );
}

export default MedicineStock;
