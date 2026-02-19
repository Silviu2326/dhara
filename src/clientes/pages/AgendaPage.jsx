import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoArrowBack,
  IoCalendar,
  IoTime,
  IoMedical,
  IoLocation,
  IoCheckmarkCircle,
  IoChevronBack,
  IoChevronForward,
  IoClipboard,
} from "react-icons/io5";

const therapyTypes = [
  { id: "individual", name: "Terapia Individual", duration: 60, price: 80 },
  { id: "couples", name: "Terapia de Pareja", duration: 90, price: 120 },
  { id: "group", name: "Terapia Grupal", duration: 90, price: 60 },
  { id: "consultation", name: "Consulta Inicial", duration: 45, price: 60 },
];

const locationOptions = [
  {
    id: "presencial",
    name: "Presencial",
    icon: "location",
    description: "En consulta",
  },
  {
    id: "online",
    name: "Online",
    icon: "videocam",
    description: "Videollamada",
  },
];

const baseTimeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
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
];

const AgendaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const therapistId = searchParams.get("therapistId");

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTherapyType, setSelectedTherapyType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  const fadeAnim = useRef(null);
  const slideAnim = useRef(null);

  useEffect(() => {
    if (selectedDate && therapistId) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, therapistId, selectedTherapyType]);

  const loadAvailableSlots = async (date) => {
    try {
      setLoading(true);
      const sessionDuration =
        selectedTherapyType?.duration === 90
          ? 90
          : selectedTherapyType?.duration === 45
            ? 45
            : 60;

      const response = await fetch(
        `/api/availability/${therapistId}/${date}?duration=${sessionDuration}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const timeSlots =
          data.slots?.map((slot) => slot.startTime).sort() || [];
        setAvailableSlots(timeSlots);
      } else {
        const fallbackSlots = baseTimeSlots.filter(() => Math.random() > 0.3);
        setAvailableSlots(
          fallbackSlots.length > 0 ? fallbackSlots : baseTimeSlots.slice(0, 6),
        );
      }
    } catch (error) {
      console.error("Error loading slots:", error);
      setAvailableSlots(baseTimeSlots.slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    const dateObj = {
      date: new Date(date),
      fullDate: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("es-ES", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("es-ES", { month: "short" }),
    };
    setSelectedDate(dateObj);
    setSelectedTime(null);
  };

  const handleTimeSelection = (time) => {
    setSelectedTime(time);
  };

  const handleTherapyTypeSelection = (therapy) => {
    setSelectedTherapyType(therapy);
  };

  const handleLocationSelection = (location) => {
    setSelectedLocation(location);
  };

  const handleBookAppointment = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !selectedTherapyType ||
      !selectedLocation
    ) {
      alert("Por favor selecciona fecha, hora, tipo de terapia y modalidad.");
      return;
    }

    setLoading(true);

    try {
      const startTime = selectedTime;
      const duration = selectedTherapyType.duration;
      const [hours, minutes] = startTime.split(":").map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + duration);
      const endTime = endDate.toTimeString().slice(0, 5);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          therapistId: therapistId,
          date: selectedDate.fullDate,
          startTime,
          endTime,
          therapyType: selectedTherapyType.id,
          location: selectedLocation.id,
        }),
      });

      if (response.ok) {
        alert(
          `Cita agendada exitosamente!\n\n${selectedTherapyType.name}\n${selectedDate.dayName} ${selectedDate.dayNumber} de ${selectedDate.month} a las ${selectedTime}\nModalidad: ${selectedLocation.name}`,
        );
        navigate("/citas");
      } else {
        alert("La cita no pudo ser agendada. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Error al agendar la cita. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const getTherapyIcon = (id) => {
    switch (id) {
      case "individual":
        return "person";
      case "couples":
        return "heart";
      case "group":
        return "people";
      case "consultation":
        return "chatbubble";
      default:
        return "medical";
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EEE9]">
      <div className="bg-sage pt-12 pb-8 px-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <IoArrowBack className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Agendar Cita</h1>
          <div className="w-10"></div>
        </div>
        <p className="text-white/80 text-center">
          {therapistId
            ? "Selecciona tu cita perfecta"
            : "Selecciona tu cita perfecta"}
        </p>
      </div>

      <div className="p-6 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <IoCalendar className="w-6 h-6 text-sage" />
              <h2 className="text-lg font-bold text-deep">Selecciona fecha</h2>
            </div>
            <p className="text-sm text-muted mb-4">
              Elige el día que mejor te convenga
            </p>

            <div className="flex justify-center">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate?.date || new Date()}
                minDate={new Date()}
                maxDate={new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)}
                locale="es-ES"
                className="w-full rounded-xl border-none"
                tileClassName={({ date, view }) => {
                  if (view === "month") {
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;
                    return isWeekend ? "text-rose font-medium" : "text-deep";
                  }
                }}
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <IoTime className="w-6 h-6 text-rose" />
                  <h2 className="text-lg font-bold text-deep">
                    Selecciona hora
                  </h2>
                </div>
                <p className="text-sm text-muted mb-4">
                  Horarios disponibles para el {selectedDate.dayName}{" "}
                  {selectedDate.dayNumber} de {selectedDate.month}
                </p>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-sage border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((time, index) => (
                      <motion.button
                        key={time}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleTimeSelection(time)}
                        className={`py-3 px-4 rounded-xl font-medium transition-all ${
                          selectedTime === time
                            ? "bg-sage text-white shadow-md"
                            : "bg-[#F3EEE9] text-deep hover:bg-[#E8E3DC]"
                        }`}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedTime && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <IoMedical className="w-6 h-6 text-[#D58E6E]" />
                  <h2 className="text-lg font-bold text-deep">
                    Tipo de terapia
                  </h2>
                </div>
                <p className="text-sm text-muted mb-4">
                  Elige el tipo de sesión que necesitas
                </p>

                <div className="space-y-3">
                  {therapyTypes.map((therapy, index) => (
                    <motion.button
                      key={therapy.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleTherapyTypeSelection(therapy)}
                      className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                        selectedTherapyType?.id === therapy.id
                          ? "border-sage bg-sage/5"
                          : "border-transparent bg-[#F3EEE9]"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          selectedTherapyType?.id === therapy.id
                            ? "bg-sage"
                            : "bg-[#E8E3DC]"
                        }`}
                      >
                        <IoMedical
                          className={`w-6 h-6 ${selectedTherapyType?.id === therapy.id ? "text-white" : "text-muted"}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p
                          className={`font-semibold ${selectedTherapyType?.id === therapy.id ? "text-sage" : "text-deep"}`}
                        >
                          {therapy.name}
                        </p>
                        <p className="text-sm text-muted">
                          {therapy.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-sage">
                          €{therapy.price}
                        </p>
                        {selectedTherapyType?.id === therapy.id && (
                          <IoCheckmarkCircle className="w-5 h-5 text-sage ml-auto" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedTherapyType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <IoLocation className="w-6 h-6 text-muted" />
                  <h2 className="text-lg font-bold text-deep">Modalidad</h2>
                </div>
                <p className="text-sm text-muted mb-4">
                  ¿Cómo prefieres tu sesión?
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {locationOptions.map((location, index) => (
                    <motion.button
                      key={location.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleLocationSelection(location)}
                      className={`p-6 rounded-xl text-center transition-all ${
                        selectedLocation?.id === location.id
                          ? "bg-sage text-white shadow-md"
                          : "bg-[#F3EEE9] text-deep"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                          selectedLocation?.id === location.id
                            ? "bg-white/20"
                            : "bg-white"
                        }`}
                      >
                        <IoLocation
                          className={`w-7 h-7 ${selectedLocation?.id === location.id ? "text-white" : "text-sage"}`}
                        />
                      </div>
                      <p className="font-semibold mb-1">{location.name}</p>
                      <p
                        className={`text-xs ${selectedLocation?.id === location.id ? "text-white/80" : "text-muted"}`}
                      >
                        {location.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedDate &&
              selectedTime &&
              selectedTherapyType &&
              selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="bg-white rounded-2xl p-6 shadow-md mb-4">
                    <div className="flex items-center gap-3 mb-5">
                      <IoClipboard className="w-6 h-6 text-sage" />
                      <h2 className="text-lg font-bold text-deep">
                        Resumen de tu cita
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#F3EEE9] flex items-center justify-center">
                          <IoCalendar className="w-5 h-5 text-sage" />
                        </div>
                        <div>
                          <p className="text-xs text-muted">Fecha y hora</p>
                          <p className="font-medium text-deep">
                            {selectedDate.dayName} {selectedDate.dayNumber} de{" "}
                            {selectedDate.month} a las {selectedTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#F3EEE9] flex items-center justify-center">
                          <IoMedical className="w-5 h-5 text-rose" />
                        </div>
                        <div>
                          <p className="text-xs text-muted">Tipo de sesión</p>
                          <p className="font-medium text-deep">
                            {selectedTherapyType.name}
                          </p>
                          <p className="text-xs text-muted">
                            Duración: {selectedTherapyType.duration} min
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#F3EEE9] flex items-center justify-center">
                          <IoLocation className="w-5 h-5 text-[#D58E6E]" />
                        </div>
                        <div>
                          <p className="text-xs text-muted">Modalidad</p>
                          <p className="font-medium text-deep">
                            {selectedLocation.name}
                          </p>
                          <p className="text-xs text-muted">
                            {selectedLocation.description}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4 flex justify-between items-center">
                        <p className="font-bold text-deep">Total a pagar</p>
                        <p className="text-2xl font-bold text-sage">
                          €{selectedTherapyType.price}
                        </p>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBookAppointment}
                    disabled={loading}
                    className="w-full py-4 bg-sage text-white rounded-2xl font-bold text-lg shadow-lg shadow-sage/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <IoCheckmarkCircle className="w-6 h-6" />
                        Confirmar Cita
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-muted text-center mt-4">
                    Al confirmar tu cita aceptas nuestros términos y condiciones
                  </p>
                </motion.div>
              )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AgendaPage;
