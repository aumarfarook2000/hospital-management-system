import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../api";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useSettings,
} from "../../context/SettingsContext";

// ==========================================
// EMPTY ITEM
// ==========================================

const emptyItem = () => ({
  description: "",
  quantity: "1",
  unitPrice: "",
});

// ==========================================
// EMPTY FORM
// ==========================================

const emptyForm = () => ({
  appointment: "",
  items: [emptyItem()],
  discount: "0",
  notes: "",
});

// ==========================================
// ROUND MONEY
// ==========================================

const roundMoney = (value) => {
  return Math.round(
    (Number(value || 0) +
      Number.EPSILON) *
      100
  ) / 100;
};

// ==========================================
// ESCAPE HTML
// ==========================================

const escapeHtml = (value) => {
  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

// ==========================================
// BILLING
// ==========================================

function Billing() {
  const { user } = useAuth();

  const {
    settings,
    formatDate,
    formatDateTime,
    formatTime,
    formatCurrency,
  } = useSettings();

  const canManage = [
    "admin",
    "receptionist",
  ].includes(user?.role);

  // ========================================
  // SETTINGS
  // ========================================

  const hospitalName =
    settings?.hospitalName?.trim() ||
    "Hospital Management System";

  const taxPercentage =
    Math.max(
      0,
      Number(
        settings?.taxPercentage
      ) || 0
    );

  // ========================================
  // STATE
  // ========================================

  const [
    bills,
    setBills,
  ] = useState([]);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState(
    emptyForm()
  );

  const [
    selectedBill,
    setSelectedBill,
  ] = useState(null);

  const [
    paymentBill,
    setPaymentBill,
  ] = useState(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("cash");

  const [
    paymentHistory,
    setPaymentHistory,
  ] = useState([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  // ========================================
  // COMMON STYLE
  // ========================================

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  // ========================================
  // MONEY
  // ========================================

  const money = (value) => {
    return formatCurrency(
      Number(value || 0)
    );
  };

  // ========================================
  // ERROR
  // ========================================

  const getError = (err) =>
    err.response?.data
      ?.message ||
    err.message ||
    "Something went wrong.";

  // ========================================
  // FETCH BILLS
  // ========================================

  const fetchBills =
    async () => {
      try {
        setLoading(true);
        setError("");

        const { data } =
          await api.get(
            "/bills"
          );

        setBills(
          data.bills || []
        );
      } catch (err) {
        setError(
          getError(err)
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchBills();
  }, []);

  // ========================================
  // OPEN CREATE INVOICE
  // ========================================

  const openAdd =
    async () => {
      try {
        setError("");

        const { data } =
          await api.get(
            "/appointments"
          );

        const allAppointments =
          data.appointments ||
          [];

        const billedAppointmentIds =
          bills
            .map(
              (bill) =>
                bill.appointment
                  ?._id
            )
            .filter(Boolean);

        const availableAppointments =
          allAppointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
                "completed" &&
              !billedAppointmentIds.includes(
                appointment._id
              )
          );

        setAppointments(
          availableAppointments
        );

        setFormData(
          emptyForm()
        );

        setShowForm(true);
      } catch (err) {
        setError(
          getError(err)
        );
      }
    };

  // ========================================
  // UPDATE ITEM
  // ========================================

  const updateItem = (
    index,
    field,
    value
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        items:
          prev.items.map(
            (item, i) =>
              i === index
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          ),
      })
    );
  };

  // ========================================
  // ADD ITEM
  // ========================================

  const addItem = () => {
    setFormData(
      (prev) => ({
        ...prev,

        items: [
          ...prev.items,
          emptyItem(),
        ],
      })
    );
  };

  // ========================================
  // REMOVE ITEM
  // ========================================

  const removeItem = (
    index
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        items:
          prev.items.filter(
            (_, i) =>
              i !== index
          ),
      })
    );
  };

  // ========================================
  // PREVIEW CALCULATION
  // ========================================

  const subtotal =
    useMemo(() => {
      return roundMoney(
        formData.items.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity ||
                0
            ) *
              Number(
                item.unitPrice ||
                  0
              ),
          0
        )
      );
    }, [formData.items]);

  const discount =
    Math.max(
      0,
      Number(
        formData.discount ||
          0
      )
    );

  const taxableAmount =
    roundMoney(
      Math.max(
        0,
        subtotal - discount
      )
    );

  const taxAmount =
    roundMoney(
      taxableAmount *
        (taxPercentage /
          100)
    );

  const total =
    roundMoney(
      taxableAmount +
        taxAmount
    );

  // ========================================
  // CREATE BILL
  // ========================================

  const handleCreate =
    async (e) => {
      e.preventDefault();

      if (saving) {
        return;
      }

      if (
        !formData.appointment
      ) {
        setError(
          "Please select an appointment."
        );

        return;
      }

      if (
        formData.items.length ===
        0
      ) {
        setError(
          "Please add at least one bill item."
        );

        return;
      }

      if (
        discount >
        subtotal
      ) {
        setError(
          "Discount cannot be greater than subtotal."
        );

        return;
      }

      const invalidItem =
        formData.items.some(
          (item) =>
            !item.description
              ?.trim() ||
            Number(
              item.quantity
            ) <= 0 ||
            Number(
              item.unitPrice
            ) < 0
        );

      if (invalidItem) {
        setError(
          "Please enter valid bill item details."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        await api.post(
          "/bills",
          {
            appointment:
              formData.appointment,

            items:
              formData.items.map(
                (item) => ({
                  description:
                    item.description.trim(),

                  quantity:
                    Number(
                      item.quantity
                    ),

                  unitPrice:
                    Number(
                      item.unitPrice
                    ),
                })
              ),

            discount:
              Number(
                formData.discount ||
                  0
              ),

            notes:
              formData.notes,
          }
        );

        setShowForm(false);

        setFormData(
          emptyForm()
        );

        await fetchBills();
      } catch (err) {
        setError(
          getError(err)
        );
      } finally {
        setSaving(false);
      }
    };

  // ========================================
  // OPEN PAYMENT
  // ========================================

  const openPayment = (
    bill
  ) => {
    setPaymentBill(bill);

    setPaymentAmount("");

    setPaymentMethod(
      "cash"
    );

    setError("");
  };

  // ========================================
  // OPEN BILL DETAILS
  // ========================================

  const openBillDetails =
    async (bill) => {
      setSelectedBill(
        bill
      );

      setPaymentHistory(
        []
      );

      setHistoryError("");

      setHistoryLoading(
        true
      );

      try {
        const { data } =
          await api.get(
            `/bills/${bill._id}/payments`
          );

        setPaymentHistory(
          data.payments ||
            []
        );
      } catch (err) {
        setHistoryError(
          getError(err)
        );
      } finally {
        setHistoryLoading(
          false
        );
      }
    };

  // ========================================
  // RECORD PAYMENT
  // ========================================

  const handlePayment =
    async (e) => {
      e.preventDefault();

      if (
        saving ||
        !paymentBill
      ) {
        return;
      }

      const amount =
        Number(
          paymentAmount
        );

      if (
        !amount ||
        amount <= 0
      ) {
        setError(
          "Enter a valid payment amount."
        );

        return;
      }

      if (
        amount >
        Number(
          paymentBill
            .balanceAmount ||
            0
        )
      ) {
        setError(
          "Payment amount cannot be greater than the balance."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        await api.post(
          `/bills/${paymentBill._id}/payments`,
          {
            amount,
            paymentMethod,
          }
        );

        setPaymentBill(
          null
        );

        setPaymentAmount(
          ""
        );

        await fetchBills();
      } catch (err) {
        setError(
          getError(err)
        );
      } finally {
        setSaving(false);
      }
    };

  // ========================================
  // FILTER
  // ========================================

  const filteredBills =
    bills.filter(
      (bill) =>
        [
          bill.billId,
          bill.patient
            ?.patientId,
          bill.patient
            ?.user?.name,
          bill.appointment
            ?.appointmentId,
          bill.paymentStatus,
        ].some((value) =>
          String(
            value || ""
          )
            .toLowerCase()
            .includes(
              search
                .trim()
                .toLowerCase()
            )
        )
    );

  // ========================================
  // BILL TAX HELPERS
  // ========================================

  const getBillTaxableAmount =
    (bill) => {
      if (
        bill?.taxableAmount !==
          undefined &&
        bill?.taxableAmount !==
          null
      ) {
        return Number(
          bill.taxableAmount
        );
      }

      return Math.max(
        0,
        Number(
          bill?.subtotal ||
            0
        ) -
          Number(
            bill?.discount ||
              0
          )
      );
    };

  const getBillTaxAmount = (
    bill
  ) => {
    return Number(
      bill?.taxAmount ||
        0
    );
  };

  const getBillTaxPercentage =
    (bill) => {
      return Number(
        bill?.taxPercentage ||
          0
      );
    };

  // ========================================
  // PRINT RECEIPT
  // ========================================

  const printReceipt = (
    payment,
    bill
  ) => {
    const receiptWindow =
      window.open(
        "",
        "_blank",
        "width=800,height=700"
      );

    if (!receiptWindow) {
      setError(
        "Popup blocked. Please allow popups to print the receipt."
      );

      return;
    }

    const patientName =
      bill.patient?.user
        ?.name || "-";

    const patientId =
      bill.patient
        ?.patientId ||
      "-";

    const appointmentId =
      bill.appointment
        ?.appointmentId ||
      "-";

    const sortedPayments =
      [
        ...paymentHistory,
      ].sort(
        (a, b) =>
          new Date(
            a.paidAt
          ) -
          new Date(
            b.paidAt
          )
      );

    const selectedPaymentIndex =
      sortedPayments.findIndex(
        (item) =>
          item._id ===
          payment._id
      );

    const paidUntilThisPayment =
      sortedPayments
        .slice(
          0,
          selectedPaymentIndex +
            1
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount ||
                0
            ),
          0
        );

    const balanceAfterThisPayment =
      Math.max(
        0,
        Number(
          bill.totalAmount ||
            0
        ) -
          paidUntilThisPayment
      );

    const paymentDate =
      formatDateTime(
        payment.paidAt
      );

    const method =
      payment.paymentMethod
        ? payment.paymentMethod
            .replaceAll(
              "_",
              " "
            )
            .toUpperCase()
        : "-";

    const safeHospitalName =
      escapeHtml(
        hospitalName
      );

    const safePaymentId =
      escapeHtml(
        payment.paymentId ||
          "-"
      );

    const safeBillId =
      escapeHtml(
        bill.billId || "-"
      );

    const safePatientName =
      escapeHtml(
        patientName
      );

    const safePatientId =
      escapeHtml(
        patientId
      );

    const safeAppointmentId =
      escapeHtml(
        appointmentId
      );

    const safePaymentDate =
      escapeHtml(
        paymentDate
      );

    const safeMethod =
      escapeHtml(method);

    const safeReference =
      escapeHtml(
        payment.referenceNumber ||
          ""
      );

    const amountPaid =
      escapeHtml(
        money(
          payment.amount
        )
      );

    const billTotal =
      escapeHtml(
        money(
          bill.totalAmount
        )
      );

    const totalPaid =
      escapeHtml(
        money(
          paidUntilThisPayment
        )
      );

    const balance =
      escapeHtml(
        money(
          balanceAfterThisPayment
        )
      );

    receiptWindow.document.write(`
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />

  <title>
    Receipt - ${safePaymentId}
  </title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 30px;
      color: #222;
      background: #fff;
    }

    .receipt {
      max-width: 700px;
      margin: auto;
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 30px;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
    }

    .header p {
      margin-top: 6px;
      color: #666;
    }

    .title {
      text-align: center;
      margin-bottom: 25px;
      font-size: 20px;
      font-weight: bold;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 1px solid #eee;
      padding: 10px 0;
    }

    .label {
      font-weight: bold;
    }

    .amount {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      margin: 30px 0;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 13px;
      color: #666;
    }

    @media print {
      body {
        padding: 0;
      }

      .receipt {
        border: none;
      }
    }
  </style>
</head>

<body>
  <div class="receipt">

    <div class="header">
      <h1>
        ${safeHospitalName}
      </h1>

      <p>
        Payment Receipt
      </p>
    </div>

    <div class="title">
      RECEIPT
    </div>

    <div class="row">
      <span class="label">
        Receipt No
      </span>

      <span>
        ${safePaymentId}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Bill ID
      </span>

      <span>
        ${safeBillId}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Patient
      </span>

      <span>
        ${safePatientName}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Patient ID
      </span>

      <span>
        ${safePatientId}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Appointment
      </span>

      <span>
        ${safeAppointmentId}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Payment Date
      </span>

      <span>
        ${safePaymentDate}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Payment Method
      </span>

      <span>
        ${safeMethod}
      </span>
    </div>

    ${
      payment.referenceNumber
        ? `
    <div class="row">
      <span class="label">
        Reference No
      </span>

      <span>
        ${safeReference}
      </span>
    </div>
    `
        : ""
    }

    <div class="amount">
      Amount Paid:
      ${amountPaid}
    </div>

    <div class="row">
      <span class="label">
        Bill Total
      </span>

      <span>
        ${billTotal}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Total Paid
      </span>

      <span>
        ${totalPaid}
      </span>
    </div>

    <div class="row">
      <span class="label">
        Balance
      </span>

      <span>
        ${balance}
      </span>
    </div>

    <div class="footer">
      Thank you.
    </div>

  </div>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>
    `);

    receiptWindow.document.close();
  };

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Billing & Payments
          </h1>

          <p className="mt-1 text-gray-500">
            Manage patient
            invoices and payments
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            + Create Invoice
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SEARCH */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search invoice, patient or appointment..."
          className={
            inputClass
          }
        />
      </div>

      {/* BILL TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading invoices...
          </div>
        ) : filteredBills
            .length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {[
                    "Invoice ID",
                    "Patient",
                    "Appointment",
                    "Date",
                    "Total",
                    "Paid",
                    "Balance",
                    "Status",
                    "Action",
                  ].map(
                    (heading) => (
                      <th
                        key={
                          heading
                        }
                        className="whitespace-nowrap px-5 py-4"
                      >
                        {
                          heading
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredBills.map(
                  (bill) => (
                    <tr
                      key={
                        bill._id
                      }
                      className="border-b transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {
                          bill.billId
                        }
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {bill.patient
                            ?.user
                            ?.name ||
                            "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {bill.patient
                            ?.patientId ||
                            ""}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {bill.appointment
                          ?.appointmentId ||
                          "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(
                          bill.createdAt
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {money(
                          bill.totalAmount
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {money(
                          bill.paidAmount
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {money(
                          bill.balanceAmount
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <PaymentStatus
                          status={
                            bill.paymentStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openBillDetails(
                                bill
                              )
                            }
                            className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700 transition hover:bg-blue-200"
                          >
                            View
                          </button>

                          {canManage &&
                            Number(
                              bill.balanceAmount ||
                                0
                            ) >
                              0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  openPayment(
                                    bill
                                  )
                                }
                                className="rounded-lg bg-green-100 px-3 py-2 text-green-700 transition hover:bg-green-200"
                              >
                                Payment
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

      {/* =====================================
          CREATE INVOICE MODAL
      ===================================== */}

      {showForm &&
        canManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Create Invoice
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Tax / GST:
                    {" "}
                    {
                      taxPercentage
                    }
                    %
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-gray-500 hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleCreate
                }
                className="space-y-6 p-6"
              >
                {/* APPOINTMENT */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Completed
                    Appointment *
                  </label>

                  <select
                    required
                    value={
                      formData.appointment
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData(
                        (
                          prev
                        ) => ({
                          ...prev,

                          appointment:
                            e
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Select
                      Appointment
                    </option>

                    {appointments.map(
                      (
                        appointment
                      ) => (
                        <option
                          key={
                            appointment._id
                          }
                          value={
                            appointment._id
                          }
                        >
                          {
                            appointment.appointmentId
                          }
                          {" - "}

                          {appointment
                            .patient
                            ?.user
                            ?.name ||
                            "Patient"}

                          {" - "}

                          {appointment
                            .doctor
                            ?.user
                            ?.name ||
                            "Doctor"}

                          {appointment.appointmentDate
                            ? ` - ${formatDate(
                                appointment.appointmentDate
                              )}`
                            : ""}

                          {appointment.appointmentTime
                            ? ` ${formatTime(
                                appointment.appointmentTime
                              )}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  {appointments.length ===
                    0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      No completed
                      unbilled
                      appointments are
                      available.
                    </p>
                  )}
                </div>

                {/* ITEMS */}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-800">
                      Invoice Items
                    </h3>

                    <button
                      type="button"
                      onClick={
                        addItem
                      }
                      className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                    >
                      + Add Item
                    </button>
                  </div>

                  {formData.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-12">
                          <div className="md:col-span-5">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Description
                            </label>

                            <input
                              placeholder="Consultation / Treatment"
                              required
                              value={
                                item.description
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  index,
                                  "description",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Qty
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={
                                item.quantity
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Unit Price
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={
                                item.unitPrice
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  index,
                                  "unitPrice",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>

                          <div className="flex items-end md:col-span-2">
                            <button
                              type="button"
                              disabled={
                                formData
                                  .items
                                  .length ===
                                1
                              }
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              className="w-full rounded-lg bg-red-100 px-3 py-3 text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-right text-sm text-gray-500">
                          Amount:
                          {" "}
                          <strong className="text-gray-800">
                            {money(
                              Number(
                                item.quantity ||
                                  0
                              ) *
                                Number(
                                  item.unitPrice ||
                                    0
                                )
                            )}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* DISCOUNT */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={
                      subtotal
                    }
                    step="0.01"
                    value={
                      formData.discount
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData(
                        (
                          prev
                        ) => ({
                          ...prev,

                          discount:
                            e
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* SUMMARY */}

                <div className="rounded-xl bg-gray-50 p-5">
                  <h3 className="mb-4 font-semibold text-gray-800">
                    Invoice Summary
                  </h3>

                  <div className="space-y-3">
                    <SummaryRow
                      label="Subtotal"
                      value={money(
                        subtotal
                      )}
                    />

                    <SummaryRow
                      label="Discount"
                      value={money(
                        discount
                      )}
                    />

                    <SummaryRow
                      label="Taxable Amount"
                      value={money(
                        taxableAmount
                      )}
                    />

                    <SummaryRow
                      label={`Tax / GST (${taxPercentage}%)`}
                      value={money(
                        taxAmount
                      )}
                    />

                    <div className="border-t pt-3">
                      <SummaryRow
                        label="Grand Total"
                        value={money(
                          total
                        )}
                        strong
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    Final tax and
                    invoice total are
                    calculated by the
                    server when the
                    invoice is created.
                  </p>
                </div>

                {/* NOTES */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Notes
                  </label>

                  <textarea
                    placeholder="Invoice notes"
                    value={
                      formData.notes
                    }
                    onChange={(
                      e
                    ) =>
                      setFormData(
                        (
                          prev
                        ) => ({
                          ...prev,

                          notes:
                            e
                              .target
                              .value,
                        })
                      )
                    }
                    rows="3"
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 border-t pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setShowForm(
                        false
                      )
                    }
                    className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      appointments.length ===
                        0
                    }
                    className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Creating..."
                      : "Create Invoice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =====================================
          INVOICE DETAILS
      ===================================== */}

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {
                    selectedBill.billId
                  }
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Created:
                  {" "}
                  {formatDateTime(
                    selectedBill.createdAt
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBill(
                    null
                  )
                }
                className="text-2xl text-gray-500"
              >
                ×
              </button>
            </div>

            {/* PATIENT */}

            <div className="mb-5 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">
                  Patient
                </p>

                <p className="font-medium">
                  {selectedBill
                    .patient
                    ?.user
                    ?.name ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Patient ID
                </p>

                <p className="font-medium">
                  {selectedBill
                    .patient
                    ?.patientId ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Appointment
                </p>

                <p className="font-medium">
                  {selectedBill
                    .appointment
                    ?.appointmentId ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Payment Status
                </p>

                <div className="mt-1">
                  <PaymentStatus
                    status={
                      selectedBill.paymentStatus
                    }
                  />
                </div>
              </div>

              {selectedBill
                .appointment
                ?.appointmentDate && (
                <div>
                  <p className="text-xs text-gray-500">
                    Appointment
                    Date
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      selectedBill
                        .appointment
                        .appointmentDate
                    )}
                  </p>
                </div>
              )}

              {selectedBill
                .appointment
                ?.appointmentTime && (
                <div>
                  <p className="text-xs text-gray-500">
                    Appointment
                    Time
                  </p>

                  <p className="font-medium">
                    {formatTime(
                      selectedBill
                        .appointment
                        .appointmentTime
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* ITEMS */}

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">
                      Description
                    </th>

                    <th className="px-4 py-3 text-right">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right">
                      Unit Price
                    </th>

                    <th className="px-4 py-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedBill
                    .items
                    ?.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                          className="border-t"
                        >
                          <td className="px-4 py-3">
                            {
                              item.description
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {money(
                              item.unitPrice
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {money(
                              item.amount
                            )}
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}

            <div className="ml-auto mt-5 max-w-md space-y-2 rounded-xl bg-gray-50 p-4">
              <SummaryRow
                label="Subtotal"
                value={money(
                  selectedBill.subtotal
                )}
              />

              <SummaryRow
                label="Discount"
                value={money(
                  selectedBill.discount
                )}
              />

              <SummaryRow
                label="Taxable Amount"
                value={money(
                  getBillTaxableAmount(
                    selectedBill
                  )
                )}
              />

              <SummaryRow
                label={`Tax / GST (${getBillTaxPercentage(
                  selectedBill
                )}%)`}
                value={money(
                  getBillTaxAmount(
                    selectedBill
                  )
                )}
              />

              <div className="border-t pt-2">
                <SummaryRow
                  label="Total"
                  value={money(
                    selectedBill.totalAmount
                  )}
                  strong
                />
              </div>

              <SummaryRow
                label="Paid"
                value={money(
                  selectedBill.paidAmount
                )}
              />

              <SummaryRow
                label="Balance"
                value={money(
                  selectedBill.balanceAmount
                )}
                strong
              />
            </div>

            {/* NOTES */}

            {selectedBill.notes && (
              <div className="mt-5 rounded-xl border p-4">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Notes
                </p>

                <p className="text-sm text-gray-700">
                  {
                    selectedBill.notes
                  }
                </p>
              </div>
            )}

            {/* PAYMENT HISTORY */}

            <div className="mt-6 border-t pt-5">
              <h3 className="mb-4 text-lg font-semibold">
                Payment History
              </h3>

              {historyLoading ? (
                <p className="text-gray-500">
                  Loading
                  payments...
                </p>
              ) : historyError ? (
                <p className="text-red-600">
                  {
                    historyError
                  }
                </p>
              ) : paymentHistory
                  .length ===
                0 ? (
                <p className="text-gray-500">
                  No payment
                  transactions
                  recorded.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3">
                          Payment ID
                        </th>

                        <th className="px-3 py-3">
                          Date & Time
                        </th>

                        <th className="px-3 py-3">
                          Method
                        </th>

                        <th className="px-3 py-3">
                          Amount
                        </th>

                        <th className="px-3 py-3">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paymentHistory.map(
                        (
                          payment
                        ) => (
                          <tr
                            key={
                              payment._id
                            }
                            className="border-t"
                          >
                            <td className="whitespace-nowrap px-3 py-3 font-medium">
                              {
                                payment.paymentId
                              }
                            </td>

                            <td className="whitespace-nowrap px-3 py-3">
                              {formatDateTime(
                                payment.paidAt
                              )}
                            </td>

                            <td className="px-3 py-3 capitalize">
                              {payment
                                .paymentMethod
                                ?.replaceAll(
                                  "_",
                                  " "
                                ) ||
                                "-"}
                            </td>

                            <td className="whitespace-nowrap px-3 py-3">
                              {money(
                                payment.amount
                              )}
                            </td>

                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  printReceipt(
                                    payment,
                                    selectedBill
                                  )
                                }
                                className="whitespace-nowrap rounded-lg bg-purple-100 px-3 py-2 text-purple-700 transition hover:bg-purple-200"
                              >
                                Print
                                Receipt
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          PAYMENT MODAL
      ===================================== */}

      {paymentBill &&
        canManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-gray-800">
                Record Payment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Invoice:
                {" "}
                {
                  paymentBill.billId
                }
              </p>

              <div className="my-5 rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Current Balance
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-800">
                  {money(
                    paymentBill.balanceAmount
                  )}
                </p>
              </div>

              <form
                onSubmit={
                  handlePayment
                }
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Amount *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      paymentBill.balanceAmount
                    }
                    required
                    value={
                      paymentAmount
                    }
                    onChange={(
                      e
                    ) =>
                      setPaymentAmount(
                        e
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Payment Method
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(
                      e
                    ) =>
                      setPaymentMethod(
                        e
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="cash">
                      Cash
                    </option>

                    <option value="upi">
                      UPI
                    </option>

                    <option value="card">
                      Card
                    </option>

                    <option value="bank_transfer">
                      Bank Transfer
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentBill(
                        null
                      )
                    }
                    className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

// ==========================================
// PAYMENT STATUS
// ==========================================

function PaymentStatus({
  status,
}) {
  const styles = {
    paid:
      "bg-green-100 text-green-700",

    partial:
      "bg-yellow-100 text-yellow-700",

    unpaid:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-gray-100 text-gray-700"
      }`}
    >
      {status ||
        "unpaid"}
    </span>
  );
}

// ==========================================
// SUMMARY ROW
// ==========================================

function SummaryRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong
          ? "text-base font-bold text-gray-900"
          : "text-sm text-gray-700"
      }`}
    >
      <span>
        {label}
      </span>

      <span>
        {value}
      </span>
    </div>
  );
}

export default Billing;