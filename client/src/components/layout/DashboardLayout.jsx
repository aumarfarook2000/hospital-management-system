import { useState } from "react";

import {
  Outlet,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  FiMenu,
  FiX,
  FiLogOut,
  FiHome,
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiSettings,
  FiCreditCard,
  FiPackage,
  FiShoppingCart,
  FiArchive,
  FiList,
  FiActivity,
  FiMonitor,
} from "react-icons/fi";

import {
  useSettings,
} from "../../context/SettingsContext";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useTheme,
} from "../../context/ThemeContext";

// ==========================================
// MENU CONFIGURATION
// ==========================================

const menus = {
  // ========================================
  // ADMIN
  // ========================================

  admin: [
    {
      section: "Main",
      items: [
        {
          label: "Dashboard",
          path: "/admin/dashboard",
          icon: FiHome,
        },
      ],
    },

    {
      section: "Hospital",
      items: [
        {
          label: "Users",
          path: "/admin/users",
          icon: FiUsers,
        },
        {
          label: "Doctors",
          path: "/admin/doctors",
          icon: FiUserCheck,
        },
        {
          label: "Patients",
          path: "/admin/patients",
          icon: FiUsers,
        },
        {
          label: "Appointments",
          path: "/admin/appointments",
          icon: FiCalendar,
        },
        {
          label: "Medical Records",
          path: "/admin/medical-records",
          icon: FiActivity,
        },
        {
          label: "Billing",
          path: "/admin/billing",
          icon: FiCreditCard,
        },
      ],
    },

    {
      section: "Pharmacy",
      items: [
        {
          label: "Medicines",
          path: "/admin/pharmacy/medicines",
          icon: FiPackage,
        },
        {
          label: "Medicine Stock",
          path: "/admin/pharmacy/stock",
          icon: FiArchive,
        },
        {
          label: "New Sale",
          path: "/admin/pharmacy/sale",
          icon: FiShoppingCart,
        },
        {
          label: "Sales History",
          path: "/admin/pharmacy/sales",
          icon: FiList,
        },
      ],
    },

    {
      section: "System",
      items: [
        {
          label: "Settings",
          path: "/admin/settings",
          icon: FiSettings,
        },
        {
          label: "Appearance",
          path: "/admin/appearance",
          icon: FiMonitor,
        },
      ],
    },
  ],

  // ========================================
  // DOCTOR
  // ========================================

  doctor: [
    {
      section: "Main",
      items: [
        {
          label: "Dashboard",
          path: "/doctor/dashboard",
          icon: FiHome,
        },
      ],
    },

    {
      section: "Hospital",
      items: [
        {
          label: "Appointments",
          path: "/doctor/appointments",
          icon: FiCalendar,
        },
        {
          label: "Patients",
          path: "/doctor/patients",
          icon: FiUsers,
        },
        {
          label: "Medical Records",
          path: "/doctor/medical-records",
          icon: FiActivity,
        },
      ],
    },

    {
      section: "Account",
      items: [
        {
          label: "Profile",
          path: "/doctor/profile",
          icon: FiSettings,
        },
        {
          label: "Appearance",
          path: "/doctor/appearance",
          icon: FiMonitor,
        },
      ],
    },
  ],

  // ========================================
  // RECEPTIONIST
  // ========================================

  receptionist: [
    {
      section: "Main",
      items: [
        {
          label: "Dashboard",
          path: "/reception/dashboard",
          icon: FiHome,
        },
      ],
    },

    {
      section: "Hospital",
      items: [
        {
          label: "Patients",
          path: "/reception/patients",
          icon: FiUsers,
        },
        {
          label: "Appointments",
          path: "/reception/appointments",
          icon: FiCalendar,
        },
        {
          label: "Billing",
          path: "/reception/billing",
          icon: FiCreditCard,
        },
      ],
    },

    {
      section: "Pharmacy",
      items: [
        {
          label: "Medicines",
          path: "/reception/pharmacy/medicines",
          icon: FiPackage,
        },
        {
          label: "Medicine Stock",
          path: "/reception/pharmacy/stock",
          icon: FiArchive,
        },
        {
          label: "New Sale",
          path: "/reception/pharmacy/sale",
          icon: FiShoppingCart,
        },
        {
          label: "Sales History",
          path: "/reception/pharmacy/sales",
          icon: FiList,
        },
      ],
    },

    {
      section: "Account",
      items: [
        {
          label: "Profile",
          path: "/reception/profile",
          icon: FiSettings,
        },
        {
          label: "Appearance",
          path: "/reception/appearance",
          icon: FiMonitor,
        },
      ],
    },
  ],

  // ========================================
  // PATIENT
  // ========================================

  patient: [
    {
      section: "Main",
      items: [
        {
          label: "Dashboard",
          path: "/patient/dashboard",
          icon: FiHome,
        },
      ],
    },

    {
      section: "Hospital",
      items: [
        {
          label: "Doctors",
          path: "/patient/doctors",
          icon: FiUserCheck,
        },
        {
          label: "Appointments",
          path: "/patient/appointments",
          icon: FiCalendar,
        },
        {
          label: "Medical Records",
          path: "/patient/medical-records",
          icon: FiActivity,
        },
        {
          label: "Billing",
          path: "/patient/billing",
          icon: FiCreditCard,
        },
      ],
    },

    {
      section: "Account",
      items: [
        {
          label: "Profile",
          path: "/patient/profile",
          icon: FiSettings,
        },
        {
          label: "Appearance",
          path: "/patient/appearance",
          icon: FiMonitor,
        },
      ],
    },
  ],
};

