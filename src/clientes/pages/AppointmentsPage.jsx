import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoListOutline,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoCalendar,
  IoTime,
  IoLocation,
  IoPerson,
  IoDocumentText,
  IoInformationCircle,
  IoCreateOutline,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoHelpCircle,
} from "react-icons/io5";

const MOCK_APPOINTMENTS = [
  {
    _id: "1",
    date: new Date(Date.now() + 86400000).toISOString(),
    therapistName: "Dra. María García",
    type: "video",
    status: "confirmed",
    duration: 60,
  },
  {
    _id: "2",
    date: new Date(Date.now() + 172800000).toISOString(),
    therapistName: "Dr. Carlos López",
    type: "presencial",
    status: "pending",
    duration: 45,
  },
  {
    _id: "3",
    date: new Date(Date.now() - 86400000).toISOString(),
    therapistName: "Dra. Ana Martínez",
    type: "video",
    status: "completed",
    duration: 60,
  },
];

const AppointmentsPage = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const transformedAppointments = MOCK_APPOINTMENTS.map((booking) => ({
        id: booking._id,
        date: new Date(booking.date),
        time: new Date(booking.date).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        patient: booking.therapistName || "Terapeuta no asignado",
        type: booking.type === "video" ? "Video Llamada" : "Presencial",
        status: booking.status,
        notes: "Nota de prueba",
        location:
          booking.type === "video"
            ? "Consultorio Virtual"
            : "Consultorio Presencial",
        therapist: { _id: booking.therapistId, name: booking.therapistName },
        duration: booking.duration || 60,
        amount: 800,
        currency: "MXN",
      }));

      setAppointments(transformedAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  const isSameDate = (date1, date2) =>
    date1.toDateString() === date2.toDateString();

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getFilteredAppointments = () => {
    switch (filter) {
      case "past":
        return appointments.filter(
          (apt) => isPastDate(apt.date) || apt.status === "completed",
        );
      case "upcoming":
        return appointments.filter(
          (apt) =>
            !isPastDate(apt.date) &&
            apt.status !== "completed" &&
            apt.status !== "cancelled",
        );
      case "today":
        return appointments.filter((apt) => isToday(apt.date));
      default:
        return appointments;
    }
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter((apt) => isSameDate(apt.date, date));
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);
    endDate.setDate(endDate.getDate() + ((7 - endDate.getDay()) % 7));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const hasAppointments = (date) =>
    appointments.some((apt) => isSameDate(apt.date, date));

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
      case "upcoming":
        return "#8CA48F";
      case "completed":
        return "#2D3A4A";
      case "pending":
        return "#D58E6E";
      case "cancelled":
        return "#A2B2C2";
      default:
        return "#A2B2C2";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "upcoming":
        return "Próxima";
      case "completed":
        return "Completada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return "Sin estado";
    }
  };

  const handleAppointmentPress = (appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const handleCancelAppointment = async (appointment) => {
    if (window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert("La cita ha sido cancelada exitosamente");
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointment.id ? { ...apt, status: "cancelled" } : apt,
          ),
        );
        setModalVisible(false);
      } catch (err) {
        alert("Ocurrió un error al cancelar la cita");
      }
    }
  };

  const filteredAppointments = getFilteredAppointments();
  const calendarDays = generateCalendarDays();

  if (loading && !refreshing) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-deep mb-6">Mis Citas</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 flex">
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${viewMode === "calendar" ? "bg-sage text-white" : "text-sage hover:bg-sage/10"}`}
        >
          <IoCalendarOutline className="w-5 h-5" />
          <span className="font-medium">Calendario</span>
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${viewMode === "list" ? "bg-sage text-white" : "text-sage hover:bg-sage/10"}`}
        >
          <IoListOutline className="w-5 h-5" />
          <span className="font-medium">Lista</span>
        </button>
      </div>

      {viewMode === "calendar" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                const prevMonth = new Date(selectedDate);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setSelectedDate(prevMonth);
              }}
              className="p-2 rounded-lg hover:bg-sand transition-colors"
            >
              <IoChevronBack className="w-5 h-5 text-deep" />
            </button>
            <h3 className="text-lg font-bold text-deep capitalize">
              {selectedDate.toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() => {
                const nextMonth = new Date(selectedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setSelectedDate(nextMonth);
              }}
              className="p-2 rounded-lg hover:bg-sand transition-colors"
            >
              <IoChevronForward className="w-5 h-5 text-deep" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-semibold text-muted py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isSelected = isSameDate(day, selectedDate);
              const isDayToday = isToday(day);
              const dayHasAppointments = hasAppointments(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(new Date(day))}
                  className={`
                    aspect-square flex flex-col items-center justify-center p-1 rounded-lg relative transition-colors
                    ${!isCurrentMonth ? "opacity-30" : ""}
                    ${isSelected ? "bg-sage text-white" : isDayToday ? "bg-terracotta text-white" : "hover:bg-sand"}
                  `}
                >
                  <span className="text-sm font-medium">{day.getDate()}</span>
                  {dayHasAppointments && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-sage rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 mt-6 pt-4">
            <h4 className="font-bold text-deep mb-4 capitalize">
              {formatDate(selectedDate)}
            </h4>
            {getAppointmentsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getAppointmentsForDate(selectedDate).map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => handleAppointmentPress(appointment)}
                    className="w-full flex items-center gap-4 p-4 bg-sand rounded-lg hover:bg-sage/10 transition-colors text-left"
                  >
                    <span className="font-bold text-deep">
                      {appointment.time}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-deep">
                        {appointment.patient}
                      </p>
                      <p className="text-sm text-muted">{appointment.type}</p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{
                        backgroundColor: getStatusColor(appointment.status),
                      }}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4">
                No hay citas programadas para este día
              </p>
            )}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 flex">
            {["all", "today", "upcoming", "past"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-sage text-white"
                    : "text-sage hover:bg-sage/10"
                }`}
              >
                {f === "all"
                  ? "Todas"
                  : f === "today"
                    ? "Hoy"
                    : f === "upcoming"
                      ? "Próximas"
                      : "Pasadas"}
              </button>
            ))}
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {filteredAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => handleAppointmentPress(appointment)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-sand/50 transition-colors text-left"
                >
                  <div className="w-16">
                    <p className="font-bold text-deep">{appointment.time}</p>
                    <p className="text-xs text-muted">
                      {formatShortDate(appointment.date)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-deep">
                      {appointment.patient}
                    </p>
                    <p className="text-sm text-muted">{appointment.type}</p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{
                      backgroundColor: getStatusColor(appointment.status),
                    }}
                  >
                    {getStatusText(appointment.status)}
                  </span>
                  <IoChevronForward className="w-4 h-4 text-muted" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <IoCalendarOutline className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold text-deep mb-2">No hay citas</h3>
              <p className="text-muted">
                {filter === "past"
                  ? "No tienes citas pasadas"
                  : filter === "upcoming"
                    ? "No tienes citas próximas"
                    : filter === "today"
                      ? "No tienes citas para hoy"
                      : "No tienes citas programadas"}
              </p>
            </div>
          )}
        </div>
      )}

      {modalVisible && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sand rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white">
              <div></div>
              <h3 className="text-lg font-bold text-deep">
                Detalles de la Cita
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoClose className="w-5 h-5 text-deep" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-14 h-14 bg-sage rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedAppointment.patient
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-deep">
                      {selectedAppointment.patient}
                    </h4>
                    <p className="text-muted">{selectedAppointment.type}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <IoCalendar className="w-5 h-5 text-sage" />
                    <div>
                      <p className="text-sm text-muted">Fecha</p>
                      <p className="font-semibold text-deep capitalize">
                        {formatDate(selectedAppointment.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IoTime className="w-5 h-5 text-sage" />
                    <div>
                      <p className="text-sm text-muted">Hora</p>
                      <p className="font-semibold text-deep">
                        {selectedAppointment.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IoLocation className="w-5 h-5 text-sage" />
                    <div>
                      <p className="text-sm text-muted">Ubicación</p>
                      <p className="font-semibold text-deep">
                        {selectedAppointment.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IoPerson className="w-5 h-5 text-sage" />
                    <div>
                      <p className="text-sm text-muted">Terapeuta</p>
                      <p className="font-semibold text-deep">
                        {selectedAppointment.patient}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <IoDocumentText className="w-5 h-5 text-sage" />
                    <h4 className="font-bold text-deep">Notas</h4>
                  </div>
                  <p className="text-deep italic">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <IoInformationCircle className="w-5 h-5 text-sage" />
                  <h4 className="font-bold text-deep">Información adicional</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Duración estimada:</span>
                    <span className="font-semibold text-deep">
                      {selectedAppointment.duration} minutos
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Modalidad:</span>
                    <span className="font-semibold text-deep">
                      {selectedAppointment.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Costo:</span>
                    <span className="font-semibold text-deep">
                      {selectedAppointment.amount}{" "}
                      {selectedAppointment.currency}
                    </span>
                  </div>
                </div>
              </div>

              {!isPastDate(selectedAppointment.date) &&
                selectedAppointment.status !== "cancelled" &&
                selectedAppointment.status !== "completed" && (
                  <div className="space-y-3">
                    <button className="w-full bg-sage text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sage/90 transition-colors">
                      <IoCreateOutline className="w-5 h-5" />
                      Editar Cita
                    </button>
                    <button
                      onClick={() =>
                        handleCancelAppointment(selectedAppointment)
                      }
                      className="w-full bg-white border-2 border-terracotta text-terracotta py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-terracotta/10 transition-colors"
                    >
                      <IoCloseOutline className="w-5 h-5" />
                      Cancelar Cita
                    </button>
                  </div>
                )}

              {selectedAppointment.status === "cancelled" && (
                <div className="bg-orange-50 border border-terracotta p-4 rounded-xl flex items-center gap-2">
                  <IoInformationCircle className="w-5 h-5 text-terracotta" />
                  <span className="text-terracotta font-medium">
                    Esta cita ha sido cancelada
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
