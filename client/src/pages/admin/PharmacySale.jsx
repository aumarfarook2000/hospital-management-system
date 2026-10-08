
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const emptyItem = () => ({
  medicine: "",
  quantity: "1",
});

const emptyForm = () => ({
  patient: "",
  medicalRecord: "",
  items: [emptyItem()],
  discount: "0",
  paidAmount: "",
  paymentMethod: "cash",
  notes: "",
});

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const getError = (err) =>
  err.response?.data?.message ||
  err.message ||
  "Something went wrong.";

function PharmacySale() {
  const { formatCurrency, formatDate } = useSettings();

  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [stock, setStock] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdSale, setCreatedSale] = useState(null);

  // =====================================
  // LOAD DATA
  // =====================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        patientsResponse,
        medicinesResponse,
        stockResponse,
        prescriptionsResponse,
      ] = await Promise.all([
        api.get("/patients"),
        api.get("/pharmacy/medicines"),
        api.get("/pharmacy/stock"),
        api.get("/pharmacy/prescriptions"),
      ]);

      setPatients(
        (patientsResponse.data.patients || []).filter(
          (patient) => patient.status === "active"
        )
      );

      setMedicines(
        (medicinesResponse.data.medicines || []).filter(
          (medicine) => medicine.status === "active"
        )
      );

      setStock(stockResponse.data.batches || []);

      setPrescriptions(
        prescriptionsResponse.data.prescriptions || []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================
  // STOCK HELPERS
  // =====================================

  const getValidBatches = (medicineId) => {
    if (!medicineId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return stock
      .filter((batch) => {
        const batchMedicineId =
          typeof batch.medicine === "object"
            ? batch.medicine?._id
            : batch.medicine;

        if (batchMedicineId !== medicineId) {
          return false;
        }

        if (
          batch.status !== "active" ||
          Number(batch.quantity) <= 0 ||
          !batch.expiryDate
        ) {
          return false;
        }

        const expiryPart = String(
          batch.expiryDate
        ).slice(0, 10);

        const expiry = new Date(
          `${expiryPart}T00:00:00`
        );

        return (
          !Number.isNaN(expiry.getTime()) &&
          expiry >= today
        );
      })
      .sort(
        (a, b) =>
          new Date(a.expiryDate) -
          new Date(b.expiryDate)
      );
  };

  const getAvailableStock = (medicineId) =>
    getValidBatches(medicineId).reduce(
      (sum, batch) =>
        sum + Number(batch.quantity || 0),
      0
    );

  // FEFO estimate: earliest expiry first.
  // Actual prices and deductions are calculated
  // by the backend when the sale is saved.
  const getEstimatedLineTotal = (
    medicineId,
    quantity
  ) => {
    let remaining = Number(quantity || 0);
    let total = 0;

    for (const batch of getValidBatches(medicineId)) {
      if (remaining <= 0) break;

      const available = Number(batch.quantity || 0);
      const taken = Math.min(remaining, available);

      total +=
        taken * Number(batch.sellingPrice || 0);

      remaining -= taken;
    }

    return total;
  };

  const getEstimatedPrice = (medicineId) => {
    const firstBatch = getValidBatches(medicineId)[0];

    return Number(firstBatch?.sellingPrice || 0);
  };

  // =====================================
  // PATIENT PRESCRIPTIONS
  // =====================================

  const patientRecords = useMemo(() => {
    if (!formData.patient) return [];

    return prescriptions.filter((record) => {
      const patientId =
        typeof record.patient === "object"
          ? record.patient?._id
          : record.patient;

      return patientId === formData.patient;
    });
  }, [prescriptions, formData.patient]);

  // =====================================
  // MEDICINE ROWS
  // =====================================

  const updateItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  // =====================================
  // ESTIMATED TOTALS
  // =====================================

  const estimatedSubtotal = formData.items.reduce(
    (total, item) =>
      total +
      getEstimatedLineTotal(
        item.medicine,
        item.quantity
      ),
    0
  );

  const discount = Number(formData.discount || 0);
  const paidAmount = Number(formData.paidAmount || 0);

  const estimatedTotal = Math.max(
    0,
    estimatedSubtotal - discount
  );

  const estimatedBalance = Math.max(
    0,
    estimatedTotal - paidAmount
  );

  const totalQuantity = formData.items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  // =====================================
  // VALIDATION
  // =====================================

  const validateSale = () => {
    if (!formData.patient) {
      return "Please select a patient.";
    }

    if (formData.items.length === 0) {
      return "Add at least one medicine.";
    }

    const selectedMedicines = new Set();

    for (
      let index = 0;
      index < formData.items.length;
      index++
    ) {
      const item = formData.items[index];
      const rowNumber = index + 1;

      if (!item.medicine) {
        return `Select a medicine in row ${rowNumber}.`;
      }

      if (selectedMedicines.has(item.medicine)) {
        return `Medicine in row ${rowNumber} is already selected.`;
      }

      selectedMedicines.add(item.medicine);

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return `Enter a valid quantity in row ${rowNumber}.`;
      }

      const availableStock = getAvailableStock(
        item.medicine
      );

      if (availableStock <= 0) {
        return `Medicine in row ${rowNumber} is out of stock or expired.`;
      }

      if (quantity > availableStock) {
        return `Row ${rowNumber}: Only ${availableStock} units are available.`;
      }
    }

    if (
      !Number.isFinite(discount) ||
      discount < 0
    ) {
      return "Enter a valid discount.";
    }

    if (discount > estimatedSubtotal) {
      return "Discount cannot exceed the estimated subtotal.";
    }

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount < 0
    ) {
      return "Enter a valid paid amount.";
    }

    if (paidAmount > estimatedTotal) {
      return "Paid amount cannot exceed the estimated total.";
    }

    return "";
  };

  // =====================================
  // SUBMIT SALE
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    const validationError = validateSale();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setCreatedSale(null);

      const payload = {
        patient: formData.patient,

        medicalRecord:
          formData.medicalRecord || null,

        items: formData.items.map((item) => ({
          medicine: item.medicine,
          quantity: Number(item.quantity),
        })),

        discount,

        paidAmount,

        paymentMethod: formData.paymentMethod,

        notes: formData.notes,
      };

      const { data } = await api.post(
        "/pharmacy/sales",
        payload
      );

      setCreatedSale(data.sale);

      setSuccess(
        `Sale ${
          data.sale?.saleId || ""
        } completed successfully.`
      );

      setFormData(emptyForm());

      // Refresh remaining stock after the sale.
      try {
        const stockResponse = await api.get(
          "/pharmacy/stock"
        );

        setStock(stockResponse.data.batches || []);
      } catch {
        setError(
          "Sale saved successfully, but stock could not be refreshed. Reload the page to see updated quantities."
        );
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading pharmacy...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          New Pharmacy Sale
        </h1>

        <p className="mt-1 text-gray-500">
          Sell medicines to registered patients.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* PATIENT */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Patient
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Select Patient *
              </label>

              <select
                required
                value={formData.patient}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    patient: e.target.value,
                    medicalRecord: "",
                  }))
                }
                className={inputClass}
              >
                <option value="">
                  Select Patient
                </option>

                {patients.map((patient) => (
                  <option
                    key={patient._id}
                    value={patient._id}
                  >
                    {patient.patientId} -{" "}
                    {patient.user?.name || "Patient"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Prescription
              </label>

              <select
                value={formData.medicalRecord}
                disabled={!formData.patient}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    medicalRecord: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">
                  No Prescription
                </option>

                {patientRecords.map((record) => (
                  <option
                    key={record._id}
                    value={record._id}
                  >
                    {record.medicalRecordId} -{" "}
                    {record.prescriptionDate
                      ? formatDate(
                          record.prescriptionDate
                        )
                      : "Date unavailable"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MEDICINES */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Medicines
            </h2>

            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-700 hover:bg-blue-200"
            >
              + Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => {
              const availableStock =
                getAvailableStock(item.medicine);

              const estimatedPrice =
                getEstimatedPrice(item.medicine);

              const quantity = Number(
                item.quantity || 0
              );

              const lineTotal =
                getEstimatedLineTotal(
                  item.medicine,
                  quantity
                );

              const insufficientStock =
                Boolean(item.medicine) &&
                quantity > availableStock;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-gray-700">
                      Medicine {index + 1}
                    </h3>

                    <button
                      type="button"
                      disabled={
                        formData.items.length === 1
                      }
                      onClick={() =>
                        removeItem(index)
                      }
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="xl:col-span-2">
                      <label className="mb-1 block text-sm font-medium">
                        Medicine *
                      </label>

                      <select
                        required
                        value={item.medicine}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "medicine",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Select Medicine
                        </option>

                        {medicines.map((medicine) => {
                          const available =
                            getAvailableStock(
                              medicine._id
                            );

                          const selectedElsewhere =
                            formData.items.some(
                              (other, otherIndex) =>
                                otherIndex !== index &&
                                other.medicine ===
                                  medicine._id
                            );

                          return (
                            <option
                              key={medicine._id}
                              value={medicine._id}
                              disabled={
                                available <= 0 ||
                                selectedElsewhere
                              }
                            >
                              {medicine.name} (
                              {available} available)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Quantity *
                      </label>

                      <input
                        type="number"
                        min="1"
                        max={
                          item.medicine
                            ? availableStock
                            : undefined
                        }
                        step="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                      <p>
                        Available Stock:{" "}
                        <strong>
                          {availableStock}
                        </strong>
                      </p>

                      <p className="mt-1">
                        Est. Unit Price:{" "}
                        <strong>
                          {formatCurrency(
                            estimatedPrice
                          )}
                        </strong>
                      </p>

                      <p className="mt-1">
                        Est. Line Total:{" "}
                        <strong>
                          {formatCurrency(lineTotal)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {insufficientStock && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      Insufficient stock. Only{" "}
                      {availableStock} units are
                      available.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            Stock and prices are estimated from
            available, unexpired batches. Final
            prices and batch deductions are
            calculated by the backend.
          </div>
        </div>

        {/* PAYMENT */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Payment
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Discount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discount: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Paid Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paidAmount: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Payment Method
              </label>

              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentMethod:
                      e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">
                  Bank Transfer
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex justify-between gap-3 text-sm">
                <span>Medicine Quantity</span>
                <strong>{totalQuantity}</strong>
              </div>

              <div className="mt-3 flex justify-between gap-3">
                <span>Estimated Subtotal</span>
                <strong>
                  {formatCurrency(
                    estimatedSubtotal
                  )}
                </strong>
              </div>

              <div className="mt-3 flex justify-between gap-3">
                <span>Discount</span>
                <strong>
                  {formatCurrency(discount)}
                </strong>
              </div>

              <div className="mt-3 flex justify-between gap-3 border-t pt-3 text-lg">
                <span>Estimated Total</span>
                <strong>
                  {formatCurrency(estimatedTotal)}
                </strong>
              </div>

              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span>Paid Amount</span>
                <strong>
                  {formatCurrency(paidAmount)}
                </strong>
              </div>

              <div className="mt-3 flex justify-between gap-3 font-semibold text-orange-700">
                <span>Estimated Balance</span>
                <strong>
                  {formatCurrency(
                    estimatedBalance
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              Notes
            </label>

            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className={inputClass}
              placeholder="Optional notes"
            />
          </div>
        </div>

        {/* SUBMIT */}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-600 px-8 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving
              ? "Processing..."
              : "Complete Sale"}
          </button>
        </div>
      </form>

      {/* SALE RESULT */}

      {createdSale && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-800">
            Sale Completed
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p>
              <strong>Sale ID:</strong>{" "}
              {createdSale.saleId}
            </p>

            <p>
              <strong>Patient:</strong>{" "}
              {createdSale.patient?.user?.name ||
                "-"}
            </p>

            <p>
              <strong>Total:</strong>{" "}
              {formatCurrency(
                createdSale.totalAmount
              )}
            </p>

            <p>
              <strong>Paid:</strong>{" "}
              {formatCurrency(
                createdSale.paidAmount
              )}
            </p>

            <p>
              <strong>Balance:</strong>{" "}
              {formatCurrency(
                createdSale.balanceAmount
              )}
            </p>

            <p className="capitalize">
              <strong>Status:</strong>{" "}
              {createdSale.paymentStatus}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacySale;
