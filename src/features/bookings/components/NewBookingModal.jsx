import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  DollarSign,
  Bell,
  MapPin,
} from "lucide-react";

const mockTherapies = [
  { id: "TH001", name: "Terapia Individual", duration: 60, price: 80 },
  { id: "TH002", name: "Terapia de Pareja", duration: 90, price: 120 },
  { id: "TH003", name: "Terapia Familiar", duration: 90, price: 100 },
  { id: "TH004", name: "Terapia de Grupo", duration: 120, price: 60 },
  { id: "TH005", name: "Consulta de Evaluación", duration: 45, price: 70 },
];

const mockLocations = [
  "Consulta 1",
  "Consulta 2",
  "Sala de Terapia Familiar",
  "Online - Google Meet",
  "Online - Zoom",
];

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

export const NewBookingModal = ({
  isOpen,
  onClose,
  onConfirm,
  availableSlots = {},
  isLoading = false,
  clients = [],
}) => {
  const [formData, setFormData] = useState({
    clientId: "",
    therapyId: "",
    date: "",
    startTime: "",
    location: "Consulta 1",
    price: "",
    notes: "",
    reminderEnabled: true,
    reminderTime: "24", // horas antes
    paymentMethod: "pending",
  });

  const [errors, setErrors] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [availableTimesForDate, setAvailableTimesForDate] = useState([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: "",
        therapyId: "",
        date: "",
        startTime: "",
        location: "Consulta 1",
        price: "",
        notes: "",
        reminderEnabled: true,
        reminderTime: "24",
        paymentMethod: "pending",
      });
      setErrors({});
      setSelectedClient(null);
      setSelectedTherapy(null);
      setAvailableTimesForDate([]);
    }
  }, [isOpen]);

  // Update available times when date changes
  useEffect(() => {
    if (formData.date) {
      const dateSlots = availableSlots[formData.date] || [];
      setAvailableTimesForDate(dateSlots);

      // Clear selected time if it's not available for the new date
      if (formData.startTime && !dateSlots.includes(formData.startTime)) {
        setFormData((prev) => ({ ...prev, startTime: "" }));
      }
    } else {
      setAvailableTimesForDate([]);
    }
  }, [formData.date, availableSlots]);

  // Update price when therapy changes
  useEffect(() => {
    if (formData.therapyId) {
      const therapy = mockTherapies.find((t) => t.id === formData.therapyId);
      if (therapy) {
        setSelectedTherapy(therapy);
        setFormData((prev) => ({ ...prev, price: therapy.price.toString() }));
      }
    } else {
      setSelectedTherapy(null);
    }
  }, [formData.therapyId]);

  // Update selected client
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find((c) => c.id === formData.clientId);
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [formData.clientId, clients]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = "Selecciona un cliente";
    }

    if (!formData.therapyId) {
      newErrors.therapyId = "Selecciona un tipo de terapia";
    }

    if (!formData.date) {
      newErrors.date = "Selecciona una fecha";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "La fecha no puede ser anterior a hoy";
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = "Selecciona una hora";
    }

    if (
      !formData.price ||
      isNaN(formData.price) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = "Introduce un precio válido";
    }

    if (!formData.location) {
      newErrors.location = "Selecciona una ubicación";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const bookingData = {
        ...formData,
        clientName: selectedClient?.name,
        clientEmail: selectedClient?.email,
        clientPhone: selectedClient?.phone,
        therapyType: selectedTherapy?.name,
        therapyDuration: selectedTherapy?.duration,
        amount: parseFloat(formData.price),
        currency: "EUR",
        status: "upcoming",
        paymentStatus: formData.paymentMethod === "pending" ? "unpaid" : "paid",
        endTime: calculateEndTime(
          formData.startTime,
          selectedTherapy?.duration || 60,
        ),
        createdAt: new Date().toISOString(),
      };

      await onConfirm(bookingData);
      onClose();
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + duration * 60000);
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <div className="mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Nueva Cita
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Programa una nueva cita con un cliente
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Cliente *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) =>
                      handleInputChange("clientId", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.clientId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {mockClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.clientId}
                    </p>
                  )}
                </div>

                {/* Terapia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Terapia *
                  </label>
                  <select
                    value={formData.therapyId}
                    onChange={(e) =>
                      handleInputChange("therapyId", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.therapyId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Seleccionar terapia...</option>
                    {mockTherapies.map((therapy) => (
                      <option key={therapy.id} value={therapy.id}>
                        {therapy.name} ({therapy.duration} min) - €
                        {therapy.price}
                      </option>
                    ))}
                  </select>
                  {errors.therapyId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.therapyId}
                    </p>
                  )}
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      min={getMinDate()}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.date ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Hora *
                    </label>
                    <select
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      disabled={!formData.date}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.startTime ? "border-red-300" : "border-gray-300"
                      }`}
                    >
                      <option value="">Seleccionar hora...</option>
                      {(availableTimesForDate.length > 0
                        ? availableTimesForDate
                        : timeSlots
                      ).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.startTime}
                      </p>
                    )}
                    {formData.date && availableTimesForDate.length === 0 && (
                      <p className="mt-1 text-sm text-yellow-600">
                        No hay horarios disponibles para esta fecha
                      </p>
                    )}
                  </div>
                </div>

                {/* Ubicación y Precio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Ubicación *
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.location ? "border-red-300" : "border-gray-300"
                      }`}
                    >
                      {mockLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-2" />
                      Precio (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.price ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.price}
                      </p>
                    )}
                  </div>
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Pago
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) =>
                      handleInputChange("clientId", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.clientId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recordatorio */}
                <div>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="reminderEnabled"
                      checked={formData.reminderEnabled}
                      onChange={(e) =>
                        handleInputChange("reminderEnabled", e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="reminderEnabled"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      <Bell className="h-4 w-4 inline mr-1" />
                      Enviar recordatorio automático
                    </label>
                  </div>

                  {formData.reminderEnabled && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enviar recordatorio
                      </label>
                      <select
                        value={formData.reminderTime}
                        onChange={(e) =>
                          handleInputChange("reminderTime", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1">1 hora antes</option>
                        <option value="2">2 horas antes</option>
                        <option value="24">24 horas antes</option>
                        <option value="48">48 horas antes</option>
                        <option value="168">1 semana antes</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Información adicional sobre la cita..."
                  />
                </div>

                {/* Resumen */}
                {selectedClient &&
                  selectedTherapy &&
                  formData.date &&
                  formData.startTime && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Resumen de la cita
                      </h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>
                          <strong>Cliente:</strong> {selectedClient.name}
                        </p>
                        <p>
                          <strong>Terapia:</strong> {selectedTherapy.name} (
                          {selectedTherapy.duration} min)
                        </p>
                        <p>
                          <strong>Fecha:</strong>{" "}
                          {new Date(formData.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p>
                          <strong>Hora:</strong> {formData.startTime} -{" "}
                          {calculateEndTime(
                            formData.startTime,
                            selectedTherapy.duration,
                          )}
                        </p>
                        <p>
                          <strong>Ubicación:</strong> {formData.location}
                        </p>
                        <p>
                          <strong>Precio:</strong> €{formData.price}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creando..." : "Crear Cita"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
