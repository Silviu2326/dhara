import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  Repeat,
  Globe,
  Palette,
  AlertCircle,
  Save,
  MapPin,
} from "lucide-react";
import {
  checkTimeBlockConflicts,
  checkExistingAppointments,
} from "../availability.api.js";

const REPEAT_OPTIONS = [
  { value: "never", label: "No repetir", description: "Solo una vez" },
  { value: "daily", label: "Diario", description: "Cada día" },
  {
    value: "weekly",
    label: "Semanal",
    description: "Cada semana en los días seleccionados",
  },
  {
    value: "monthly",
    label: "Mensual",
    description: "Cada mes en las fechas seleccionadas",
  },
  {
    value: "weekly_custom",
    label: "Días específicos de la semana",
    description: "Ej: Todos los lunes y miércoles",
  },
  {
    value: "monthly_weekday",
    label: "Día específico del mes",
    description: "Ej: Primer lunes de cada mes",
  },
];

const WEEKDAYS = [
  { value: "monday", label: "Lunes", short: "L" },
  { value: "tuesday", label: "Martes", short: "M" },
  { value: "wednesday", label: "Miércoles", short: "X" },
  { value: "thursday", label: "Jueves", short: "J" },
  { value: "friday", label: "Viernes", short: "V" },
  { value: "saturday", label: "Sábado", short: "S" },
  { value: "sunday", label: "Domingo", short: "D" },
];

const DURATION_OPTIONS = [
  { value: "1_month", label: "1 mes" },
  { value: "3_months", label: "3 meses" },
  { value: "6_months", label: "6 meses" },
  { value: "1_year", label: "1 año" },
  { value: "until_date", label: "Hasta una fecha específica" },
  { value: "indefinite", label: "Indefinidamente" },
];

const COLOR_OPTIONS = [
  { value: "sage", label: "Verde Sage", color: "bg-sage" },
  { value: "blue", label: "Azul", color: "bg-blue-500" },
  { value: "purple", label: "Morado", color: "bg-purple-500" },
  { value: "green", label: "Verde", color: "bg-green-500" },
  { value: "yellow", label: "Amarillo", color: "bg-yellow-500" },
  { value: "red", label: "Rojo", color: "bg-red-500" },
];

const LOCATION_OPTIONS = [
  {
    value: "consultorio1",
    label: "Consultorio Principal",
    description: "Sala principal de terapias",
  },
  {
    value: "consultorio2",
    label: "Consultorio Secundario",
    description: "Sala auxiliar para consultas",
  },
  {
    value: "online",
    label: "Sesión Online",
    description: "Videoconsulta por internet",
  },
  {
    value: "domicilio",
    label: "Servicio a Domicilio",
    description: "Atención en casa del paciente",
  },
];

const TIMEZONE_OPTIONS = [
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/London", label: "Londres (GMT/BST)" },
  { value: "America/New_York", label: "Nueva York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (PST/PDT)" },
];

