import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../api";

import {
  useSettings,
} from "../../context/SettingsContext";

const emptyMedicine = {
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const emptyForm = {
  symptoms: "",

  diagnosis: "",

  vitals: {
    bloodPressure: "",
    temperature: "",
    weight: "",
    pulse: "",
    spo2: "",
  },

  prescription: [],

  tests: "",

  notes: "",

  followUpDate: "",
};

function Consultation() {
  // ==========================================
  // ROUTER
  // ==========================================

  const {
    appointmentId,
  } = useParams();

  const navigate =
    useNavigate();

  // ==========================================
  // SETTINGS
  // ==========================================

  const {
    formatDate,
    formatTime,
  } = useSettings();

  // ==========================================
  // STATE
  // ==========================================

  const [
    appointment,
    setAppointment,
  ] = useState(null);

  const [
    recordId,
    setRecordId,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

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
    success,
    setSuccess,
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
  // LOAD CONSULTATION
  // ==========================================

  useEffect(() => {
    const loadConsultation =
      async () => {
        try {
          setLoading(true);

          setError("");

          const [
            appointmentResponse,
            recordsResponse,
          ] =
            await Promise.all([
              api.get(
                `/appointments/${appointmentId}`
              ),

              api.get(
                "/medical-records"
              ),
            ]);

          const appointmentData =
            appointmentResponse
              .data
              .appointment;

          setAppointment(
            appointmentData
          );

          const existingRecord =
            recordsResponse.data
              .medicalRecords?.find(
                (record) =>
                  (record
                    .appointment
                    ?._id ||
                    record.appointment) ===
                  appointmentId
              );

          if (
            existingRecord
          ) {
            setRecordId(
              existingRecord._id
            );

            setFormData({
              symptoms:
                existingRecord
                  .symptoms ||
                "",

              diagnosis:
                existingRecord
                  .diagnosis ||
                "",

              vitals: {
                bloodPressure:
                  existingRecord
                    .vitals
                    ?.bloodPressure ||
                  "",

                temperature:
                  existingRecord
                    .vitals
                    ?.temperature ||
                  "",

                weight:
                  existingRecord
                    .vitals
                    ?.weight ||
                  "",

                pulse:
                  existingRecord
                    .vitals
                    ?.pulse ||
                  "",

                spo2:
                  existingRecord
                    .vitals
                    ?.spo2 ||
                  "",
              },

              prescription:
                existingRecord
                  .prescription ||
                [],

              tests:
                existingRecord
                  .tests ||
                "",

              notes:
                existingRecord
                  .notes ||
                "",

              followUpDate:
                existingRecord
                  .followUpDate
                  ?.split(
                    "T"
                  )[0] ||
                "",
            });
          }
        } catch (err) {
          setError(
            getError(err)
          );
        } finally {
          setLoading(false);
        }
      };

    loadConsultation();
  }, [appointmentId]);

  // ==========================================
  // NORMAL FORM CHANGE
  // ==========================================

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,

        [name]:
          value,
      })
    );
  };

  // ==========================================
  // VITAL CHANGE
  // ==========================================

  const handleVitalChange =
    (e) => {
      const {
        name,
        value,
      } = e.target;

      setFormData(
        (prev) => ({
          ...prev,

          vitals: {
            ...prev.vitals,

            [name]:
              value,
          },
        })
      );
    };

  // ==========================================
  // ADD MEDICINE
  // ==========================================

  const addMedicine =
    () => {
      setFormData(
        (prev) => ({
          ...prev,

          prescription: [
            ...prev.prescription,

            {
              ...emptyMedicine,
            },
          ],
        })
      );
    };

  // ==========================================
  // UPDATE MEDICINE
  // ==========================================

  const updateMedicine = (
    index,
    field,
    value
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        prescription:
          prev.prescription.map(
            (
              medicine,
              i
            ) =>
              i === index
                ? {
                    ...medicine,

                    [field]:
                      value,
                  }
                : medicine
          ),
      })
    );
  };

  // ==========================================
  // REMOVE MEDICINE
  // ==========================================

  const removeMedicine = (
    index
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        prescription:
          prev.prescription.filter(
            (_, i) =>
              i !==
              index
          ),
      })
    );
  };

  // ==========================================
  // SAVE / UPDATE MEDICAL RECORD
  // ==========================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (saving) {
        return;
      }

      try {
        setSaving(true);

        setError("");

        setSuccess("");

        const payload = {
          ...formData,

          appointment:
            appointmentId,

          followUpDate:
            formData.followUpDate ||
            null,
        };

        if (recordId) {
          await api.put(
            `/medical-records/${recordId}`,
            payload
          );

          setSuccess(
            "Medical record updated successfully."
          );
        } else {
          const { data } =
            await api.post(
              "/medical-records",
              payload
            );

          setRecordId(
            data.medicalRecord
              ._id
          );

          setSuccess(
            "Medical record created successfully."
          );
        }
      } catch (err) {
        setError(
          getError(err)
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // COMPLETE APPOINTMENT
  // ==========================================

  const handleCompleteAppointment =
    async () => {
      if (!recordId) {
        setError(
          "Save the medical record before completing the appointment."
        );

        return;
      }

      if (
        !window.confirm(
          "Complete this appointment?"
        )
      ) {
        return;
      }

      try {
        setSaving(true);

        setError("");

        setSuccess("");

        await api.put(
          `/appointments/${appointmentId}/status`,
          {
            status:
              "completed",
          }
        );

        setAppointment(
          (prev) => ({
            ...prev,

            status:
              "completed",
          })
        );

        setSuccess(
          "Appointment completed successfully."
        );
      } catch (err) {
        setError(
          getError(err)
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // STYLES
  // ==========================================

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading
        consultation...
      </div>
    );
  }

  // ==========================================
  // APPOINTMENT NOT FOUND
  // ==========================================

  if (!appointment) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error ||
            "Appointment not found."}
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/doctor/appointments"
            )
          }
          className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
        >
          ← Back
        </button>
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
            Consultation
          </h1>

          <p className="mt-1 text-gray-500">
            {appointment.appointmentId}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/doctor/appointments"
            )
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
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* ================================
          SUCCESS
      ================================= */}

      {success && (
        <div className="rounded-lg bg-green-100 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* ================================
          APPOINTMENT DETAILS
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Appointment
          Details
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            label="Patient"
            value={
              appointment.patient
                ?.user?.name
            }
          />

          <Info
            label="Patient ID"
            value={
              appointment.patient
                ?.patientId
            }
          />

          <Info
            label="Date"
            value={
              appointment.appointmentDate
                ? formatDate(
                    appointment.appointmentDate
                  )
                : "-"
            }
          />

          <Info
            label="Time"
            value={
              appointment.appointmentTime
                ? formatTime(
                    appointment.appointmentTime
                  )
                : "-"
            }
          />

          <Info
            label="Status"
            value={
              appointment.status
            }
            capitalize
          />

          <Info
            label="Reason"
            value={
              appointment.reason
            }
          />
        </div>
      </div>

      {/* ================================
          CONSULTATION FORM
      ================================= */}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >
        {/* CONSULTATION DETAILS */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Consultation
            Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Symptoms
              </label>

              <textarea
                name="symptoms"
                value={
                  formData.symptoms
                }
                onChange={
                  handleChange
                }
                rows="3"
                placeholder="Enter patient symptoms"
                className={
                  inputClass
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Diagnosis
              </label>

              <textarea
                name="diagnosis"
                value={
                  formData.diagnosis
                }
                onChange={
                  handleChange
                }
                rows="3"
                placeholder="Enter diagnosis"
                className={
                  inputClass
                }
              />
            </div>
          </div>
        </div>

        {/* ================================
            VITALS
        ================================= */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Vitals
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "bloodPressure",
                "Blood Pressure",
                "Example: 120/80",
              ],

              [
                "temperature",
                "Temperature",
                "Example: 98.6°F",
              ],

              [
                "weight",
                "Weight",
                "Example: 65 kg",
              ],

              [
                "pulse",
                "Pulse",
                "Example: 72 bpm",
              ],

              [
                "spo2",
                "SpO₂",
                "Example: 98%",
              ],
            ].map(
              ([
                name,
                label,
                placeholder,
              ]) => (
                <div
                  key={
                    name
                  }
                >
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {label}
                  </label>

                  <input
                    type="text"
                    name={
                      name
                    }
                    value={
                      formData
                        .vitals[
                        name
                      ]
                    }
                    onChange={
                      handleVitalChange
                    }
                    placeholder={
                      placeholder
                    }
                    className={
                      inputClass
                    }
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* ================================
            PRESCRIPTION
        ================================= */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Prescription
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add medicines
                prescribed to the
                patient
              </p>
            </div>

            <button
              type="button"
              onClick={
                addMedicine
              }
              className="rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-200"
            >
              + Add Medicine
            </button>
          </div>

          {formData
            .prescription
            .length ===
          0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No medicines
              added.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.prescription.map(
                (
                  medicine,
                  index
                ) => (
                  <div
                    key={
                      medicine._id ||
                      index
                    }
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-800">
                        Medicine{" "}
                        {index +
                          1}
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          removeMedicine(
                            index
                          )
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        [
                          "medicineName",
                          "Medicine Name",
                        ],

                        [
                          "dosage",
                          "Dosage",
                        ],

                        [
                          "frequency",
                          "Frequency",
                        ],

                        [
                          "duration",
                          "Duration",
                        ],

                        [
                          "instructions",
                          "Instructions",
                        ],
                      ].map(
                        ([
                          field,
                          label,
                        ]) => (
                          <div
                            key={
                              field
                            }
                            className={
                              field ===
                              "instructions"
                                ? "sm:col-span-2"
                                : ""
                            }
                          >
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              {
                                label
                              }
                            </label>

                            <input
                              type="text"
                              value={
                                medicine[
                                  field
                                ] ||
                                ""
                              }
                              onChange={(
                                e
                              ) =>
                                updateMedicine(
                                  index,
                                  field,
                                  e
                                    .target
                                    .value
                                )
                              }
                              required={
                                field ===
                                "medicineName"
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* ================================
            ADDITIONAL DETAILS
        ================================= */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Additional
            Details
          </h2>

          <div className="space-y-4">
            {/* TESTS */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tests /
                Investigations
              </label>

              <textarea
                name="tests"
                value={
                  formData.tests
                }
                onChange={
                  handleChange
                }
                rows="2"
                placeholder="Recommended tests or investigations"
                className={
                  inputClass
                }
              />
            </div>

            {/* NOTES */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Doctor Notes
              </label>

              <textarea
                name="notes"
                value={
                  formData.notes
                }
                onChange={
                  handleChange
                }
                rows="3"
                placeholder="Additional consultation notes"
                className={
                  inputClass
                }
              />
            </div>

            {/* FOLLOW UP */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Follow-up Date
              </label>

              <input
                type="date"
                name="followUpDate"
                value={
                  formData.followUpDate
                }
                onChange={
                  handleChange
                }
                className={
                  inputClass
                }
              />

              {formData.followUpDate && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected
                  follow-up:{" "}
                  <span className="font-medium text-gray-700">
                    {formatDate(
                      formData.followUpDate
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ================================
            ACTION BUTTONS
        ================================= */}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/doctor/appointments"
              )
            }
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              appointment.status ===
                "cancelled"
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : recordId
                ? "Update Medical Record"
                : "Save Medical Record"}
          </button>

          {recordId &&
            appointment.status !==
              "completed" &&
            appointment.status !==
              "cancelled" && (
              <button
                type="button"
                onClick={
                  handleCompleteAppointment
                }
                disabled={
                  saving
                }
                className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Complete
                Appointment
              </button>
            )}
        </div>
      </form>
    </div>
  );
}

// ==========================================
// INFO COMPONENT
// ==========================================

function Info({
  label,
  value,
  capitalize = false,
}) {
  const hasValue =
    value !==
      undefined &&
    value !== null &&
    value !== "";

  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 font-medium text-gray-800 ${
          capitalize
            ? "capitalize"
            : ""
        }`}
      >
        {hasValue
          ? value
          : "-"}
      </p>
    </div>
  );
}

export default Consultation;