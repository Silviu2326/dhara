import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Save,
  Globe,
  Repeat,
} from "lucide-react";
import { checkExistingAppointments } from "../availability.api.js";

const ABSENCE_TYPES = [
  { value: "vacation", label: "Vacaciones", icon: "🏖️", color: "bg-blue-500" },
  { value: "sick", label: "Enfermedad", icon: "🤒", color: "bg-red-500" },
  { value: "personal", label: "Personal", icon: "👤", color: "bg-purple-500" },
  { value: "training", label: "Formación", icon: "📚", color: "bg-green-500" },
  {
    value: "conference",
    label: "Conferencia",
    icon: "🎤",
    color: "bg-yellow-500",
  },
  { value: "other", label: "Otro", icon: "📅", color: "bg-gray-500" },
];

const REPEAT_OPTIONS = [
  { value: "never", label: "Nunca" },
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

const TIMEZONE_OPTIONS = [
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/London", label: "Londres (GMT/BST)" },
  { value: "America/New_York", label: "Nueva York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (PST/PDT)" },
];

const DateTimeInput = ({
  label,
  type,
  value,
  onChange,
  error,
  required = false,
  min,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      className={`
        w-full px-3 py-2 border rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
        ${error ? "border-red-300" : "border-gray-300"}
      `}
      required={required}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

export const AbsenceModal = ({
  isOpen,
  onClose,
  onSave,
  absence = null,
  existingAppointments = [],
  defaultTimezone = "Europe/Madrid",
  loading = false,
  therapistId = "current_therapist_id",
}) => {
  const [formData, setFormData] = useState({
    type: "vacation",
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    allDay: true,
    repeat: "never",
    timezone: defaultTimezone,
    reason: "",
    notifyClients: true,
    autoDeclineBookings: true,
  });

  const [errors, setErrors] = useState({});
  const [affectedAppointments, setAffectedAppointments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or absence changes
  useEffect(() => {
    if (isOpen) {
      if (absence) {
        // Editing existing absence
        setFormData({
          type: absence.type || "vacation",
          title: absence.title || "",
          startDate:
            absence.startDate || new Date().toISOString().split("T")[0],
          endDate: absence.endDate || new Date().toISOString().split("T")[0],
          startTime: absence.startTime || "09:00",
          endTime: absence.endTime || "17:00",
          allDay: absence.allDay !== undefined ? absence.allDay : true,
          repeat: absence.repeat || "never",
          timezone: absence.timezone || defaultTimezone,
          reason: absence.reason || "",
          notifyClients:
            absence.notifyClients !== undefined ? absence.notifyClients : true,
          autoDeclineBookings:
            absence.autoDeclineBookings !== undefined
              ? absence.autoDeclineBookings
              : true,
        });
      } else {
        // Creating new absence
        const today = new Date().toISOString().split("T")[0];
        const selectedType = ABSENCE_TYPES[0];
        setFormData({
          type: selectedType.value,
          title: selectedType.label,
          startDate: today,
          endDate: today,
          startTime: "09:00",
          endTime: "17:00",
          allDay: true,
          repeat: "never",
          timezone: defaultTimezone,
          reason: "",
          notifyClients: true,
          autoDeclineBookings: true,
        });
      }
      setErrors({});
      setAffectedAppointments([]);
    }
  }, [isOpen, absence, defaultTimezone]);

  // Update title when type changes
  useEffect(() => {
    const selectedType = ABSENCE_TYPES.find((t) => t.value === formData.type);
    if (selectedType && !absence) {
      setFormData((prev) => ({ ...prev, title: selectedType.label }));
    }
  }, [formData.type, absence]);

  // Check for affected appointments using API
  useEffect(() => {
    const checkAffectedAppointments = async () => {
      if (formData.startDate && formData.endDate && therapistId) {
        try {
          const appointments = await checkExistingAppointments(
            therapistId,
            formData.startDate,
            formData.allDay ? null : formData.startTime,
            formData.allDay ? null : formData.endTime,
          );

          // Filter appointments within the absence date range
          const affected = appointments.filter((appointment) => {
            const appointmentDate =
              appointment.dateTime?.split("T")[0] || appointment.date;
            return (
              appointmentDate >= formData.startDate &&
              appointmentDate <= formData.endDate
            );
          });

          setAffectedAppointments(affected);
        } catch (error) {
          console.error("Error checking affected appointments:", error);
          // Fallback to local check
          const affected = existingAppointments.filter((appointment) => {
            const appointmentDate = appointment.date;
            return (
              appointmentDate >= formData.startDate &&
              appointmentDate <= formData.endDate
            );
          });
          setAffectedAppointments(affected);
        }
      }
    };

    checkAffectedAppointments();
  }, [
    formData.startDate,
    formData.endDate,
    formData.allDay,
    formData.startTime,
    formData.endTime,
    therapistId,
    existingAppointments,
  ]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido";
    }

    if (!formData.startDate) {
      newErrors.startDate = "La fecha de inicio es requerida";
    }

    if (!formData.endDate) {
      newErrors.endDate = "La fecha de fin es requerida";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      newErrors.endDate = "La fecha de fin debe ser posterior a la de inicio";
    }

    if (!formData.allDay) {
      if (!formData.startTime) {
        newErrors.startTime = "La hora de inicio es requerida";
      }

      if (!formData.endTime) {
        newErrors.endTime = "La hora de fin es requerida";
      }

      if (
        formData.startTime &&
        formData.endTime &&
        formData.startTime >= formData.endTime
      ) {
        newErrors.endTime = "La hora de fin debe ser posterior a la de inicio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSave?.({
        ...formData,
        id: absence?.id || `absence_${Date.now()}`,
        type: "absence",
        absenceType: formData.type,
        affectedAppointments: affectedAppointments.length,
      });
      onClose();
    } catch (error) {
      setErrors({ submit: "Error al guardar la ausencia" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const selectedAbsenceType = ABSENCE_TYPES.find(
    (t) => t.value === formData.type,
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-2 px-2 sm:pt-4 sm:px-4 pb-4 sm:pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        ></div>

        {/* Modal panel - full screen on mobile */}
        <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full h-[85vh] sm:h-auto sm:max-h-[90vh]">
          {/* Header */}
          <div className="bg-white px-3 py-3 sm:px-6 sm:py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3
                className="text-base sm:text-lg font-medium text-gray-900"
                id="modal-title"
              >
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2 text-red-500" />
                <span className="hidden sm:inline">
                  {absence ? "Editar ausencia" : "Nueva ausencia"}
                </span>
                <span className="sm:hidden">
                  {absence ? "Editar" : "Nueva"} ausencia
                </span>
              </h3>
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto h-[calc(85vh-60px)] sm:max-h-[60vh] px-3 py-3 sm:px-6 sm:py-4">
            {/* Affected appointments warning */}
            {affectedAppointments.length > 0 && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-yellow-800">
                      Citas afectadas
                    </h4>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-0.5">
                      Afectará a {affectedAppointments.length} cita(s).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Absence type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
                  {ABSENCE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type: type.value }))
                      }
                      className={`
                        flex items-center justify-center gap-1 sm:space-x-2 p-2 sm:p-3 rounded-md border transition-all duration-200 text-xs sm:text-sm
                        ${
                          formData.type === type.value
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
                    ${errors.title ? "border-red-300" : "border-gray-300"}
                  `}
                  placeholder="Ej: Vacaciones de verano"
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <DateTimeInput
                  label="Fecha de inicio"
                  type="date"
                  value={formData.startDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startDate: value }))
                  }
                  error={errors.startDate}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
                <DateTimeInput
                  label="Fecha de fin"
                  type="date"
                  value={formData.endDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, endDate: value }))
                  }
                  error={errors.endDate}
                  required
                  min={formData.startDate}
                />
              </div>

              {/* All day toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allDay: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="allDay"
                  className="text-sm font-medium text-gray-700"
                >
                  Todo el día
                </label>
              </div>

              {/* Time range (only if not all day) */}
              {!formData.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <DateTimeInput
                    label="Hora de inicio"
                    type="time"
                    value={formData.startTime}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, startTime: value }))
                    }
                    error={errors.startTime}
                    required
                  />
                  <DateTimeInput
                    label="Hora de fin"
                    type="time"
                    value={formData.endTime}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, endTime: value }))
                    }
                    error={errors.endTime}
                    required
                  />
                </div>
              )}

              {/* Repeat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Repeat className="h-4 w-4 inline mr-1" />
                  Repetir
                </label>
                <select
                  value={formData.repeat}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, repeat: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Zona horaria
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Información adicional sobre la ausencia..."
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifyClients"
                    checked={formData.notifyClients}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notifyClients: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="notifyClients"
                    className="text-sm text-gray-700"
                  >
                    Notificar a clientes afectados
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoDeclineBookings"
                    checked={formData.autoDeclineBookings}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoDeclineBookings: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="autoDeclineBookings"
                    className="text-sm text-gray-700"
                  >
                    Rechazar automáticamente nuevas reservas
                  </label>
                </div>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.submit}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row-reverse gap-2 sm:gap-0">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="
                w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm 
                px-4 py-2.5 sm:py-2 bg-red-600 text-sm font-medium text-white 
                hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
                sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>{absence ? "Actualizar" : "Crear"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="
                w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-gray-200 shadow-sm 
                px-4 py-2.5 sm:py-2 bg-white text-sm font-medium text-gray-700 
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
                sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
