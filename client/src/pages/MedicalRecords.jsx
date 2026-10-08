import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../api";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useSettings,
} from "../context/SettingsContext";

function MedicalRecords() {
  // ==========================================
  // CONTEXT
  // ==========================================

  const { user } = useAuth();

  const {
    formatDate,
    formatDateTime,
    formatTime,
  } = useSettings();

  const navigate =
    useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  // ==========================================
  // ERROR HELPER
  // ==========================================

  const getError = (
    err
  ) =>
    err.response?.data
      ?.message ||
    err.message ||
    "Something went wrong.";

  // ==========================================
  // FETCH MEDICAL RECORDS
  // ==========================================

  const fetchRecords =
    async () => {
      try {
        setLoading(true);

        setError("");

        const { data } =
          await api.get(
            "/medical-records"
          );

        setRecords(
          data.medicalRecords ||
            []
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
    fetchRecords();
  }, []);

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  const filteredRecords =
    records.filter(
      (record) => {
        const text =
          search
            .trim()
            .toLowerCase();

        return [
          record.medicalRecordId,

          record.patient
            ?.patientId,

          record.patient
            ?.user?.name,

          record.doctor
            ?.doctorId,

          record.doctor
            ?.user?.name,

          record.appointment
            ?.appointmentId,

          record.diagnosis,

          record.symptoms,

          record.notes,
        ].some((value) =>
          String(
            value || ""
          )
            .toLowerCase()
            .includes(text)
        );
      }
    );

  // ==========================================
  // VIEW RECORD
  // ==========================================

  const handleView = (
    record
  ) => {
    if (
      user?.role ===
      "admin"
    ) {
      navigate(
        `/admin/medical-records/${record._id}`
      );

      return;
    }

    if (
      user?.role ===
      "doctor"
    ) {
      navigate(
        `/doctor/medical-records/${record._id}`
      );

      return;
    }

    if (
      user?.role ===
      "patient"
    ) {
      navigate(
        `/patient/medical-records/${record._id}`
      );
    }
  };

  // ==========================================
  // EDIT / CONSULTATION
  // ==========================================

  const handleEdit = (
    record
  ) => {
    if (
      !record.appointment
        ?._id
    ) {
      setError(
        "Appointment information is not available for this medical record."
      );

      return;
    }

    navigate(
      `/doctor/consultation/${record.appointment._id}`
    );
  };

  // ==========================================
  // INPUT STYLE
  // ==========================================

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ================================
          HEADER
      ================================= */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Medical Records
        </h1>

        <p className="mt-1 text-gray-500">
          View consultation and
          treatment records
        </p>
      </div>

      {/* ================================
          ERROR
      ================================= */}

      {error && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* ================================
          SEARCH
      ================================= */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search record, patient, doctor or diagnosis..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className={
            inputClass
          }
        />
      </div>

      {/* ================================
          TABLE
      ================================= */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading medical
            records...
          </div>
        ) : filteredRecords
            .length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No medical records
            found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              {/* TABLE HEADER */}

              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">
                    Record ID
                  </th>

                  <th className="px-5 py-4">
                    Patient
                  </th>

                  <th className="px-5 py-4">
                    Doctor
                  </th>

                  <th className="px-5 py-4">
                    Appointment
                  </th>

                  <th className="px-5 py-4">
                    Diagnosis
                  </th>

                  <th className="whitespace-nowrap px-5 py-4">
                    Follow-up
                  </th>

                  <th className="whitespace-nowrap px-5 py-4">
                    Record Date
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {filteredRecords.map(
                  (record) => (
                    <tr
                      key={
                        record._id
                      }
                      className="border-b transition hover:bg-gray-50"
                    >
                      {/* RECORD ID */}

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">
                        {record.medicalRecordId ||
                          "-"}
                      </td>

                      {/* PATIENT */}

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800">
                          {record.patient
                            ?.user
                            ?.name ||
                            "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {record.patient
                            ?.patientId ||
                            "-"}
                        </div>
                      </td>

                      {/* DOCTOR */}

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800">
                          {record.doctor
                            ?.user
                            ?.name ||
                            "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {record.doctor
                            ?.doctorId ||
                            "-"}
                        </div>
                      </td>

                      {/* APPOINTMENT */}

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800">
                          {record
                            .appointment
                            ?.appointmentId ||
                            "-"}
                        </div>

                        {record
                          .appointment
                          ?.appointmentDate && (
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDate(
                              record
                                .appointment
                                .appointmentDate
                            )}
                          </div>
                        )}

                        {record
                          .appointment
                          ?.appointmentTime && (
                          <div className="mt-1 text-xs text-gray-500">
                            {formatTime(
                              record
                                .appointment
                                .appointmentTime
                            )}
                          </div>
                        )}
                      </td>

                      {/* DIAGNOSIS */}

                      <td className="max-w-xs px-5 py-4">
                        <div
                          className="truncate"
                          title={
                            record.diagnosis ||
                            ""
                          }
                        >
                          {record.diagnosis ||
                            "-"}
                        </div>
                      </td>

                      {/* FOLLOW UP */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {record.followUpDate
                          ? formatDate(
                              record.followUpDate
                            )
                          : "-"}
                      </td>

                      {/* RECORD CREATED DATE */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {record.createdAt
                          ? formatDateTime(
                              record.createdAt
                            )
                          : "-"}
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                record
                              )
                            }
                            className="rounded-lg bg-blue-100 px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-200"
                          >
                            View
                          </button>

                          {user?.role ===
                            "doctor" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  record
                                )
                              }
                              className="rounded-lg bg-green-100 px-3 py-2 font-medium text-green-700 transition hover:bg-green-200"
                            >
                              Edit
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

      {/* ================================
          RESULT COUNT
      ================================= */}

      {!loading &&
        records.length >
          0 && (
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {
                filteredRecords.length
              }
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {
                records.length
              }
            </span>{" "}
            medical records
          </div>
        )}
    </div>
  );
}

export default MedicalRecords;