
import { useEffect, useState } from "react";
import {
  FiUsers,
  FiSearch,
  FiEye,
  FiArrowLeft,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../api";
import { useSettings } from "../../context/SettingsContext";

const getError = (err) =>
  err.response?.data?.message ||
  err.message ||
  "Something went wrong.";

const displayValue = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }

  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
};

function Patients() {
  const { formatDate, formatTime } = useSettings();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  // ==========================================
  // LOAD ASSIGNED PATIENTS
  // ==========================================

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/patients");

      setPatients(data.patients || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredPatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase();

    return [
      patient.patientId,
      patient.user?.name,
      patient.user?.mobile,
      patient.user?.email,
      patient.bloodGroup,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  // ==========================================
  // PATIENT DETAILS
  // ==========================================

  const openPatient = async (patient) => {
    setSelectedPatient(patient);
    setAppointments([]);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const [patientResponse, appointmentResponse] =
        await Promise.all([
          api.get(`/patients/${patient._id}`),
          api.get(
            `/patients/${patient._id}/doctor-appointments`
          ),
        ]);

      setSelectedPatient(patientResponse.data.patient);

      setAppointments(
        appointmentResponse.data.appointments || []
      );
    } catch (err) {
      setDetailsError(getError(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedPatient(null);
    setAppointments([]);
    setDetailsError("");
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            My Patients
          </h1>

          <p className="mt-1 text-gray-500">
            Patients assigned through your appointments
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPatients}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-100 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
            <FiUsers size={25} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Assigned Patients
            </p>

            <h2 className="text-2xl font-bold text-gray-800">
              {patients.length}
            </h2>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, ID, mobile..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* PATIENT TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No assigned patients found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {[
                    "Patient ID",
                    "Name",
                    "Gender",
                    "Blood Group",
                    "Mobile",
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
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium">
                      {patient.patientId}
                    </td>

                    <td className="px-5 py-4">
                      {patient.user?.name || "-"}
                    </td>

                    <td className="px-5 py-4 capitalize">
                      {displayValue(patient.gender)}
                    </td>

                    <td className="px-5 py-4">
                      {displayValue(patient.bloodGroup)}
                    </td>

                    <td className="px-5 py-4">
                      {patient.user?.mobile || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          patient.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {patient.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openPatient(patient)}
                        className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200"
                      >
                        <FiEye />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PATIENT DETAILS MODAL */}

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Patient Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedPatient.patientId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="flex items-center gap-2 rounded-lg border px-4 py-2"
              >
                <FiArrowLeft />
                Back
              </button>
            </div>

            <div className="space-y-6 p-6">
              {detailsLoading ? (
                <p className="text-center text-gray-500">
                  Loading patient details...
                </p>
              ) : detailsError ? (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">
                  {detailsError}
                </div>
              ) : (
                <>
                  {/* PERSONAL INFORMATION */}

                  <section>
                    <h3 className="mb-4 text-lg font-semibold">
                      Personal Information
                    </h3>

                    <div className="grid gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-2">
                      <Info
                        label="Patient Name"
                        value={selectedPatient.user?.name}
                      />

                      <Info
                        label="Patient ID"
                        value={selectedPatient.patientId}
                      />

                      <Info
                        label="Gender"
                        value={selectedPatient.gender}
                      />

                      <Info
                        label="Date of Birth"
                        value={
                          selectedPatient.dateOfBirth
                            ? formatDate(
                                selectedPatient.dateOfBirth
                              )
                            : "-"
                        }
                      />

                      <Info
                        label="Blood Group"
                        value={selectedPatient.bloodGroup}
                      />

                      <Info
                        label="Mobile"
                        value={selectedPatient.user?.mobile}
                      />

                      <Info
                        label="Email"
                        value={selectedPatient.user?.email}
                      />

                      <Info
                        label="Address"
                        value={selectedPatient.address}
                      />

                      <Info
                        label="Emergency Contact"
                        value={
                          selectedPatient.emergencyContactName
                        }
                      />

                      <Info
                        label="Emergency Mobile"
                        value={
                          selectedPatient.emergencyContactMobile
                        }
                      />
                    </div>
                  </section>

                  {/* MEDICAL BACKGROUND */}

                  <section>
                    <h3 className="mb-4 text-lg font-semibold">
                      Medical Background
                    </h3>

                    <div className="grid gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-2">
                      <Info
                        label="Allergies"
                        value={selectedPatient.allergies}
                      />

                      <Info
                        label="Medical History"
                        value={selectedPatient.medicalHistory}
                      />
                    </div>
                  </section>

                  {/* APPOINTMENT HISTORY */}

                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <FiCalendar className="text-blue-600" />

                      <h3 className="text-lg font-semibold">
                        My Appointment History
                      </h3>
                    </div>

                    {appointments.length === 0 ? (
                      <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
                        No appointments found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {[
                                "Appointment ID",
                                "Date",
                                "Time",
                                "Reason",
                                "Status",
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
                            {appointments.map(
                              (appointment) => (
                                <tr
                                  key={appointment._id}
                                  className="border-t"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {appointment.appointmentId}
                                  </td>

                                  <td className="px-4 py-3">
                                    {formatDate(
                                      appointment.appointmentDate
                                    )}
                                  </td>

                                  <td className="px-4 py-3">
                                    {formatTime(
                                      appointment.appointmentTime
                                    )}
                                  </td>

                                  <td className="px-4 py-3">
                                    {appointment.reason || "-"}
                                  </td>

                                  <td className="px-4 py-3 capitalize">
                                    {appointment.status}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap break-words font-medium text-gray-800">
        {displayValue(value)}
      </p>
    </div>
  );
}

export default Patients;