// ==========================================
// DASHBOARD LAYOUT
// ==========================================

const DashboardLayout = () => {
  const {
    user,
    logout,
  } = useAuth();

  const {
    preferences,
  } = useTheme();

  const {
    settings: hospitalSettings,
  } = useSettings();

  const navigate = useNavigate();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  // ========================================
  // ROLE MENU
  // ========================================

  const userMenus =
    menus[user?.role] || [];

  // ========================================
  // SIDEBAR MODE
  // ========================================

  const compact =
    preferences?.sidebarMode ===
    "compact";

  // ========================================
  // HOSPITAL NAME
  // ========================================

  const hospitalName =
    hospitalSettings?.hospitalName?.trim() ||
    "Hospital Management System";

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ====================================
          MOBILE OVERLAY
      ==================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ====================================
          SIDEBAR
      ==================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-40
          flex
          h-screen
          flex-col
          border-r
          border-slate-800
          bg-slate-950
          text-white
          shadow-xl
          transition-all
          duration-300

          ${
            compact
              ? "w-72 lg:w-24"
              : "w-72"
          }

          lg:translate-x-0

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* ==================================
            BRAND
        ================================== */}

        <div
          className={`
            flex
            h-20
            shrink-0
            items-center
            border-b
            border-slate-800

            ${
              compact
                ? "justify-between px-5 lg:justify-center lg:px-2"
                : "justify-between px-5"
            }
          `}
        >
          <div className="flex min-w-0 items-center gap-3">
            {/* LOGO */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
              H
            </div>

            {/* BRAND TEXT */}

            <div
              className={
                compact
                  ? "min-w-0 lg:hidden"
                  : "min-w-0"
              }
            >
              <h1
                className="max-w-[180px] truncate text-sm font-bold text-white"
                title={hospitalName}
              >
                {hospitalName}
              </h1>

              <p className="truncate text-xs text-slate-400">
                Hospital Management
              </p>
            </div>
          </div>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <FiX size={20} />
          </button>
        </div>

        {/* ==================================
            MENU
        ================================== */}

        <nav
          className={`
            sidebar-scrollbar
            flex-1
            overflow-y-auto
            py-5

            ${
              compact
                ? "px-4 lg:px-3"
                : "px-4"
            }
          `}
        >
          <div className="space-y-6">
            {userMenus.map(
              (group) => (
                <div
                  key={
                    group.section
                  }
                >
                  {/* SECTION TITLE */}

                  <p
                    className={`
                      mb-2
                      px-3
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.18em]
                      text-slate-500

                      ${
                        compact
                          ? "block lg:hidden"
                          : "block"
                      }
                    `}
                  >
                    {group.section}
                  </p>

                  {/* COMPACT DIVIDER */}

                  {compact && (
                    <div className="mx-auto mb-2 hidden h-px w-8 bg-slate-800 lg:block" />
                  )}

                  {/* MENU ITEMS */}

                  <div className="space-y-1">
                    {group.items.map(
                      (menu) => {
                        const Icon =
                          menu.icon;

                        return (
                          <NavLink
                            key={
                              menu.path
                            }
                            to={
                              menu.path
                            }
                            title={
                              compact
                                ? menu.label
                                : undefined
                            }
                            onClick={() =>
                              setSidebarOpen(
                                false
                              )
                            }
                            className={({
                              isActive,
                            }) => `
                              group
                              relative
                              flex
                              items-center
                              rounded-xl
                              py-2.5
                              text-sm
                              font-medium
                              transition-all
                              duration-200

                              ${
                                compact
                                  ? "gap-3 px-3 lg:justify-center lg:px-2"
                                  : "gap-3 px-3"
                              }

                              ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
                              }
                            `}
                          >
                            {({
                              isActive,
                            }) => (
                              <>
                                {/* ACTIVE INDICATOR */}

                                {isActive && (
                                  <span
                                    className={`
                                      absolute
                                      h-7
                                      w-1
                                      rounded-r-full
                                      bg-blue-400

                                      ${
                                        compact
                                          ? "-left-3 lg:hidden"
                                          : "-left-4"
                                      }
                                    `}
                                  />
                                )}

                                {/* ICON */}

                                <span
                                  className={`
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    transition

                                    ${
                                      isActive
                                        ? "bg-white/15"
                                        : "bg-slate-900 group-hover:bg-slate-800"
                                    }
                                  `}
                                >
                                  <Icon
                                    size={
                                      17
                                    }
                                  />
                                </span>

                                {/* MENU LABEL */}

                                <span
                                  className={
                                    compact
                                      ? "block lg:hidden"
                                      : "block"
                                  }
                                >
                                  {
                                    menu.label
                                  }
                                </span>
                              </>
                            )}
                          </NavLink>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </nav>

        {/* ==================================
            USER / LOGOUT
        ================================== */}

        <div
          className={`
            shrink-0
            border-t
            border-slate-800

            ${
              compact
                ? "p-4 lg:p-3"
                : "p-4"
            }
          `}
        >
          {/* USER CARD */}

          <div
            className={`
              mb-3
              flex
              items-center
              rounded-xl
              bg-slate-900
              p-3

              ${
                compact
                  ? "gap-3 lg:justify-center lg:p-2"
                  : "gap-3"
              }
            `}
            title={
              compact
                ? `${user?.name || ""} - ${
                    user?.role || ""
                  }`
                : undefined
            }
          >
            {/* USER AVATAR */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>

            {/* USER DETAILS */}

            <div
              className={`
                min-w-0
                flex-1

                ${
                  compact
                    ? "block lg:hidden"
                    : "block"
                }
              `}
            >
              <p className="truncate text-sm font-semibold text-white">
                {user?.name ||
                  "User"}
              </p>

              <p className="truncate text-xs capitalize text-slate-400">
                {user?.role ||
                  ""}
              </p>
            </div>
          </div>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            title={
              compact
                ? "Logout"
                : undefined
            }
            className={`
              flex
              w-full
              items-center
              rounded-xl
              border
              border-slate-800
              py-2.5
              text-sm
              font-medium
              text-slate-300
              transition
              hover:border-red-500/40
              hover:bg-red-500/10
              hover:text-red-400

              ${
                compact
                  ? "justify-center gap-2 px-4 lg:px-2"
                  : "justify-center gap-2 px-4"
              }
            `}
          >
            <FiLogOut
              size={17}
            />

            <span
              className={
                compact
                  ? "block lg:hidden"
                  : "block"
              }
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ====================================
          CONTENT AREA
      ==================================== */}

      <div
        className={`
          transition-all
          duration-300

          ${
            compact
              ? "lg:ml-24"
              : "lg:ml-72"
          }
        `}
      >
        {/* ==================================
            TOP BAR
        ================================== */}

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:px-8">
          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          >
            <FiMenu size={22} />
          </button>

          {/* DYNAMIC HOSPITAL TITLE */}

          <div className="hidden min-w-0 lg:block">
            <h2
              className="max-w-[500px] truncate text-lg font-semibold text-slate-900"
              title={hospitalName}
            >
              {hospitalName}
            </h2>

            <p className="text-xs text-slate-500">
              Manage hospital
              operations
            </p>
          </div>

          {/* USER */}

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name ||
                  "User"}
              </p>

              <p className="text-xs capitalize text-slate-500">
                {user?.role ||
                  ""}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white shadow-sm">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>
          </div>
        </header>

        {/* ==================================
            PAGE CONTENT
        ================================== */}

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;