const TimeInput = ({ label, value, onChange, error, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full px-3 py-2 border rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
        ${error ? "border-red-300" : "border-gray-300"}
      `}
      required={required}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <AlertCircle className="h-4 w-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const DateInput = ({
  label,
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
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      className={`
        w-full px-3 py-2 border rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
        ${error ? "border-red-300" : "border-gray-300"}
      `}
      required={required}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <AlertCircle className="h-4 w-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

// Helper functions
const generateRecurringDates = (formData) => {
  const dates = [];
  const startDate = new Date(formData.startDate);
  let endDate;

  // Calculate end date based on duration
  switch (formData.duration) {
    case "1_month":
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "3_months":
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case "6_months":
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case "1_year":
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case "until_date":
      endDate = new Date(formData.durationEndDate);
      break;
    case "indefinite":
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 2); // Max 2 years for indefinite
      break;
    default:
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
  }

  const current = new Date(startDate);
  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  while (current <= endDate) {
    let shouldAdd = false;

    switch (formData.repeat) {
      case "daily":
        shouldAdd = true;
        break;
      case "weekly_custom":
        const dayName = Object.keys(weekdayMap).find(
          (key) => weekdayMap[key] === current.getDay(),
        );
        shouldAdd = formData.selectedWeekdays.includes(dayName);
        break;
      case "weekly":
        shouldAdd = current.getDay() === startDate.getDay();
        break;
      case "monthly":
        shouldAdd = current.getDate() === startDate.getDate();
        break;
      default:
        shouldAdd = current.getTime() === startDate.getTime();
    }

    if (shouldAdd) {
      dates.push(new Date(current));
    }

    // Increment based on repeat type
    switch (formData.repeat) {
      case "daily":
        current.setDate(current.getDate() + 1);
        break;
      case "weekly_custom":
      case "weekly":
        current.setDate(current.getDate() + 1);
        break;
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 1);
        break;
    }
  }

  return dates.slice(0, 100); // Limit to 100 dates for performance
};

export const SlotModal = ({
  isOpen,
  onClose,
  onSave,
  slot = null,
  existingEvents = [],
  defaultTimezone = "Europe/Madrid",
  loading = false,
  workLocations = [], // Ubicaciones del perfil profesional
  therapistId = "current_therapistId",
}) => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "10:00",
    repeat: "never",
    selectedWeekdays: [],
    duration: "3_months",
    durationEndDate: "",
    timezone: defaultTimezone,
    color: "sage",
    title: "Disponible",
    notes: "",
    location: workLocations.length > 0 ? workLocations[0].id : "online",
  });

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDates, setPreviewDates] = useState([]);

  // Initialize form when modal opens or slot changes
  useEffect(() => {
    if (isOpen) {
      if (slot) {
        // Editing existing slot
        setFormData({
          id: slot.id || slot._id, // Preserve ID for updates
          startDate: slot.startDate || new Date().toISOString().split("T")[0],
          endDate: slot.endDate || new Date().toISOString().split("T")[0],
          startTime: slot.startTime || "09:00",
          endTime: slot.endTime || "10:00",
          repeat: slot.repeat || "never",
          selectedWeekdays: slot.selectedWeekdays || [],
          duration: slot.duration || "3_months",
          durationEndDate: slot.durationEndDate || "",
          timezone: slot.timezone || defaultTimezone,
          color: slot.color || "sage",
          title: slot.title || "Disponible",
          notes: slot.notes || "",
          location: slot.location || "consultorio1",
        });
      } else {
        // Creating new slot
        const today = new Date().toISOString().split("T")[0];
        setFormData({
          startDate: today,
          endDate: today,
          startTime: "09:00",
          endTime: "10:00",
          repeat: "never",
          selectedWeekdays: [],
          duration: "3_months",
          durationEndDate: "",
          timezone: defaultTimezone,
          color: "sage",
          title: "Disponible",
          notes: "",
          location: workLocations.length > 0 ? workLocations[0].id : "online",
        });
      }
      setErrors({});
      setConflicts([]);
    }
  }, [isOpen, slot, defaultTimezone]);

  // Generate preview when form data changes
  useEffect(() => {
    if (formData.repeat !== "never" && formData.startDate) {
      const dates = generateRecurringDates(formData);
      setPreviewDates(dates);
    } else {
      setPreviewDates([]);
    }
  }, [
    formData.repeat,
    formData.startDate,
    formData.selectedWeekdays,
    formData.duration,
    formData.durationEndDate,
  ]);

  const validateForm = () => {
    const newErrors = {};

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

    if (!formData.location) {
      newErrors.location = "La ubicación es requerida";
    }

    if (
      formData.repeat === "weekly_custom" &&
      formData.selectedWeekdays.length === 0
    ) {
      newErrors.selectedWeekdays = "Selecciona al menos un día de la semana";
    }

    if (formData.duration === "until_date" && !formData.durationEndDate) {
      newErrors.durationEndDate = "La fecha final es requerida";
    }

    if (
      formData.durationEndDate &&
      formData.startDate &&
      formData.durationEndDate < formData.startDate
    ) {
      newErrors.durationEndDate =
        "La fecha final debe ser posterior a la fecha de inicio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkConflicts = async () => {
    try {
      // Check for conflicts using real API
      const conflictCheck = await checkTimeBlockConflicts(
        therapistId,
        formData.startTime,
        formData.endTime,
        formData.location,
        slot?.id,
      );

      // Verificar que la respuesta tenga el formato esperado
      if (!conflictCheck || typeof conflictCheck !== "object") {
        console.warn("Invalid conflict check response:", conflictCheck);
        setConflicts([]);
        return [];
      }

      if (conflictCheck.hasConflicts) {
        setConflicts(conflictCheck.conflicts || []);
        return conflictCheck.conflicts || [];
      }

      // Also check for existing appointments on the date
      const appointmentCheck = await checkExistingAppointments(
        therapistId,
        formData.startDate,
        formData.startTime,
        formData.endTime,
      );

      if (appointmentCheck.length > 0) {
        const conflictingAppointments = appointmentCheck.filter(
          (apt) => apt.location === formData.location && apt.id !== slot?.id,
        );
        setConflicts(conflictingAppointments);
        return conflictingAppointments;
      }

      setConflicts([]);
      return [];
    } catch (error) {
      console.error("Error checking conflicts via API:", error);

      // Fallback to local conflict check
      const conflictingEvents = existingEvents.filter((event) => {
        if (event.type !== "appointment") return false;
        if (event.id === slot?.id) return false;

        return (
          event.location === formData.location &&
          event.date === formData.startDate &&
          event.startTime < formData.endTime &&
          event.endTime > formData.startTime
        );
      });

      setConflicts(conflictingEvents);
      return conflictingEvents;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Check for conflicts using API
      const conflictingEvents = await checkConflicts();
      if (conflictingEvents.length > 0) {
        // Show conflicts but allow user to proceed by clicking again
        setIsSubmitting(false);
        return;
      }

      await onSave?.({
        ...formData,
        id: formData.id || slot?.id || `slot_${Date.now()}`,
        type: "availability",
      });
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || "Error al guardar el bloque de disponibilidad",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

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
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {slot
                    ? "Editar bloque de disponibilidad"
                    : "Nuevo bloque de disponibilidad"}
                </span>
                <span className="sm:hidden">
                  {slot ? "Editar" : "Nuevo"} bloque
                </span>
              </h3>
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto h-[calc(85vh-60px)] sm:max-h-[60vh] px-3 py-3 sm:px-6 sm:py-4">
            {/* Conflicts warning */}
            {conflicts.length > 0 && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-yellow-800">
                      Conflicto detectado
                    </h4>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-0.5">
                      Se solapa con {conflicts.length} cita(s).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Date range - stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <DateInput
                  label="Inicio"
                  value={formData.startDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startDate: value }))
                  }
                  error={errors.startDate}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
                <DateInput
                  label="Fin"
                  value={formData.endDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, endDate: value }))
                  }
                  error={errors.endDate}
                  required
                  min={formData.startDate}
                />
              </div>

              {/* Time range - stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <TimeInput
                  label="Hora inicio"
                  value={formData.startTime}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startTime: value }))
                  }
                  error={errors.startTime}
                  required
                />
                <TimeInput
                  label="Hora fin"
                  value={formData.endTime}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, endTime: value }))
                  }
                  error={errors.endTime}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Ubicación <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
                    ${errors.location ? "border-red-300" : "border-gray-300"}
                  `}
                  required
                >
                  {/* Ubicaciones dinámicas del perfil */}
                  {workLocations.length > 0
                    ? workLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.city}
                        </option>
                      ))
                    : /* Fallback a ubicaciones por defecto si no hay ubicaciones configuradas */
                      LOCATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}

                  {/* Opciones especiales siempre disponibles */}
                  <option value="online">
                    Sesión Online - Videoconsulta por internet
                  </option>
                  <option value="domicilio">
                    Servicio a Domicilio - Atención en casa del paciente
                  </option>
                </select>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.location}
                  </p>
                )}

                {/* Información adicional sobre la ubicación seleccionada */}
                {formData.location &&
                  workLocations.length > 0 &&
                  (() => {
                    const selectedLocation = workLocations.find(
                      (loc) => loc.id.toString() === formData.location,
                    );
                    if (selectedLocation) {
                      return (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
                          <p>
                            📍 {selectedLocation.address},{" "}
                            {selectedLocation.city}
                          </p>
                          {selectedLocation.phone && (
                            <p>📞 {selectedLocation.phone}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>

              {/* Repeat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Repeat className="h-4 w-4 inline mr-1" />
                  Patrón de repetición
                </label>
                <select
                  value={formData.repeat}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      repeat: e.target.value,
                      selectedWeekdays:
                        e.target.value === "weekly_custom"
                          ? []
                          : prev.selectedWeekdays,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {
                    REPEAT_OPTIONS.find((opt) => opt.value === formData.repeat)
                      ?.description
                  }
                </p>
              </div>

              {/* Weekly Custom Days Selection */}
              {formData.repeat === "weekly_custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de la semana <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const newWeekdays =
                            formData.selectedWeekdays.includes(day.value)
                              ? formData.selectedWeekdays.filter(
                                  (d) => d !== day.value,
                                )
                              : [...formData.selectedWeekdays, day.value];
                          setFormData((prev) => ({
                            ...prev,
                            selectedWeekdays: newWeekdays,
                          }));
                        }}
                        className={`
                          px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                          ${
                            formData.selectedWeekdays.includes(day.value)
                              ? "bg-sage text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }
                        `}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {errors.selectedWeekdays && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.selectedWeekdays}
                    </p>
                  )}
                </div>
              )}

              {/* Duration Settings for recurring patterns */}
              {formData.repeat !== "never" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Duración
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {formData.duration === "until_date" && (
                    <div className="mt-2">
                      <DateInput
                        label="Fecha final"
                        value={formData.durationEndDate}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            durationEndDate: value,
                          }))
                        }
                        error={errors.durationEndDate}
                        required
                        min={formData.startDate}
                      />
                    </div>
                  )}
                </div>
              )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="h-4 w-4 inline mr-1" />
                  Color (opcional)
                </label>
                <div className="flex space-x-2">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          color: option.value,
                        }))
                      }
                      className={`
                        w-8 h-8 rounded-full border-2 transition-all duration-200
                        ${option.color}
                        ${
                          formData.color === option.value
                            ? "border-gray-900 scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        }
                      `}
                      title={option.label}
                      aria-label={`Seleccionar color ${option.label}`}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="Información adicional sobre este bloque de disponibilidad..."
                />
              </div>

              {/* Preview Section */}
              {previewDates.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Vista previa de fechas ({previewDates.length}{" "}
                    {previewDates.length === 100 ? "+ " : ""}días)
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {previewDates.slice(0, 12).map((date, index) => (
                        <div
                          key={index}
                          className="bg-white px-2 py-1 rounded text-center"
                        >
                          {date.toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            weekday: "short",
                          })}
                        </div>
                      ))}
                      {previewDates.length > 12 && (
                        <div className="bg-sage text-white px-2 py-1 rounded text-center">
                          +{previewDates.length - 12}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {previewDates.length === 100 &&
                      "Mostrando las primeras 100 fechas. "}
                    Horario: {formData.startTime} - {formData.endTime} en{" "}
                    {(() => {
                      if (workLocations.length > 0) {
                        const selectedLocation = workLocations.find(
                          (loc) => loc.id.toString() === formData.location,
                        );
                        if (selectedLocation) return selectedLocation.name;
                      }
                      const fallbackLocation = LOCATION_OPTIONS.find(
                        (loc) => loc.value === formData.location,
                      );
                      return (
                        fallbackLocation?.label || "Ubicación seleccionada"
                      );
                    })()}
                  </p>
                </div>
              )}

              {/* Submit error */}
              {errors.submit && (
                <div className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.submit}
                </div>
              )}
            </form>
          </div>

          {/* Footer - sticky on mobile */}
          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row-reverse gap-2 sm:gap-0">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="
                w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm 
                px-4 py-2.5 sm:py-2 bg-sage text-sm font-medium text-white 
                hover:bg-sage/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage 
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
                  <span>{slot ? "Actualizar" : "Crear"}</span>
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
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage 
                sm:mt-0 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed
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
