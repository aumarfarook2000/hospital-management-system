
import { useEffect, useState } from "react";
import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20";

const getError = (err) =>
  err.response?.data?.message ||
  err.message ||
  "Something went wrong.";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const emptyPayment = () => ({
  amount: "",
  paymentMethod: "cash",
  referenceNumber: "",
  notes: "",
});

function PharmacySalesHistory() {
  const {
    settings,
    formatCurrency,
    formatDate,
    formatDateTime,
  } = useSettings();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentSale, setPaymentSale] = useState(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState(
    emptyPayment
  );

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [historyError, setHistoryError] = useState("");

  const money = (value) =>
    formatCurrency(Number(value || 0));

  const date = (value) =>
    value ? formatDate(value) : "-";

  const dateTime = (value) =>
    value ? formatDateTime(value) : "-";

  // =====================================
  // FETCH SALES
  // =====================================

  const fetchSales = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/pharmacy/sales");

      setSales(data.sales || []);

      return data.sales || [];
    } catch (err) {
      setError(getError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // =====================================
  // FILTER SALES
  // =====================================

  const filteredSales = sales.filter((sale) => {
    const query = search.trim().toLowerCase();

    return [
      sale.saleId,
      sale.patient?.user?.name,
      sale.patient?.patientId,
      sale.paymentStatus,
      sale.paymentMethod,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );

  const totalReceived = sales.reduce(
    (sum, sale) => sum + Number(sale.paidAmount || 0),
    0
  );

  const totalOutstanding = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.balanceAmount || 0),
    0
  );

  // =====================================
  // SALE DETAILS AND PAYMENT HISTORY
  // =====================================

  const loadPaymentHistory = async (saleId) => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const { data } = await api.get(
        `/pharmacy/sales/${saleId}/payments`
      );

      setPaymentHistory(data.payments || []);
    } catch (err) {
      setHistoryError(getError(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  const openSaleDetails = async (sale) => {
    setSelectedSale(sale);
    setPaymentHistory([]);
    await loadPaymentHistory(sale._id);
  };

  const openPayment = (sale) => {
    setPaymentSale(sale);
    setPaymentForm(emptyPayment());
    setError("");
    setSuccess("");
  };

  // =====================================
  // RECORD PAYMENT
  // =====================================

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentSale || paymentSaving) return;

    const amount = Number(paymentForm.amount);
    const balance = Number(
      paymentSale.balanceAmount || 0
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Payment amount must be greater than zero."
      );
      return;
    }

    if (amount > balance) {
      setError(
        `Payment cannot exceed balance ${money(balance)}.`
      );
      return;
    }

    const saleId = paymentSale._id;

    try {
      setPaymentSaving(true);
      setError("");
      setSuccess("");

      const { data } = await api.post(
        `/pharmacy/sales/${saleId}/payments`,
        {
          amount,
          paymentMethod: paymentForm.paymentMethod,
          referenceNumber:
            paymentForm.referenceNumber.trim(),
          notes: paymentForm.notes.trim(),
        }
      );

      setPaymentSale(null);

      setSuccess(
        `Payment ${
          data.payment?.paymentId || ""
        } recorded successfully.`
      );

      // Update local data immediately.
      if (data.sale) {
        setSales((prev) =>
          prev.map((sale) =>
            sale._id === saleId ? data.sale : sale
          )
        );

        setSelectedSale((prev) =>
          prev?._id === saleId ? data.sale : prev
        );
      }

      // Refresh server data.
      const refreshedSales = await fetchSales();

      if (refreshedSales) {
        const latestSale = refreshedSales.find(
          (sale) => sale._id === saleId
        );

        if (latestSale) {
          setSelectedSale((prev) =>
            prev?._id === saleId ? latestSale : prev
          );
        }
      }

      if (selectedSale?._id === saleId) {
        await loadPaymentHistory(saleId);
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setPaymentSaving(false);
    }
  };

  // =====================================
  // PRINT HELPERS
  // =====================================

  const hospitalName =
    settings?.hospitalName || "Hospital Pharmacy";

  const hospitalAddress =
    settings?.hospitalAddress || "";

  const hospitalPhone =
    settings?.hospitalPhone || "";

  const hospitalEmail =
    settings?.hospitalEmail || "";

  const receiptHeader = (subtitle) => `
    <div class="header">
      <h1>${escapeHtml(hospitalName)}</h1>
      ${
        hospitalAddress
          ? `<p>${escapeHtml(hospitalAddress)}</p>`
          : ""
      }
      ${
        hospitalPhone
          ? `<p>Phone: ${escapeHtml(hospitalPhone)}</p>`
          : ""
      }
      ${
        hospitalEmail
          ? `<p>Email: ${escapeHtml(hospitalEmail)}</p>`
          : ""
      }
      <h2>${escapeHtml(subtitle)}</h2>
    </div>
  `;

  const receiptStyles = `
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #111827;
      padding: 28px;
      margin: 0;
      font-size: 13px;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0 0 8px;
      font-size: 23px;
    }

    .header h2 {
      margin: 15px 0 0;
      font-size: 16px;
    }

    .header p {
      margin: 4px 0;
      color: #4b5563;
    }

    .info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 22px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    th, td {
      padding: 10px;
      border: 1px solid #d1d5db;
      text-align: left;
    }

    th {
      background: #f3f4f6;
    }

    .right {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .totals {
      max-width: 340px;
      margin: 22px 0 0 auto;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .row strong {
      text-align: right;
    }

    .grand-total {
      font-size: 17px;
      font-weight: bold;
      border-top: 2px solid #111827;
    }

    .amount {
      margin-top: 25px;
      text-align: center;
      font-size: 23px;
      font-weight: bold;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 0;
      }

      @page {
        margin: 12mm;
      }
    }
  `;

  const openPrintWindow = (title, body) => {
    const receiptWindow = window.open(
      "",
      "_blank",
      "width=850,height=900"
    );

    if (!receiptWindow) {
      setError(
        "Popup blocked. Please allow popups to print the receipt."
      );
      return;
    }

    receiptWindow.document.open();
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(title)}</title>
          <style>${receiptStyles}</style>
        </head>
        <body>
          ${body}
          <div class="footer">
            Thank you.
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();

    receiptWindow.onload = () => {
      receiptWindow.focus();
      receiptWindow.print();
    };
  };

  // =====================================
  // SALE RECEIPT
  // =====================================

  const printSaleReceipt = (sale) => {
    const itemsHtml = (sale.items || [])
      .map(
        (item) => `
          <tr>
            <td>
              ${escapeHtml(
                item.medicine?.name || "-"
              )}
            </td>
            <td>
              ${escapeHtml(
                item.batch?.batchNumber || "-"
              )}
            </td>
            <td class="center">
              ${escapeHtml(item.quantity)}
            </td>
            <td class="right">
              ${escapeHtml(money(item.unitPrice))}
            </td>
            <td class="right">
              ${escapeHtml(money(item.amount))}
            </td>
          </tr>
        `
      )
      .join("");

    const body = `
      ${receiptHeader("Medicine Sale Receipt")}

      <div class="info">
        <div>
          <strong>Sale ID:</strong>
          ${escapeHtml(sale.saleId)}
        </div>

        <div>
          <strong>Date:</strong>
          ${escapeHtml(dateTime(sale.createdAt))}
        </div>

        <div>
          <strong>Patient:</strong>
          ${escapeHtml(
            sale.patient?.user?.name || "-"
          )}
        </div>

        <div>
          <strong>Patient ID:</strong>
          ${escapeHtml(
            sale.patient?.patientId || "-"
          )}
        </div>

        <div>
          <strong>Payment Status:</strong>
          ${escapeHtml(sale.paymentStatus)}
        </div>

        <div>
          <strong>Last Payment Method:</strong>
          ${escapeHtml(
            sale.paymentMethod || "-"
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Batch</th>
            <th>Qty</th>
            <th class="right">Price</th>
            <th class="right">Amount</th>
          </tr>
        </thead>

        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="row">
          <span>Subtotal</span>
          <strong>
            ${escapeHtml(money(sale.subtotal))}
          </strong>
        </div>

        <div class="row">
          <span>Discount</span>
          <strong>
            ${escapeHtml(money(sale.discount))}
          </strong>
        </div>

        <div class="row grand-total">
          <span>Total</span>
          <strong>
            ${escapeHtml(money(sale.totalAmount))}
          </strong>
        </div>

        <div class="row">
          <span>Paid</span>
          <strong>
            ${escapeHtml(money(sale.paidAmount))}
          </strong>
        </div>

        <div class="row">
          <span>Balance</span>
          <strong>
            ${escapeHtml(money(sale.balanceAmount))}
          </strong>
        </div>
      </div>
    `;

    openPrintWindow(
      `Pharmacy Receipt - ${sale.saleId}`,
      body
    );
  };

  // =====================================
  // INDIVIDUAL PAYMENT RECEIPT
  // =====================================

  const printPaymentReceipt = (payment, sale) => {
    const sortedPayments = [...paymentHistory].sort(
      (a, b) =>
        new Date(a.paidAt) - new Date(b.paidAt)
    );

    const selectedIndex = sortedPayments.findIndex(
      (item) => item._id === payment._id
    );

    if (selectedIndex < 0) {
      setError(
        "Payment history is incomplete. Please reopen the sale and try again."
      );
      return;
    }

    const paidUntilPayment = sortedPayments
      .slice(0, selectedIndex + 1)
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const balanceAfterPayment = Math.max(
      0,
      Number(sale.totalAmount || 0) -
        paidUntilPayment
    );

    const body = `
      ${receiptHeader("Payment Receipt")}

      <div class="info">
        <div>
          <strong>Payment ID:</strong>
          ${escapeHtml(payment.paymentId)}
        </div>

        <div>
          <strong>Sale ID:</strong>
          ${escapeHtml(sale.saleId)}
        </div>

        <div>
          <strong>Patient:</strong>
          ${escapeHtml(
            sale.patient?.user?.name || "-"
          )}
        </div>

        <div>
          <strong>Patient ID:</strong>
          ${escapeHtml(
            sale.patient?.patientId || "-"
          )}
        </div>

        <div>
          <strong>Date:</strong>
          ${escapeHtml(dateTime(payment.paidAt))}
        </div>

        <div>
          <strong>Payment Method:</strong>
          ${escapeHtml(payment.paymentMethod)}
        </div>

        ${
          payment.referenceNumber
            ? `
              <div>
                <strong>Reference:</strong>
                ${escapeHtml(
                  payment.referenceNumber
                )}
              </div>
            `
            : ""
        }

        <div>
          <strong>Received By:</strong>
          ${escapeHtml(
            payment.receivedBy?.name || "-"
          )}
        </div>
      </div>

      <div class="totals">
        <div class="row">
          <span>Sale Total</span>
          <strong>
            ${escapeHtml(money(sale.totalAmount))}
          </strong>
        </div>

        <div class="row">
          <span>Total Paid After Payment</span>
          <strong>
            ${escapeHtml(money(paidUntilPayment))}
          </strong>
        </div>

        <div class="row">
          <span>Balance After Payment</span>
          <strong>
            ${escapeHtml(money(balanceAfterPayment))}
          </strong>
        </div>
      </div>

      <div class="amount">
        Amount Paid:
        ${escapeHtml(money(payment.amount))}
      </div>
    `;

    openPrintWindow(
      `Payment Receipt - ${payment.paymentId}`,
      body
    );
  };

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Pharmacy Sales
        </h1>
        <p className="mt-1 text-gray-500">
          Medicine sales, payments and receipts
        </p>
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

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Sales",
            value: sales.length,
          },
          {
            label: "Sales Value",
            value: money(totalSales),
          },
          {
            label: "Amount Received",
            value: money(totalReceived),
          },
          {
            label: "Outstanding Balance",
            value: money(totalOutstanding),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-bold text-gray-800">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* SEARCH */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sale ID, patient or payment..."
          className={inputClass}
        />
      </div>

      {/* SALES TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading pharmacy sales...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No pharmacy sales found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {[
                    "Sale ID",
                    "Date",
                    "Patient",
                    "Total",
                    "Paid",
                    "Balance",
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
                {filteredSales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium">
                      {sale.saleId}
                    </td>

                    <td className="px-5 py-4">
                      {date(sale.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium">
                        {sale.patient?.user?.name ||
                          "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.patient?.patientId ||
                          ""}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {money(sale.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      {money(sale.paidAmount)}
                    </td>

                    <td className="px-5 py-4">
                      {money(sale.balanceAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          sale.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : sale.paymentStatus ===
                                "partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openSaleDetails(sale)
                          }
                          className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                        >
                          View
                        </button>

                        {Number(
                          sale.balanceAmount || 0
                        ) > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              openPayment(sale)
                            }
                            className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                          >
                            Payment
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            printSaleReceipt(sale)
                          }
                          className="rounded-lg bg-purple-100 px-3 py-2 text-purple-700"
                        >
                          Receipt
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

      {/* PAYMENT MODAL */}

      {paymentSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">
                  Record Payment
                </h2>
                <p className="text-sm text-gray-500">
                  {paymentSale.saleId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPaymentSale(null)}
                disabled={paymentSaving}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handlePayment}
              className="space-y-4 p-6"
            >
              {error && (
                <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between">
                  <span>Total</span>
                  <strong>
                    {money(paymentSale.totalAmount)}
                  </strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>Paid</span>
                  <strong>
                    {money(paymentSale.paidAmount)}
                  </strong>
                </div>

                <div className="mt-2 flex justify-between text-lg">
                  <span>Balance</span>
                  <strong className="text-red-600">
                    {money(
                      paymentSale.balanceAmount
                    )}
                  </strong>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Amount *
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={paymentSale.balanceAmount}
                  required
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Method *
                </label>

                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentMethod:
                        e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {paymentMethods.map((method) => (
                    <option
                      key={method.value}
                      value={method.value}
                    >
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reference Number
                </label>

                <input
                  value={
                    paymentForm.referenceNumber
                  }
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      referenceNumber:
                        e.target.value,
                    }))
                  }
                  placeholder="UPI / Card / Bank reference"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentSale(null)
                  }
                  disabled={paymentSaving}
                  className="rounded-lg border px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="rounded-lg bg-green-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  {paymentSaving
                    ? "Processing..."
                    : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALE DETAILS MODAL */}

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedSale.saleId}
                </h2>
                <p className="text-sm text-gray-500">
                  Pharmacy Sale Details
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSale(null)
                }
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* PATIENT */}

              <div className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Patient
                  </p>
                  <p className="font-medium">
                    {selectedSale.patient?.user
                      ?.name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Patient ID
                  </p>
                  <p className="font-medium">
                    {selectedSale.patient
                      ?.patientId || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Date
                  </p>
                  <p className="font-medium">
                    {dateTime(
                      selectedSale.createdAt
                    )}
                  </p>
                </div>
              </div>

              {/* MEDICINES */}

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Medicine",
                        "Batch",
                        "Qty",
                        "Price",
                        "Amount",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {selectedSale.items?.map(
                      (item, index) => (
                        <tr
                          key={index}
                          className="border-t"
                        >
                          <td className="px-4 py-3">
                            {item.medicine?.name ||
                              "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.batch
                              ?.batchNumber || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-3">
                            {money(item.unitPrice)}
                          </td>

                          <td className="px-4 py-3">
                            {money(item.amount)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}

              <div className="ml-auto max-w-sm space-y-2 rounded-xl bg-gray-50 p-5">
                {[
                  [
                    "Subtotal",
                    selectedSale.subtotal,
                  ],
                  [
                    "Discount",
                    selectedSale.discount,
                  ],
                  [
                    "Total",
                    selectedSale.totalAmount,
                  ],
                  [
                    "Paid",
                    selectedSale.paidAmount,
                  ],
                  [
                    "Balance",
                    selectedSale.balanceAmount,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-3"
                  >
                    <span>{label}</span>
                    <strong>{money(value)}</strong>
                  </div>
                ))}
              </div>

              {/* PAYMENT HISTORY */}

              <div>
                <h3 className="mb-3 text-lg font-semibold">
                  Payment History
                </h3>

                {historyLoading ? (
                  <div className="rounded-lg bg-gray-50 p-5 text-center text-gray-500">
                    Loading payments...
                  </div>
                ) : historyError ? (
                  <div className="rounded-lg bg-red-100 p-4 text-red-700">
                    {historyError}
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-5 text-center text-gray-500">
                    No payments recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Payment ID",
                            "Date",
                            "Method",
                            "Amount",
                            "Received By",
                            "Action",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {paymentHistory.map(
                          (payment) => (
                            <tr
                              key={payment._id}
                              className="border-t"
                            >
                              <td className="px-4 py-3 font-medium">
                                {payment.paymentId}
                              </td>

                              <td className="px-4 py-3">
                                {dateTime(
                                  payment.paidAt
                                )}
                              </td>

                              <td className="px-4 py-3 capitalize">
                                {
                                  payment.paymentMethod
                                }
                              </td>

                              <td className="px-4 py-3">
                                {money(
                                  payment.amount
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {payment.receivedBy
                                  ?.name || "-"}
                              </td>

                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    printPaymentReceipt(
                                      payment,
                                      selectedSale
                                    )
                                  }
                                  className="rounded-lg bg-purple-100 px-3 py-2 text-purple-700"
                                >
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

              {/* ACTIONS */}

              <div className="flex flex-wrap justify-end gap-3">
                {Number(
                  selectedSale.balanceAmount || 0
                ) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const sale = selectedSale;
                      setSelectedSale(null);
                      openPayment(sale);
                    }}
                    className="rounded-lg bg-green-600 px-5 py-3 text-white"
                  >
                    Add Payment
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    printSaleReceipt(selectedSale)
                  }
                  className="rounded-lg bg-purple-600 px-5 py-3 text-white"
                >
                  Print Sale Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacySalesHistory;
