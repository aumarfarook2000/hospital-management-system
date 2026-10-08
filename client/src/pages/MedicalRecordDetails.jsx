import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useSettings,
} from "../context/SettingsContext";

function MedicalRecordDetails() {
  // ==========================================
  // ROUTER + CONTEXT
  // ==========================================

  const { id } = useParams();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const {
    formatDate,
    formatDateTime,
    formatTime,
  } = useSettings();

  // ==========================================
  // STATE
  // ==========================================

  const [
    record,
    setRecord,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
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
  // FETCH RECORD
  // ==========================================

  useEffect(() => {
    const fetchRecord =
      async () => {
        try {
          setLoading(true);

          setError("");

          const { data } =
            await api.get(
              `/medical-records/${id}`
            );

          setRecord(
            data.medicalRecord
          );
        } catch (err) {
          setError(
            getError(err)
          );
        } finally {
          setLoading(false);
        }
      };

    fetchRecord();
  }, [id]);

  // ==========================================
  // BACK NAVIGATION
  // ==========================================

  const handleBack = () => {
    if (
      user?.role ===
      "admin"
    ) {
      navigate(
        "/admin/medical-records"
      );

      return;
    }

    if (
      user?.role ===
      "doctor"
    ) {
      navigate(
        "/doctor/medical-records"
      );

      return;
    }

    if (
      user?.role ===
      "patient"
    ) {
      navigate(
        "/patient/medical-records"
      );

      return;
    }

    navigate("/");
  };

  // ==========================================
  // DOCTOR EDIT
  // ==========================================

  const handleEdit = () => {
    if (
      !record?.appointment
        ?._id
    ) {
      setError(
        "Appointment information is not available."
      );

      return;
    }

    navigate(
      `/doctor/consultation/${record.appointment._id}`
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading medical
        record...
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !record) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={
            handleBack
          }
          className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>
    );
  }

  // ==========================================
  // RECORD NOT FOUND
  // ==========================================

  if (!record) {
    return (
      <div className="rounded-lg bg-red-100 p-4 text-red-700">
        Medical record not
        found.
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ================================
          HEADER
      ================================= */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Medical Record
          </h1>

          <p className="mt-1 text-gray-500">
            {record.medicalRecordId ||
              "-"}
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleBack
          }
          className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
        >
          ← Back
        </button>
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
          PATIENT & APPOINTMENT
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          Patient & Appointment
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            label="Patient Name"
            value={
              record.patient
                ?.user?.name
            }
          />

          <Info
            label="Patient ID"
            value={
              record.patient
                ?.patientId
            }
          />

          <Info
            label="Mobile"
            value={
              record.patient
                ?.user?.mobile
            }
          />

          <Info
            label="Doctor"
            value={
              record.doctor
                ?.user?.name
            }
          />

          <Info
            label="Doctor ID"
            value={
              record.doctor
                ?.doctorId
            }
          />

          <Info
            label="Appointment ID"
            value={
              record.appointment
                ?.appointmentId
            }
          />

          <Info
            label="Appointment Date"
            value={
              record.appointment
                ?.appointmentDate
                ? formatDate(
                    record
                      .appointment
                      .appointmentDate
                  )
                : "-"
            }
          />

          <Info
            label="Appointment Time"
            value={
              record.appointment
                ?.appointmentTime
                ? formatTime(
                    record
                      .appointment
                      .appointmentTime
                  )
                : "-"
            }
          />

          <Info
            label="Appointment Status"
            value={
              record.appointment
                ?.status
            }
          />
        </div>
      </div>

      {/* ================================
          CONSULTATION DETAILS
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          Consultation Details
        </h2>

        <div className="space-y-5">
          <TextSection
            label="Symptoms"
            value={
              record.symptoms
            }
          />

          <TextSection
            label="Diagnosis"
            value={
              record.diagnosis
            }
          />

          <TextSection
            label="Tests / Investigations"
            value={
              record.tests
            }
          />

          <TextSection
            label="Doctor Notes"
            value={
              record.notes
            }
          />
        </div>
      </div>

      {/* ================================
          VITALS
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          Vitals
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Info
            label="Blood Pressure"
            value={
              record.vitals
                ?.bloodPressure
            }
          />

          <Info
            label="Temperature"
            value={
              record.vitals
                ?.temperature
            }
          />

          <Info
            label="Weight"
            value={
              record.vitals
                ?.weight
            }
          />

          <Info
            label="Pulse"
            value={
              record.vitals
                ?.pulse
            }
          />

          <Info
            label="SpO₂"
            value={
              record.vitals
                ?.spo2
            }
          />
        </div>
      </div>

      {/* ================================
          PRESCRIPTION
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          Prescription
        </h2>

        {!record.prescription ||
        record.prescription
          .length === 0 ? (
          <p className="text-gray-500">
            No medicines
            prescribed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    Medicine
                  </th>

                  <th className="px-4 py-3">
                    Dosage
                  </th>

                  <th className="px-4 py-3">
                    Frequency
                  </th>

                  <th className="px-4 py-3">
                    Duration
                  </th>

                  <th className="px-4 py-3">
                    Instructions
                  </th>
                </tr>
              </thead>

              <tbody>
                {record.prescription.map(
                  (
                    medicine,
                    index
                  ) => (
                    <tr
                      key={
                        medicine._id ||
                        index
                      }
                      className="border-b"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {medicine.medicineName ||
                          "-"}
                      </td>

                      <td className="px-4 py-3">
                        {medicine.dosage ||
                          "-"}
                      </td>

                      <td className="px-4 py-3">
                        {medicine.frequency ||
                          "-"}
                      </td>

                      <td className="px-4 py-3">
                        {medicine.duration ||
                          "-"}
                      </td>

                      <td className="px-4 py-3">
                        {medicine.instructions ||
                          "-"}
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
          FOLLOW-UP & RECORD INFORMATION
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          Follow-up & Record
          Information
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            label="Follow-up Date"
            value={
              record.followUpDate
                ? formatDate(
                    record.followUpDate
                  )
                : "-"
            }
          />

          <Info
            label="Record Created"
            value={
              record.createdAt
                ? formatDateTime(
                    record.createdAt
                  )
                : "-"
            }
          />

          <Info
            label="Last Updated"
            value={
              record.updatedAt
                ? formatDateTime(
                    record.updatedAt
                  )
                : "-"
            }
          />
        </div>
      </div>

      {/* ================================
          DOCTOR EDIT BUTTON
      ================================= */}

      {user?.role ===
        "doctor" &&
        record.appointment
          ?._id && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={
                handleEdit
              }
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Edit Medical
              Record
            </button>
          </div>
        )}
    </div>
  );
}

// ==========================================
// INFO COMPONENT
// ==========================================

function Info({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-800 capitalize">
        {value ===
          undefined ||
        value === null ||
        value === ""
          ? "-"
          : value}
      </p>
    </div>
  );
}

// ==========================================
// TEXT SECTION COMPONENT
// ==========================================

function TextSection({
  label,
  value,
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-500">
        {label}
      </p>

      <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}

export default MedicalRecordDetails;