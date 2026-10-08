
import { useEffect, useState } from "react";
import {
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiPackage,
  FiSettings,
  FiSave,
  FiMail,
} from "react-icons/fi";

import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const defaultSettings = {
  hospitalName: "",
  hospitalEmail: "",
  hospitalPhone: "",
  hospitalAddress: "",

  appointmentDuration: 30,
  workingFrom: "09:00",
  workingTo: "18:00",

  currency: "INR",
  taxPercentage: 0,
  invoicePrefix: "INV",

  lowStockLevel: 10,
  expiryWarningDays: 30,

  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",

  emailResetSubject:
    "Reset Your Password - Hospital Management System",
  emailResetHeading: "Reset Your Password",
  emailResetMessage:
    "We received a request to reset your account password. Click the button below to create a new password.",
  emailResetButtonText: "Reset Password",
  emailResetButtonColor: "#2563eb",
  emailResetFooter:
    "This is an automated security email. Please do not reply.",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-sm font-semibold text-slate-700";

const tabs = [
  { id: "hospital", label: "Hospital", icon: FiHome },
  {
    id: "appointment",
    label: "Appointments",
    icon: FiCalendar,
  },
  { id: "billing", label: "Billing", icon: FiCreditCard },
  { id: "pharmacy", label: "Pharmacy", icon: FiPackage },
  { id: "system", label: "System", icon: FiSettings },
  { id: "email", label: "Email Templates", icon: FiMail },
];

const Settings = () => {
  const { updateLocalSettings } = useSettings();

  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState("hospital");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LOAD SETTINGS
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/settings");

        if (data.settings) {
          const loadedSettings = {
            ...defaultSettings,
            ...data.settings,
          };

          setSettings(loadedSettings);
          updateLocalSettings(data.settings);
        }
      } catch (err) {
        console.error("Load Settings Error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setSettings((current) => ({
      ...current,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));

    setSuccess("");
    setError("");
  };

  // SAVE SETTINGS
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        hospitalName: settings.hospitalName,
        hospitalEmail: settings.hospitalEmail,
        hospitalPhone: settings.hospitalPhone,
        hospitalAddress: settings.hospitalAddress,

        appointmentDuration: settings.appointmentDuration,
        workingFrom: settings.workingFrom,
        workingTo: settings.workingTo,

        currency: settings.currency,
        taxPercentage: settings.taxPercentage,
        invoicePrefix: settings.invoicePrefix,

        lowStockLevel: settings.lowStockLevel,
        expiryWarningDays: settings.expiryWarningDays,

        timezone: settings.timezone,
        dateFormat: settings.dateFormat,

        emailResetSubject: settings.emailResetSubject,
        emailResetHeading: settings.emailResetHeading,
        emailResetMessage: settings.emailResetMessage,
        emailResetButtonText: settings.emailResetButtonText,
        emailResetButtonColor: settings.emailResetButtonColor,
        emailResetFooter: settings.emailResetFooter,
      };

      const { data } = await api.put("/settings", payload);

      if (data.settings) {
        setSettings({
          ...defaultSettings,
          ...data.settings,
        });

        updateLocalSettings(data.settings);
      }

      setSuccess(
        data.message || "Settings saved successfully."
      );
    } catch (err) {
      console.error("Save Settings Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-slate-500">
            Manage hospital-wide system settings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          <FiSave size={18} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
        >
          {success}
        </div>
      )}

      {/* SETTINGS CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABS */}
        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max gap-1 p-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setSuccess("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6">
          {/* HOSPITAL */}
          {activeTab === "hospital" && (
            <Section
              title="Hospital Information"
              description="Basic information about your hospital or clinic."
              icon={FiHome}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Hospital Name"
                  name="hospitalName"
                  value={settings.hospitalName}
                  onChange={handleChange}
                  placeholder="Enter hospital name"
                />

                <Field
                  label="Email Address"
                  name="hospitalEmail"
                  type="email"
                  value={settings.hospitalEmail}
                  onChange={handleChange}
                  placeholder="hospital@example.com"
                />

                <Field
                  label="Phone Number"
                  name="hospitalPhone"
                  value={settings.hospitalPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Hospital Address
                  </label>

                  <textarea
                    name="hospitalAddress"
                    value={settings.hospitalAddress}
                    onChange={handleChange}
                    rows={4}
                    className={inputClass}
                    placeholder="Enter complete hospital address"
                  />
                </div>
              </div>
            </Section>
          )}

          {/* APPOINTMENTS */}
          {activeTab === "appointment" && (
            <Section
              title="Appointment Settings"
              description="Configure general appointment timing."
              icon={FiCalendar}
            >
              <div className="grid gap-5 md:grid-cols-3">
                <Field
                  label="Appointment Duration"
                  name="appointmentDuration"
                  type="number"
                  min="5"
                  value={settings.appointmentDuration}
                  onChange={handleChange}
                  suffix="minutes"
                />

                <Field
                  label="Working From"
                  name="workingFrom"
                  type="time"
                  value={settings.workingFrom}
                  onChange={handleChange}
                />

                <Field
                  label="Working To"
                  name="workingTo"
                  type="time"
                  value={settings.workingTo}
                  onChange={handleChange}
                />
              </div>

              <InfoBox>
                These are the hospital's default appointment
                hours. Individual doctor availability can
                still be managed separately.
              </InfoBox>
            </Section>
          )}

          {/* BILLING */}
          {activeTab === "billing" && (
            <Section
              title="Billing Settings"
              description="Configure invoice and tax defaults."
              icon={FiCreditCard}
            >
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className={labelClass}>
                    Currency
                  </label>

                  <select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="INR">
                      INR — Indian Rupee (₹)
                    </option>
                  </select>
                </div>

                <Field
                  label="Tax / GST"
                  name="taxPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxPercentage}
                  onChange={handleChange}
                  suffix="%"
                />

                <Field
                  label="Invoice Prefix"
                  name="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={handleChange}
                  placeholder="INV"
                />
              </div>

              <InfoBox>
                These settings provide defaults for billing.
                Existing bills will not be recalculated when
                these values are changed.
              </InfoBox>
            </Section>
          )}

          {/* PHARMACY */}
          {activeTab === "pharmacy" && (
            <Section
              title="Pharmacy Settings"
              description="Configure stock and medicine expiry alerts."
              icon={FiPackage}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Low Stock Warning"
                  name="lowStockLevel"
                  type="number"
                  min="0"
                  value={settings.lowStockLevel}
                  onChange={handleChange}
                  suffix="units"
                />

                <Field
                  label="Expiry Warning"
                  name="expiryWarningDays"
                  type="number"
                  min="0"
                  value={settings.expiryWarningDays}
                  onChange={handleChange}
                  suffix="days"
                />
              </div>

              <InfoBox>
                An expiry warning of 30 days can be used
                to highlight medicine batches that expire
                within the next 30 days.
              </InfoBox>
            </Section>
          )}

          {/* SYSTEM */}
          {activeTab === "system" && (
            <Section
              title="System Settings"
              description="Configure regional display settings."
              icon={FiSettings}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Timezone
                  </label>

                  <select
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Asia/Kolkata">
                      Asia/Kolkata — India
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Date Format
                  </label>

                  <select
                    name="dateFormat"
                    value={settings.dateFormat}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="DD/MM/YYYY">
                      DD/MM/YYYY
                    </option>
                    <option value="MM/DD/YYYY">
                      MM/DD/YYYY
                    </option>
                    <option value="YYYY-MM-DD">
                      YYYY-MM-DD
                    </option>
                  </select>
                </div>
              </div>

              <InfoBox>
                Appearance settings such as Dark Mode,
                Font and Sidebar Style are managed
                separately from the Appearance page.
              </InfoBox>
            </Section>
          )}

          {/* EMAIL TEMPLATES */}
          {activeTab === "email" && (
            <Section
              title="Password Reset Email Template"
              description="Customize the password reset email sent to HMS users."
              icon={FiMail}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field
                    label="Email Subject"
                    name="emailResetSubject"
                    value={settings.emailResetSubject || ""}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Email Heading"
                    name="emailResetHeading"
                    value={settings.emailResetHeading || ""}
                    onChange={handleChange}
                    maxLength={150}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Email Message
                  </label>

                  <textarea
                    name="emailResetMessage"
                    value={settings.emailResetMessage || ""}
                    onChange={handleChange}
                    rows={4}
                    maxLength={2000}
                    className={inputClass}
                  />
                </div>

                <Field
                  label="Button Text"
                  name="emailResetButtonText"
                  value={settings.emailResetButtonText || ""}
                  onChange={handleChange}
                  maxLength={60}
                />

                <div>
                  <label className={labelClass}>
                    Button Color
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="emailResetButtonColor"
                      value={
                        settings.emailResetButtonColor ||
                        "#2563eb"
                      }
                      onChange={handleChange}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300"
                    />

                    <span className="text-sm text-slate-600">
                      {settings.emailResetButtonColor}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Email Footer
                  </label>

                  <textarea
                    name="emailResetFooter"
                    value={settings.emailResetFooter || ""}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* LIVE EMAIL PREVIEW */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-bold text-slate-800">
                  Live Email Preview
                </h3>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="bg-blue-800 p-6 text-center text-white">
                    <h3 className="text-xl font-bold">
                      {settings.hospitalName ||
                        "Hospital Management System"}
                    </h3>

                    <p className="mt-1 text-xs">
                      Account Security
                    </p>
                  </div>

                  <div className="space-y-4 bg-white p-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {settings.emailResetHeading}
                    </h2>

                    <p className="text-sm text-slate-700">
                      Hello Admin,
                    </p>

                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                      {settings.emailResetMessage}
                    </p>

                    <div className="py-4 text-center">
                      <span
                        className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
                        style={{
                          backgroundColor:
                            settings.emailResetButtonColor ||
                            "#2563eb",
                        }}
                      >
                        {settings.emailResetButtonText}
                      </span>
                    </div>

                    <p className="text-sm text-red-600">
                      This link expires in 15 minutes.
                    </p>

                    <p className="text-xs text-slate-500">
                      If you did not request this change,
                      ignore this email.
                    </p>

                    <p className="text-xs text-slate-500">
                      The actual email will include a
                      secure password reset link.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 text-center text-xs text-slate-500">
                    <p className="whitespace-pre-line">
                      {settings.emailResetFooter}
                    </p>

                    <p className="mt-2">
                      © {new Date().getFullYear()}{" "}
                      {settings.hospitalName ||
                        "Hospital Management System"}
                    </p>
                  </div>
                </div>
              </div>

              <InfoBox>
                The preview updates as you edit the fields.
                Click Save Settings to apply your changes
                to future password reset emails.
              </InfoBox>
            </Section>
          )}
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <FiSave size={17} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

// SECTION COMPONENT
const Section = ({
  title,
  description,
  icon: Icon,
  children,
}) => {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>

          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
};

// FIELD COMPONENT
const Field = ({
  label,
  suffix,
  inputClass: customInputClass,
  ...props
}) => {
  return (
    <div>
      <label className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          className={`${
            customInputClass || inputClass
          } ${suffix ? "pr-20" : ""}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

// INFO BOX COMPONENT
const InfoBox = ({ children }) => {
  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-600">
      {children}
    </div>
  );
};

export default Settings;
