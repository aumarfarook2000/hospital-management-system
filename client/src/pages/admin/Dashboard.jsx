
import { useEffect, useState } from "react";

import {
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiClock,
} from "react-icons/fi";

import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

// ==========================================
// DEFAULT DASHBOARD DATA
// ==========================================

const defaultDashboard = {
  stats: {
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    todayRevenue: 0,
  },

  appointmentOverview: {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  },

  recentActivity: [],
};

// ==========================================
// STATUS STYLES
// ==========================================

const getStatusStyle = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

// ==========================================
// DASHBOARD COMPONENT
// ==========================================

function Dashboard() {
  const {
    settings,
    formatCurrency,
    formatDate,
    formatTime,
  } = useSettings();

  const [dashboard, setDashboard] = useState(
    defaultDashboard
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data } = await api.get(
        "/dashboard/admin"
      );

      setDashboard({
        stats: {
          ...defaultDashboard.stats,
          ...(data.stats || {}),
        },

        appointmentOverview: {
          ...defaultDashboard.appointmentOverview,
          ...(data.appointmentOverview || {}),
        },

        recentActivity: Array.isArray(
          data.recentActivity
        )
          ? data.recentActivity
          : [],
      });
    } catch (err) {
      console.error("Dashboard Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ==========================================
  // HOSPITAL SETTINGS
  // ==========================================

  const hospitalName =
    settings?.hospitalName || "Hospital";

  const money = (value) =>
    formatCurrency(Number(value || 0));

  // Current date is formatted in the
  // hospital's configured timezone.
  const today = formatDate(new Date());

  // ==========================================
  // DASHBOARD CARDS
  // ==========================================

  const cards = [
    {
      title: "Total Patients",
      value: dashboard.stats.totalPatients,
      description: "Registered patients",
      icon: FiUsers,
      color: "bg-blue-50 text-blue-600",
    },

    {
      title: "Total Doctors",
      value: dashboard.stats.totalDoctors,
      description: "Active doctors",
      icon: FiUserCheck,
      color: "bg-green-50 text-green-600",
    },

    {
      title: "Today's Appointments",
      value: dashboard.stats.todayAppointments,
      description: "Scheduled today",
      icon: FiCalendar,
      color: "bg-purple-50 text-purple-600",
    },

    {
      title: "Today's Revenue",
      value: money(dashboard.stats.todayRevenue),
      description: "Payment collection",
      icon: FiDollarSign,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  // ==========================================
  // APPOINTMENT OVERVIEW CARDS
  // ==========================================

  const appointmentCards = [
    {
      title: "Pending",
      value: dashboard.appointmentOverview.pending,
      color: "bg-yellow-50 text-yellow-800",
      labelColor: "text-yellow-700",
    },

    {
      title: "Confirmed",
      value: dashboard.appointmentOverview.confirmed,
      color: "bg-blue-50 text-blue-800",
      labelColor: "text-blue-700",
    },

    {
      title: "Completed",
      value: dashboard.appointmentOverview.completed,
      color: "bg-green-50 text-green-800",
      labelColor: "text-green-700",
    },

    {
      title: "Cancelled",
      value: dashboard.appointmentOverview.cancelled,
      color: "bg-red-50 text-red-800",
      labelColor: "text-red-700",
    },
  ];

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <FiRefreshCw
            className="animate-spin"
            size={20}
          />

          Loading dashboard...
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-8">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-slate-500">
            {hospitalName} overview and administration
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <FiCalendar size={16} />

            <span>{today}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw
            size={17}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-100 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {/* ======================================
          STATISTIC CARDS
      ====================================== */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 break-words text-3xl font-bold text-slate-950">
                    {card.value}
                  </h2>

                  <p className="mt-3 text-sm text-slate-500">
                    {card.description}
                  </p>
                </div>

                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon size={26} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================
          RECENT ACTIVITY + OVERVIEW
      ====================================== */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* RECENT ACTIVITY */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-2">
              <FiClock
                className="text-blue-600"
                size={20}
              />

              <h2 className="text-xl font-semibold text-slate-900">
                Recent Activity
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Latest appointments
            </p>
          </div>

          {dashboard.recentActivity.length === 0 ? (
            <div className="p-8 text-slate-500">
              No activity yet.
            </div>
          ) : (
            <div className="divide-y">
              {dashboard.recentActivity.map(
                (activity, index) => (
                  <div
                    key={
                      activity._id ||
                      activity.appointmentId ||
                      index
                    }
                    className="p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {activity.patientName || "-"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Appointment{" "}
                          {activity.appointmentId || "-"}{" "}
                          with Dr.{" "}
                          {activity.doctorName || "-"}
                        </p>

                        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <FiCalendar size={13} />

                          <span>
                            {activity.appointmentDate
                              ? formatDate(
                                  activity.appointmentDate
                                )
                              : "-"}
                          </span>

                          {activity.appointmentTime && (
                            <>
                              <FiClock size={13} />

                              <span>
                                {formatTime(
                                  activity.appointmentTime
                                )}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                          activity.status
                        )}`}
                      >
                        {activity.status || "pending"}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* APPOINTMENT OVERVIEW */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Appointment Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Appointment status statistics
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {appointmentCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-xl p-5 ${card.color}`}
              >
                <p
                  className={`text-sm font-medium ${card.labelColor}`}
                >
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
