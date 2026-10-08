import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../api";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useSettings,
} from "../../context/SettingsContext";

const emptyForm = {
  patient: "",
  doctor: "",
  appointmentDate: "",
  appointmentTime: "",
  reason: "",
  notes: "",
};

function Appointments() {
  const { user } = useAuth();

  const {
    settings: hospitalSettings,
    formatDate,
    formatTime,
  } = useSettings();

  const navigate = useNavigate();

  const canManage = [
    "admin",
    "receptionist",
  ].includes(user?.role);

  const canChangeStatus = [
    "admin",
    "receptionist",
    "doctor",
  ].includes(user?.role);

  // ==========================================
  // STATE
  // ==========================================

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    patients,
    setPatients,
  ] = useState([]);

  const [
    doctors,
    setDoctors,
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
    editingAppointment,
    setEditingAppointment,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  // ==========================================
  // SETTINGS
  // ==========================================

  const appointmentDuration =
    Math.max(
      5,
      Number(
        hospitalSettings
          ?.appointmentDuration
      ) || 30
    );

  const workingFrom =
    hospitalSettings
      ?.workingFrom ||
    "09:00";

  const workingTo =
    hospitalSettings
      ?.workingTo ||
    "18:00";

  // ==========================================
  // COMMON STYLE
  // ==========================================

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  // ==========================================
  // ERROR HELPER
  // ==========================================

  const getError = (err) =>
    err.response?.data
      ?.message ||
    err.message ||
    "Something went wrong.";

  // ==========================================
  // LOCAL TODAY
  // ==========================================

  const getLocalToday = () => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================
  // FETCH APPOINTMENTS
  // ==========================================

  const fetchAppointments =
    async () => {
      try {
        setLoading(true);
        setError("");

        const { data } =
          await api.get(
            "/appointments"
          );

        setAppointments(
          data.appointments ||
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
    fetchAppointments();
  }, []);

  // ==========================================
  // LOAD PATIENTS + DOCTORS
  // ==========================================

  const loadOptions =
    async () => {
      try {
        const [
          patientResponse,
          doctorResponse,
        ] =
          await Promise.all([
            api.get(
              "/patients"
            ),

            api.get(
              "/doctors"
            ),
          ]);

        setPatients(
          patientResponse.data
            .patients || []
        );

        setDoctors(
          doctorResponse.data
            .doctors || []
        );

        return true;
      } catch (err) {
        setError(
          getError(err)
        );

        return false;
      }
    };

  // ==========================================
  // OPEN ADD
  // ==========================================

  const openAdd =
    async () => {
      setError("");

      if (
        !(await loadOptions())
      ) {
        return;
      }

      setEditingAppointment(
        null
      );

      setFormData({
        ...emptyForm,
      });

      setShowForm(true);
    };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEdit =
    async (
      appointment
    ) => {
      setError("");

      if (
        !(await loadOptions())
      ) {
        return;
      }

      setEditingAppointment(
        appointment
      );

      setFormData({
        patient:
          appointment.patient
            ?._id || "",

        doctor:
          appointment.doctor
            ?._id || "",

        appointmentDate:
          appointment
            .appointmentDate
            ?.split("T")[0] ||
          "",

        appointmentTime:
          appointment
            .appointmentTime ||
          "",

        reason:
          appointment.reason ||
          "",

        notes:
          appointment.notes ||
          "",
      });

      setShowForm(true);
    };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    setShowForm(false);

    setEditingAppointment(
      null
    );

    setFormData({
      ...emptyForm,
    });
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => {
        const updated = {
          ...prev,
          [name]: value,
        };

        if (
          name ===
            "doctor" ||
          name ===
            "appointmentDate"
        ) {
          updated.appointmentTime =
            "";
        }

        return updated;
      }
    );
  };

  // ==========================================
  // TIME HELPERS
  // ==========================================

  const timeToMinutes = (
    time
  ) => {
    if (!time) {
      return 0;
    }

    const [
      hours,
      minutes,
    ] = time
      .split(":")
      .map(Number);

    return (
      hours * 60 +
      minutes
    );
  };

  const minutesToTime = (
    totalMinutes
  ) => {
    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    return `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:${String(
      minutes
    ).padStart(
      2,
      "0"
    )}`;
  };

  // ==========================================
  // GENERATE HOSPITAL TIME SLOTS
  // ==========================================

  const timeSlots =
    useMemo(() => {
      const slots = [];

      const start =
        timeToMinutes(
          workingFrom
        );

      const end =
        timeToMinutes(
          workingTo
        );

      if (
        start >= end ||
        appointmentDuration <=
          0
      ) {
        return [];
      }

      for (
        let time = start;
        time +
          appointmentDuration <=
        end;
        time +=
          appointmentDuration
      ) {
        slots.push(
          minutesToTime(
            time
          )
        );
      }

      return slots;
    }, [
      workingFrom,
      workingTo,
      appointmentDuration,
    ]);

  // ==========================================
  // SELECTED DOCTOR
  // ==========================================

  const selectedDoctor =
    doctors.find(
      (doctor) =>
        doctor._id ===
        formData.doctor
    );

  // ==========================================
  // DOCTOR AVAILABILITY
  // ==========================================

  const getSelectedDayName =
    () => {
      if (
        !formData
          .appointmentDate
      ) {
        return "";
      }

      const date =
        new Date(
          `${formData.appointmentDate}T00:00:00`
        );

      return date.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
        }
      );
    };

  const selectedDayName =
    getSelectedDayName();

  const doctorWorksOnDay =
    !selectedDoctor ||
    !Array.isArray(
      selectedDoctor
        .availableDays
    ) ||
    selectedDoctor
      .availableDays
      .length === 0 ||
    selectedDoctor
      .availableDays
      .includes(
        selectedDayName
      );

  // ==========================================
  // DOCTOR WORKING HOURS
  // ==========================================

  const doctorFrom =
    selectedDoctor
      ?.availableFrom;

  const doctorTo =
    selectedDoctor
      ?.availableTo;

  const isInsideDoctorHours =
    (time) => {
      if (
        !doctorFrom ||
        !doctorTo
      ) {
        return true;
      }

      const slot =
        timeToMinutes(
          time
        );

      const from =
        timeToMinutes(
          doctorFrom
        );

      const to =
        timeToMinutes(
          doctorTo
        );

      return (
        slot >= from &&
        slot +
          appointmentDuration <=
          to
      );
    };

  // ==========================================
  // SLOT BOOKED?
  // ==========================================

  const isSlotBooked = (
    time
  ) => {
    if (
      !formData.doctor ||
      !formData
        .appointmentDate
    ) {
      return false;
    }

    return appointments.some(
      (appointment) => {
        if (
          editingAppointment &&
          appointment._id ===
            editingAppointment._id
        ) {
          return false;
        }

        if (
          appointment.status ===
          "cancelled"
        ) {
          return false;
        }

        const doctorId =
          appointment.doctor
            ?._id ||
          appointment.doctor;

        const date =
          appointment
            .appointmentDate
            ?.split("T")[0];

        return (
          doctorId ===
            formData.doctor &&
          date ===
            formData
              .appointmentDate &&
          appointment
            .appointmentTime ===
            time
        );
      }
    );
  };

  // ==========================================
  // PAST SLOT?
  // ==========================================

  const isPastSlot = (
    time
  ) => {
    if (
      !formData
        .appointmentDate
    ) {
      return false;
    }

    const slotDate =
      new Date(
        `${formData.appointmentDate}T${time}:00`
      );

    return (
      slotDate.getTime() <
      Date.now()
    );
  };

  // ==========================================
  // SLOT INFORMATION
  // ==========================================

  const slotData =
    useMemo(() => {
      return timeSlots.map(
        (time) => {
          const booked =
            isSlotBooked(
              time
            );

          const past =
            isPastSlot(
              time
            );

          const outsideDoctorHours =
            !isInsideDoctorHours(
              time
            );

          const unavailableDay =
            !doctorWorksOnDay;

          const disabled =
            booked ||
            past ||
            outsideDoctorHours ||
            unavailableDay;

          return {
            time,
            booked,
            past,
            outsideDoctorHours,
            unavailableDay,
            disabled,
          };
        }
      );
    }, [
      timeSlots,
      appointments,
      formData.doctor,
      formData.appointmentDate,
      editingAppointment,
      selectedDoctor,
      doctorWorksOnDay,
      appointmentDuration,
    ]);

  // ==========================================
  // AVAILABLE SLOT COUNT
  // ==========================================

  const availableSlotCount =
    slotData.filter(
      (slot) =>
        !slot.disabled
    ).length;

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (saving) {
        return;
      }

      if (
        !formData
          .appointmentTime
      ) {
        setError(
          "Please select an available appointment time."
        );

        return;
      }

      const selectedSlot =
        slotData.find(
          (slot) =>
            slot.time ===
            formData
              .appointmentTime
        );

      if (
        !selectedSlot ||
        selectedSlot.disabled
      ) {
        setError(
          "The selected appointment time is not available. Please choose another slot."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        if (
          editingAppointment
        ) {
          await api.put(
            `/appointments/${editingAppointment._id}`,
            formData
          );
        } else {
          const {
            notes,
            ...createData
          } = formData;

          await api.post(
            "/appointments",
            createData
          );
        }

        closeForm();

        await fetchAppointments();
      } catch (err) {
        setError(
          getError(err)
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // STATUS CHANGE
  // ==========================================

  const handleStatusChange =
    async (
      appointment,
      status
    ) => {
      if (
        status ===
        appointment.status
      ) {
        return;
      }

      if (
        !window.confirm(
          `Change appointment status to ${status}?`
        )
      ) {
        return;
      }

      try {
        setError("");

        await api.put(
          `/appointments/${appointment._id}/status`,
          {
            status,
          }
        );

        await fetchAppointments();
      } catch (err) {
        setError(
          getError(err)
        );
      }
    };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredAppointments =
    appointments.filter(
      (appointment) => {
        const text =
          search
            .trim()
            .toLowerCase();

        return [
          appointment
            .appointmentId,

          appointment.patient
            ?.patientId,

          appointment.patient
            ?.user?.name,

          appointment.doctor
            ?.doctorId,

          appointment.doctor
            ?.user?.name,

          appointment.status,
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
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Appointments
          </h1>

          <p className="mt-1 text-gray-500">
            Manage hospital
            appointments
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            + Add Appointment
          </button>
        )}
      </div>

      {/* SETTINGS INFORMATION */}

      {canManage && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          Appointment hours:
          {" "}

          <strong>
            {formatTime(
              workingFrom
            )}
          </strong>

          {" - "}

          <strong>
            {formatTime(
              workingTo
            )}
          </strong>

          {" • "}

          Duration:
          {" "}

          <strong>
            {
              appointmentDuration
            }{" "}
            minutes
          </strong>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-red-700">
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
          placeholder="Search appointment, patient, doctor or status..."
          className={
            inputClass
          }
        />
      </div>

      {/* APPOINTMENT TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading
            appointments...
          </div>
        ) : filteredAppointments
            .length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No appointments
            found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {[
                    "Appointment ID",
                    "Patient",
                    "Doctor",
                    "Date",
                    "Time",
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
                {filteredAppointments.map(
                  (
                    appointment
                  ) => (
                    <tr
                      key={
                        appointment._id
                      }
                      className="border-b transition hover:bg-gray-50"
                    >
                      {/* ID */}

                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {
                          appointment.appointmentId
                        }
                      </td>

                      {/* PATIENT */}

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {appointment
                            .patient
                            ?.user
                            ?.name ||
                            "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {appointment
                            .patient
                            ?.patientId ||
                            ""}
                        </div>
                      </td>

                      {/* DOCTOR */}

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {appointment
                            .doctor
                            ?.user
                            ?.name ||
                            "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {appointment
                            .doctor
                            ?.doctorId ||
                            ""}
                        </div>
                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(
                          appointment
                            .appointmentDate
                        )}
                      </td>

                      {/* TIME */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatTime(
                          appointment
                            .appointmentTime
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4 capitalize">
                        <span className="whitespace-nowrap rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {
                            appointment.status
                          }
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  appointment
                                )
                              }
                              className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700 transition hover:bg-blue-200"
                            >
                              Edit
                            </button>
                          )}

                          {user?.role ===
                            "doctor" &&
                            appointment.status !==
                              "cancelled" && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/doctor/consultation/${appointment._id}`
                                  )
                                }
                                className="rounded-lg bg-green-100 px-3 py-2 text-green-700 transition hover:bg-green-200"
                              >
                                Consultation
                              </button>
                            )}

                          {canChangeStatus && (
                            <select
                              value={
                                appointment.status
                              }
                              onChange={(
                                e
                              ) =>
                                handleStatusChange(
                                  appointment,
                                  e
                                    .target
                                    .value
                                )
                              }
                              className="rounded-lg border border-gray-300 px-2 py-2 outline-none"
                            >
                              <option value="pending">
                                Pending
                              </option>

                              <option value="confirmed">
                                Confirmed
                              </option>

                              <option value="completed">
                                Completed
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>
                            </select>
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

      {/* ADD / EDIT MODAL */}

      {showForm &&
        canManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingAppointment
                      ? "Edit Appointment"
                      : "Add Appointment"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      appointmentDuration
                    }
                    -minute
                    appointments from
                    {" "}

                    {formatTime(
                      workingFrom
                    )}

                    {" to "}

                    {formatTime(
                      workingTo
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-gray-500 hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5 p-6"
              >
                {/* PATIENT */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Patient *
                  </label>

                  <select
                    name="patient"
                    value={
                      formData.patient
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Select Patient
                    </option>

                    {patients
                      .filter(
                        (
                          patient
                        ) =>
                          patient.status ===
                          "active"
                      )
                      .map(
                        (
                          patient
                        ) => (
                          <option
                            key={
                              patient._id
                            }
                            value={
                              patient._id
                            }
                          >
                            {
                              patient.patientId
                            }

                            {" - "}

                            {patient
                              .user
                              ?.name}
                          </option>
                        )
                      )}
                  </select>
                </div>

                {/* DOCTOR */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Doctor *
                  </label>

                  <select
                    name="doctor"
                    value={
                      formData.doctor
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Select Doctor
                    </option>

                    {doctors
                      .filter(
                        (
                          doctor
                        ) =>
                          doctor.status ===
                          "active"
                      )
                      .map(
                        (
                          doctor
                        ) => (
                          <option
                            key={
                              doctor._id
                            }
                            value={
                              doctor._id
                            }
                          >
                            {
                              doctor.doctorId
                            }

                            {" - "}

                            {doctor
                              .user
                              ?.name}

                            {" ("}

                            {
                              doctor.specialization
                            }

                            {")"}
                          </option>
                        )
                      )}
                  </select>

                  {selectedDoctor && (
                    <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      Doctor
                      availability:
                      {" "}

                      <strong>
                        {selectedDoctor
                          .availableDays
                          ?.length
                          ? selectedDoctor.availableDays.join(
                              ", "
                            )
                          : "All hospital working days"}
                      </strong>

                      {doctorFrom &&
                        doctorTo && (
                          <>
                            {" • "}

                            <strong>
                              {formatTime(
                                doctorFrom
                              )}

                              {" - "}

                              {formatTime(
                                doctorTo
                              )}
                            </strong>
                          </>
                        )}
                    </div>
                  )}
                </div>

                {/* DATE */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Appointment Date *
                  </label>

                  <input
                    type="date"
                    name="appointmentDate"
                    value={
                      formData.appointmentDate
                    }
                    onChange={
                      handleChange
                    }
                    min={
                      getLocalToday()
                    }
                    required
                    className={
                      inputClass
                    }
                  />

                  {formData.appointmentDate &&
                    selectedDoctor &&
                    !doctorWorksOnDay && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        This doctor is
                        not available on
                        {" "}
                        {
                          selectedDayName
                        }
                        .
                      </p>
                    )}
                </div>

                {/* TIME SLOT SELECTION */}

                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-sm font-medium">
                      Appointment Time *
                    </label>

                    {formData.doctor &&
                      formData.appointmentDate &&
                      doctorWorksOnDay && (
                        <span className="text-xs text-gray-500">
                          {
                            availableSlotCount
                          }
                          {" "}
                          slot
                          {availableSlotCount ===
                          1
                            ? ""
                            : "s"}
                          {" "}
                          available
                        </span>
                      )}
                  </div>

                  {!formData.doctor ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                      Select a doctor
                      first.
                    </div>
                  ) : !formData.appointmentDate ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                      Select an
                      appointment date.
                    </div>
                  ) : !doctorWorksOnDay ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
                      Doctor is not
                      available on
                      {" "}
                      {
                        selectedDayName
                      }
                      .
                    </div>
                  ) : timeSlots.length ===
                    0 ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-center text-sm text-yellow-700">
                      No time slots
                      could be
                      generated. Please
                      check Appointment
                      Settings.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {slotData.map(
                        (
                          slot
                        ) => {
                          const selected =
                            formData.appointmentTime ===
                            slot.time;

                          let message =
                            "";

                          if (
                            slot.booked
                          ) {
                            message =
                              "Booked";
                          } else if (
                            slot.past
                          ) {
                            message =
                              "Past";
                          } else if (
                            slot.outsideDoctorHours
                          ) {
                            message =
                              "Unavailable";
                          }

                          return (
                            <button
                              key={
                                slot.time
                              }
                              type="button"
                              disabled={
                                slot.disabled
                              }
                              onClick={() =>
                                setFormData(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,

                                    // Keep raw
                                    // 24-hour time
                                    // for API/database.
                                    appointmentTime:
                                      slot.time,
                                  })
                                )
                              }
                              className={`
                                rounded-lg
                                border
                                px-3
                                py-3
                                text-sm
                                font-medium
                                transition

                                ${
                                  selected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : slot.disabled
                                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                                }
                              `}
                            >
                              <div>
                                {formatTime(
                                  slot.time
                                )}
                              </div>

                              {message && (
                                <div className="mt-1 text-[10px] font-normal">
                                  {
                                    message
                                  }
                                </div>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}

                  {formData.appointmentTime && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      Selected
                      appointment time:
                      {" "}

                      <strong>
                        {formatTime(
                          formData.appointmentTime
                        )}
                      </strong>
                    </div>
                  )}
                </div>

                {/* REASON */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Reason
                  </label>

                  <textarea
                    name="reason"
                    value={
                      formData.reason
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                    placeholder="Reason for appointment"
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* NOTES */}

                {editingAppointment && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Notes
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
                      placeholder="Appointment notes"
                      className={
                        inputClass
                      }
                    />
                  </div>
                )}

                {/* ACTION BUTTONS */}

                <div className="flex justify-end gap-3 border-t pt-5">
                  <button
                    type="button"
                    onClick={
                      closeForm
                    }
                    className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !formData
                        .appointmentTime
                    }
                    className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingAppointment
                        ? "Update Appointment"
                        : "Create Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default Appointments;