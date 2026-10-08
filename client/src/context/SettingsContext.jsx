import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api";

import {
  useAuth,
} from "./AuthContext";

const SettingsContext =
  createContext();

const defaultSettings = {
  hospitalName:
    "Hospital Management System",

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

  timezone:
    "Asia/Kolkata",

  dateFormat:
    "DD/MM/YYYY",
};

// ==========================================
// SAFE DATE
// ==========================================

const getValidDate = (
  value
) => {
  if (!value) {
    return null;
  }

  // Date-only value:
  // 2026-10-07
  //
  // Parse as a local calendar date instead
  // of UTC so it does not shift one day.

  if (
    typeof value ===
      "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value
      .split("-")
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

// ==========================================
// PROVIDER
// ==========================================

export const SettingsProvider = ({
  children,
}) => {
  const { user } =
    useAuth();

  const [
    settings,
    setSettings,
  ] = useState(
    defaultSettings
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ========================================
  // LOAD SETTINGS
  // ========================================

  const loadSettings =
    async () => {
      const token =
        localStorage.getItem(
          "hms_token"
        );

      if (!token) {
        setSettings(
          defaultSettings
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        const { data } =
          await api.get(
            "/settings"
          );

        setSettings({
          ...defaultSettings,
          ...(data.settings ||
            {}),
        });
      } catch (error) {
        console.error(
          "Load Settings Error:",
          error.response?.data ||
            error.message
        );

        setSettings(
          defaultSettings
        );
      } finally {
        setLoading(false);
      }
    };

  // ========================================
  // RELOAD AFTER LOGIN / LOGOUT
  // ========================================

  useEffect(() => {
    loadSettings();
  }, [user?._id]);

  // ========================================
  // UPDATE SETTINGS LOCALLY
  // ========================================

  const updateLocalSettings = (
    newSettings
  ) => {
    setSettings(
      (current) => ({
        ...current,
        ...newSettings,
      })
    );
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (
    value
  ) => {
    const date =
      getValidDate(value);

    if (!date) {
      return "-";
    }

    const format =
      settings.dateFormat ||
      "DD/MM/YYYY";

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const year =
      date.getFullYear();

    switch (format) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;

      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;

      case "DD/MM/YYYY":
      default:
        return `${day}/${month}/${year}`;
    }
  };

  // ========================================
  // FORMAT DATE + TIME
  // ========================================

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    const timezone =
      settings.timezone ||
      "Asia/Kolkata";

    try {
      const parts =
        new Intl.DateTimeFormat(
          "en-GB",
          {
            timeZone:
              timezone,

            year:
              "numeric",

            month:
              "2-digit",

            day:
              "2-digit",

            hour:
              "2-digit",

            minute:
              "2-digit",

            hour12: true,
          }
        ).formatToParts(
          date
        );

      const values = {};

      parts.forEach(
        (part) => {
          if (
            part.type !==
            "literal"
          ) {
            values[
              part.type
            ] = part.value;
          }
        }
      );

      let datePart;

      switch (
        settings.dateFormat
      ) {
        case "MM/DD/YYYY":
          datePart =
            `${values.month}/${values.day}/${values.year}`;
          break;

        case "YYYY-MM-DD":
          datePart =
            `${values.year}-${values.month}-${values.day}`;
          break;

        case "DD/MM/YYYY":
        default:
          datePart =
            `${values.day}/${values.month}/${values.year}`;
          break;
      }

      const timePart =
        `${values.hour}:${values.minute} ${values.dayPeriod || ""}`.trim();

      return `${datePart}, ${timePart}`;
    } catch {
      return date.toLocaleString(
        "en-IN"
      );
    }
  };

  // ========================================
  // FORMAT TIME
  // ========================================

  const formatTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    // Handles stored appointment
    // times such as "09:30".

    if (
      typeof value ===
        "string" &&
      /^\d{2}:\d{2}$/.test(
        value
      )
    ) {
      const [
        hourValue,
        minute,
      ] = value
        .split(":")
        .map(Number);

      const period =
        hourValue >= 12
          ? "PM"
          : "AM";

      const hour =
        hourValue % 12 ||
        12;

      return `${String(
        hour
      ).padStart(
        2,
        "0"
      )}:${String(
        minute
      ).padStart(
        2,
        "0"
      )} ${period}`;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    try {
      return new Intl.DateTimeFormat(
        "en-IN",
        {
          timeZone:
            settings.timezone ||
            "Asia/Kolkata",

          hour:
            "2-digit",

          minute:
            "2-digit",

          hour12: true,
        }
      ).format(date);
    } catch {
      return date.toLocaleTimeString(
        "en-IN",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      );
    }
  };

  // ========================================
  // CURRENCY FORMAT
  // ========================================

  const formatCurrency = (
    value
  ) => {
    const amount =
      Number(value || 0);

    const currency =
      settings.currency ||
      "INR";

    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style:
            "currency",

          currency,

          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      ).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      )}`;
    }
  };

  // ========================================
  // CONTEXT
  // ========================================

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,

        loadSettings,
        updateLocalSettings,

        formatDate,
        formatDateTime,
        formatTime,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// ==========================================
// HOOK
// ==========================================

export const useSettings =
  () => {
    return useContext(
      SettingsContext
    );
  };

export default SettingsContext;