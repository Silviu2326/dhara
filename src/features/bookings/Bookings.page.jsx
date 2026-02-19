import React, { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { BookingsFilter } from "./components/BookingsFilter";
import { BookingsTable } from "./components/BookingsTable";
import { BookingDetailDrawer } from "./components/BookingDetailDrawer";
import { RescheduleModal } from "./components/RescheduleModal";
import { CancelModal } from "./components/CancelModal";
import { NewBookingModal } from "./components/NewBookingModal";
import { NotificationSystem } from "./components/NotificationSystem";
import { StatusBadge } from "./components/StatusBadge";
import JustificanteModal from "./components/JustificanteModal";
import { InteractiveCalendar } from "./components/InteractiveCalendar";
import { CommunicationHub } from "./components/CommunicationHub";
import { bookingService } from "../../services/api/bookingService";
import { clientService } from "../../services/api/clientService";
import {
  Calendar,
  Clock,
  Users,
  Filter,
  Download,
  Plus,
  FileText,
  Grid3X3,
  List,
  MessageSquare,
  Eye,
  Settings,
} from "lucide-react";

// Mock data for demonstration - Updated with current dates
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const getNextWeekDate = () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek.toISOString().split("T")[0];
};

const mockBookings = [
  {
    id: "BK001",
    date: getTomorrowDate(),
    startTime: "09:00",
    endTime: "10:00",
    clientId: "CL001",
    clientName: "María García",
    clientEmail: "maria.garcia@email.com",
    clientPhone: "+34 666 123 456",
    clientAvatar: null,
    clientSince: "2023",
    therapyType: "Terapia Individual",
    therapyDuration: 60,
    status: "upcoming",
    amount: 80,
    currency: "EUR",
    paymentStatus: "paid",
    paymentMethod: "Tarjeta de crédito",
    location: "Consulta 1",
    notes:
      "Cliente con ansiedad generalizada. Continuar con técnicas de relajación.",
    meetingLink: "https://meet.google.com/abc-def-ghi",
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "BK002",
    date: getTodayDate(),
    startTime: "14:00",
    endTime: "15:30",
    clientId: "CL002",
    clientName: "Carlos Rodríguez",
    clientEmail: "carlos.rodriguez@email.com",
    clientPhone: "+34 666 789 012",
    clientAvatar: null,
    therapyType: "Terapia de Pareja",
    status: "pending",
    amount: 120,
    currency: "EUR",
    paymentStatus: "unpaid",
    location: "Consulta 2",
    notes:
      "Primera sesión de terapia de pareja. Evaluar dinámicas de comunicación.",
    createdAt: "2024-01-12T14:30:00Z",
  },
  {
    id: "BK003",
    date: getNextWeekDate(),
    startTime: "16:00",
    endTime: "17:00",
    clientId: "CL003",
    clientName: "Ana López",
    clientEmail: "ana.lopez@email.com",
    clientPhone: "+34 666 345 678",
    clientAvatar: null,
    therapyType: "Terapia Familiar",
    status: "completed",
    amount: 100,
    currency: "EUR",
    paymentStatus: "paid",
    paymentMethod: "Transferencia",
    location: "Consulta 1",
    notes: "Sesión completada. Buen progreso en la comunicación familiar.",
    sessionDocument: "session_003.pdf",
    createdAt: "2024-01-08T09:15:00Z",
  },
  {
    id: "BK004",
    date: getTodayDate(),
    startTime: "10:00",
    endTime: "11:00",
    clientId: "CL004",
    clientName: "Pedro Martín",
    clientEmail: "pedro.martin@email.com",
    clientPhone: "+34 666 901 234",
    clientAvatar: null,
    therapyType: "Terapia Individual",
    status: "completed",
    amount: 80,
    currency: "EUR",
    paymentStatus: "refunded",
    location: "Consulta 1",
    notes: "Cancelado por el cliente por motivos de salud.",
    createdAt: "2024-01-05T16:45:00Z",
  },
  {
    id: "BK005",
    date: getTomorrowDate(),
    startTime: "15:00",
    endTime: "16:00",
    clientId: "CL005",
    clientName: "Laura Fernández",
    clientEmail: "laura.fernandez@email.com",
    clientPhone: "+34 666 567 890",
    clientAvatar: null,
    therapyType: "Terapia Individual",
    status: "upcoming",
    amount: 80,
    currency: "EUR",
    paymentStatus: "paid",
    paymentMethod: "Tarjeta de crédito",
    location: "Consulta 2",
    notes: "Cliente no se presentó a la cita sin previo aviso.",
    createdAt: "2024-01-07T11:20:00Z",
  },
];

// Mock available slots for scheduling - Dynamic dates (will be replaced by API call)
const generateAvailableSlots = () => {
  const slots = {};
  const today = new Date();

  // Generar slots para los próximos 30 días
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // Horarios disponibles (simulados)
    const availableTimes = [
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
    ];

    // Remover algunos horarios aleatoriamente para simular ocupación
    const randomSlots = availableTimes.filter(() => Math.random() > 0.3);
    slots[dateStr] = randomSlots;
  }

  return slots;
};

const mockAvailableSlots = generateAvailableSlots();

// Function to check availability using booking service
const checkAvailabilityWithService = async (
  therapistId,
  dateTime,
  duration,
  locationId,
) => {
  try {
    const availability = await bookingService.checkAvailability(
      therapistId || "default_therapist",
      dateTime,
      duration || 60,
      locationId,
      {
        includeReasons: true,
        timezone: "UTC",
      },
    );
    return availability;
  } catch (error) {
    console.error("Error checking availability:", error);
    // Fallback to mock data
    return { available: true, conflicts: [] };
  }
};

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isJustificanteModalOpen, setIsJustificanteModalOpen] = useState(false);
  const [bookingForJustificante, setBookingForJustificante] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("desktop"); // desktop | mobile
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // New UI state for enhanced features
  const [activeView, setActiveView] = useState("table"); // table | calendar | communication
  const [calendarView, setCalendarView] = useState("week"); // month | week | day
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [selectedClientForComm, setSelectedClientForComm] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    dateRange: { start: null, end: null },
    status: "all",
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "asc",
  });

  // Initialize services and load data
  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        setIsLoading(true);

        // Initialize services
        await bookingService.initialize();
        await clientService.initialize();

        // Load bookings
        const response = await bookingService.getAppointments(
          {},
          {
            decryptSensitiveData: true,
            includeHistory: false,
            includeReminders: true,
          },
        );

        console.log("🔍 Bookings.page.jsx - Raw response:", response);
        console.log(
          "🔍 Bookings.page.jsx - Response.appointments:",
          response.appointments,
        );
        console.log(
          "🔍 Bookings.page.jsx - First appointment sample:",
          response.appointments?.[0],
        );

        // Transform the response to match the component's expected format
        const transformedBookings = response.appointments.map(
          (appointment) => ({
            id: appointment.appointmentId || appointment.id || appointment._id,
            date: appointment.date
              ? new Date(appointment.date).toISOString().split("T")[0]
              : "",
            startTime: appointment.startTime || "",
            endTime: appointment.endTime || "",
            clientId: appointment.clientId,
            clientName:
              appointment.clientName ||
              appointment.client?.name ||
              `Cliente ${appointment.clientId?.toString().slice(-4) || ""}`,
            clientEmail:
              appointment.clientEmail || appointment.client?.email || "",
            clientPhone:
              appointment.clientPhone || appointment.client?.phone || "",
            clientAvatar:
              appointment.clientAvatar || appointment.client?.avatar || null,
            therapyType:
              appointment.therapyType ||
              appointment.type ||
              "Terapia Individual",
            therapyDuration:
              appointment.therapyDuration || appointment.duration || 60,
            status: appointment.status,
            amount: appointment.amount || 0,
            currency: appointment.currency || "EUR",
            paymentStatus: appointment.paymentStatus || "pending",
            paymentMethod: appointment.paymentMethod || "",
            location: appointment.locationId || "Consulta 1",
            notes: appointment.notes || "",
            meetingLink: appointment.meetingLink || null,
            createdAt: appointment.createdAt,
          }),
        );

        setBookings(transformedBookings);

        // Load clients
        setIsLoadingClients(true);
        const clientsResponse = await clientService.getClients(
          {},
          {
            decryptSensitiveData: false,
            includeStatistics: false,
          },
        );

        console.log(
          "👥 Bookings.page.jsx - Clients loaded:",
          clientsResponse.clients?.length || 0,
        );

        if (clientsResponse.clients) {
          setClients(clientsResponse.clients);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to mock data if API fails
        setBookings(mockBookings);
      } finally {
        setIsLoading(false);
        setIsLoadingClients(false);
      }
    };

    initializeAndLoadData();
  }, []);

  // Check screen size for responsive view
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth < 768 ? "mobile" : "desktop");
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Auto-update booking statuses based on current date/time
  useEffect(() => {
    const updateBookingStatuses = () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      setBookings((prev) =>
        prev.map((booking) => {
          const bookingDate = booking.date;
          const bookingEndTime = booking.endTime;

          // Si la cita ya está completada, cancelada o marcada como no asistió, no cambiar
          if (["completed", "cancelled", "no_show"].includes(booking.status)) {
            return booking;
          }

          // Si la fecha de la cita es anterior a hoy, marcar como no asistió (si no está completada)
          if (bookingDate < currentDate) {
            return { ...booking, status: "no_show" };
          }

          // Si es hoy y la hora ya pasó, marcar como no asistió
          if (bookingDate === currentDate && bookingEndTime < currentTime) {
            return { ...booking, status: "no_show" };
          }

          // Si es hoy o futuro, marcar como próxima
          if (bookingDate >= currentDate) {
            return { ...booking, status: "upcoming" };
          }

          return booking;
        }),
      );
    };

    // Ejecutar al cargar y cada 5 minutos
    updateBookingStatuses();
    const interval = setInterval(updateBookingStatuses, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...bookings];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.clientName.toLowerCase().includes(searchLower) ||
          booking.id.toLowerCase().includes(searchLower) ||
          booking.therapyType.toLowerCase().includes(searchLower),
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status === filters.status,
      );
    }

    // Apply date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return (
          bookingDate >= filters.dateRange.start &&
          bookingDate <= filters.dateRange.end
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "date") {
        aValue = new Date(`${a.date}T${a.startTime}`);
        bValue = new Date(`${b.date}T${b.startTime}`);
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredBookings(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [bookings, filters, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = {
    total: bookings.length,
    upcoming: bookings.filter((b) => b.status === "upcoming").length,
    completed: bookings.filter((b) => {
      const today = new Date().toISOString().split("T")[0];
      return b.date === today;
    }).length,
  };

  // Event handlers
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsDetailDrawerOpen(true);
  };

  const handleReschedule = (booking) => {
    setBookingToReschedule(booking);
    setIsRescheduleModalOpen(true);
    setIsDetailDrawerOpen(false);
  };

  const handleCancel = (booking) => {
    setBookingToCancel(booking);
    setIsCancelModalOpen(true);
    setIsDetailDrawerOpen(false);
  };

  const handleStartChat = (booking) => {
    // Implementar funcionalidad de chat
    const message = `Hola ${booking.clientName}, te escribo desde la clínica para confirmar tu cita del ${new Date(booking.date).toLocaleDateString("es-ES")} a las ${booking.startTime}. ¿Necesitas algún cambio o tienes alguna pregunta?`;

    // Simular apertura de chat o WhatsApp
    if (booking.clientPhone) {
      const phoneNumber = booking.clientPhone.replace(/\D/g, ""); // Remover caracteres no numéricos
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } else {
      // Fallback: copiar mensaje al portapapeles
      navigator.clipboard
        .writeText(message)
        .then(() => {
          alert("Mensaje copiado al portapapeles");
        })
        .catch(() => {
          console.log("Mensaje para enviar:", message);
          alert("No se pudo copiar el mensaje. Revisa la consola.");
        });
    }
  };

  const handleJoinMeet = (booking) => {
    if (booking.meetingLink) {
      window.open(booking.meetingLink, "_blank");
    }
  };

  const handleGenerateJustificante = (booking) => {
    setBookingForJustificante(booking);
    setIsJustificanteModalOpen(true);
    setIsDetailDrawerOpen(false);
  };

  const handleMarkCompleted = async (booking) => {
    setIsLoading(true);
    try {
      // Update appointment status using booking service
      const response = await bookingService.updateAppointment(
        booking.id,
        { status: bookingService.appointmentStates.COMPLETED },
        {
          encryptSensitiveData: true,
          notifyParties: false,
          syncExternalCalendar: false,
          createAuditLog: true,
          incrementVersion: true,
        },
      );

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: "completed" } : b,
        ),
      );

      setIsDetailDrawerOpen(false);
      console.log("Booking marked as completed:", response);
    } catch (error) {
      console.error("Error marking booking as completed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReschedule = async (rescheduleData) => {
    setIsLoading(true);
    try {
      // Prepare update data for the API
      const updates = {
        dateTime: `${rescheduleData.newDate}T${rescheduleData.newTime}:00`,
        notes: rescheduleData.reason
          ? `Reprogramado: ${rescheduleData.reason}`
          : undefined,
      };

      // Update appointment using booking service
      const response = await bookingService.updateAppointment(
        rescheduleData.bookingId,
        updates,
        {
          encryptSensitiveData: true,
          notifyParties: true,
          syncExternalCalendar: false,
          createAuditLog: true,
          incrementVersion: true,
        },
      );

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rescheduleData.bookingId
            ? {
                ...b,
                date: rescheduleData.newDate,
                startTime: rescheduleData.newTime,
                status: response.status || "rescheduled",
                notes: updates.notes || b.notes,
              }
            : b,
        ),
      );

      console.log("Booking rescheduled successfully:", response);
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCancel = async (cancelData) => {
    setIsLoading(true);
    try {
      // Cancel appointment using booking service
      const response = await bookingService.cancelAppointment(
        cancelData.bookingId,
        {
          reason: cancelData.reason || "client_request",
          notifyParties: true,
          cancelReminders: true,
          refundAmount: cancelData.refundAmount || null,
          createAuditLog: true,
        },
      );

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelData.bookingId
            ? {
                ...b,
                status: response.status || "cancelled",
                notes: `${b.notes || ""} | Cancelado: ${cancelData.reason}`,
              }
            : b,
        ),
      );

      console.log("Booking cancelled successfully:", response);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      dateRange: { start: null, end: null },
      status: "all",
    });
  };

  const handleExport = () => {
    // Implementar funcionalidad de exportación
    const csvData = [
      [
        "ID",
        "Fecha",
        "Hora",
        "Cliente",
        "Email",
        "Teléfono",
        "Terapia",
        "Estado",
        "Precio",
        "Ubicación",
        "Notas",
      ],
      ...filteredBookings.map((booking) => [
        booking.id,
        booking.date,
        `${booking.startTime} - ${booking.endTime}`,
        booking.clientName,
        booking.clientEmail,
        booking.clientPhone,
        booking.therapyType,
        booking.status,
        `€${booking.amount}`,
        booking.location,
        booking.notes || "",
      ]),
    ];

    const csvContent = csvData
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reservas_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("Datos de reservas exportados exitosamente");
  };

  const handleNewBooking = () => {
    setIsNewBookingModalOpen(true);
  };

  const handleConfirmNewBooking = async (bookingData) => {
    setIsLoading(true);
    try {
      // Transform bookingData to match API format
      const appointmentData = {
        clientId: bookingData.clientId,
        therapistId: bookingData.therapistId || "default_therapist",
        dateTime: `${bookingData.date}T${bookingData.startTime}:00`,
        endTime: bookingData.endTime,
        duration: bookingData.therapyDuration || 60,
        type: bookingData.therapyType || "therapy_session",
        locationId: bookingData.location || "default_location",
        amount: bookingData.amount || 0,
        currency: bookingData.currency || "EUR",
        notes: bookingData.notes || "",
        reminderPreferences: bookingData.reminderEnabled ? ["email"] : [],
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
      };

      // Create appointment using booking service
      const response = await bookingService.createAppointment(appointmentData, {
        encryptSensitiveData: true,
        validateAvailability: true,
        sendConfirmation: true,
        createReminders: bookingData.reminderEnabled,
        syncExternalCalendar: false,
        requireConsentValidation: false,
      });

      // Transform response to component format
      const newBooking = {
        id: response.appointmentId || response.id,
        date: response.dateTime
          ? response.dateTime.split("T")[0]
          : bookingData.date,
        startTime: response.dateTime
          ? response.dateTime.split("T")[1]?.substring(0, 5)
          : bookingData.startTime,
        endTime: bookingData.endTime,
        clientId: response.clientId,
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
        clientAvatar: null,
        therapyType: bookingData.therapyType,
        therapyDuration: bookingData.therapyDuration,
        status: response.status || "scheduled",
        amount: response.amount || bookingData.amount,
        currency: response.currency || "EUR",
        paymentStatus: "pending",
        paymentMethod: "",
        location: bookingData.location,
        notes: bookingData.notes,
        meetingLink: null,
        createdAt: response.createdAt || new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);

      console.log("Nueva cita creada exitosamente:", response);
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Function to refresh bookings from API
  const refreshBookings = async () => {
    try {
      setIsLoading(true);
      const response = await bookingService.getAppointments(
        {},
        {
          decryptSensitiveData: true,
          includeHistory: false,
          includeReminders: true,
        },
      );

      const transformedBookings = response.appointments.map((appointment) => ({
        id: appointment.appointmentId || appointment.id,
        date: appointment.dateTime ? appointment.dateTime.split("T")[0] : "",
        startTime: appointment.dateTime
          ? appointment.dateTime.split("T")[1]?.substring(0, 5)
          : "",
        endTime: appointment.endTime || "",
        clientId: appointment.clientId,
        clientName: appointment.clientName || "Cliente",
        clientEmail: appointment.clientEmail || "",
        clientPhone: appointment.clientPhone || "",
        clientAvatar: appointment.clientAvatar || null,
        therapyType: appointment.type || "Terapia Individual",
        therapyDuration: appointment.duration || 60,
        status: appointment.status,
        amount: appointment.amount || 0,
        currency: appointment.currency || "EUR",
        paymentStatus: appointment.paymentStatus || "pending",
        paymentMethod: appointment.paymentMethod || "",
        location: appointment.locationId || "Consulta 1",
        notes: appointment.notes || "",
        meetingLink: appointment.meetingLink || null,
        createdAt: appointment.createdAt,
      }));

      setBookings(transformedBookings);
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced handlers for new features
  const handleStatusChange = async (bookingId, newStatus, reason = "") => {
    setIsLoading(true);
    try {
      // Update status using booking service
      await bookingService.updateAppointment(
        bookingId,
        { status: newStatus },
        {
          encryptSensitiveData: true,
          notifyParties: false,
          syncExternalCalendar: false,
          createAuditLog: true,
          incrementVersion: true,
        },
      );

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: newStatus,
                lastStatusChange: new Date().toISOString(),
              }
            : booking,
        ),
      );

      console.log(`Status changed for ${bookingId}: ${newStatus} (${reason})`);
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (booking) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Reminder sent to:", booking.clientName);
      return true;
    } catch (error) {
      console.error("Error sending reminder:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientCheckIn = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      handleStatusChange(
        bookingId,
        "client_arrived",
        "Cliente realizó check-in",
      );
    }
  };

  const handleBookingUpdate = (updatedBooking) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id ? updatedBooking : booking,
      ),
    );
  };

  const handleCalendarBookingCreate = (newBooking) => {
    const bookingWithId = {
      ...newBooking,
      id: `BK${(bookings.length + 1).toString().padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [bookingWithId, ...prev]);
  };

  const handleOpenCommunication = async (booking) => {
    try {
      // Find client in loaded clients or fetch from service
      let clientData = clients.find((client) => client.id === booking.clientId);

      if (!clientData && booking.clientId) {
        console.log(
          "🔍 Fetching client data from service for:",
          booking.clientId,
        );
        const clientResponse = await clientService.getClient(booking.clientId, {
          decryptSensitiveData: false,
          includeStatistics: true,
        });

        if (clientResponse) {
          clientData = clientResponse;
          // Add to clients list for future use
          setClients((prev) => [...prev, clientResponse]);
        }
      }

      // Combine booking and client data
      const enrichedBooking = {
        ...booking,
        clientData: clientData || null,
        clientPhone: clientData?.phone || booking.clientPhone,
        clientEmail: clientData?.email || booking.clientEmail,
        clientName: clientData?.name || booking.clientName,
        clientAvatar: clientData?.avatar || booking.clientAvatar,
      };

      console.log("💬 Opening communication for:", {
        clientId: booking.clientId,
        clientName: enrichedBooking.clientName,
        hasClientData: !!clientData,
      });

      setSelectedClientForComm(enrichedBooking);
      setCommunicationOpen(true);
    } catch (error) {
      console.error("Error loading client data for communication:", error);
      // Fallback to basic booking data
      setSelectedClientForComm(booking);
      setCommunicationOpen(true);
    }
  };

  const handleSendMessage = (clientId, message) => {
    console.log("Message sent to client:", clientId, message);
  };

  const handleMakeCall = (clientId, type) => {
    console.log(`${type} call initiated to client:`, clientId);
  };

  const handleMarkPaid = async (bookingId, method) => {
    setIsLoading(true);
    try {
      // Update payment status using booking service
      const response = await bookingService.updateAppointment(
        bookingId,
        {
          paymentStatus: "paid",
          paymentMethod: method,
        },
        {
          encryptSensitiveData: true,
          notifyParties: false,
          syncExternalCalendar: false,
          createAuditLog: true,
          incrementVersion: true,
        },
      );

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, paymentStatus: "paid", paymentMethod: method }
            : b,
        ),
      );

      console.log(`Booking ${bookingId} marked as paid via ${method}`);
    } catch (error) {
      console.error("Error marking booking as paid:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Gestión de Reservas
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Administra las citas y reservas de tus clientes
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2 sm:space-x-3">
            <NotificationSystem bookings={bookings} />
            <button
              onClick={() => setCommunicationOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
              title="Centro de Comunicación"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={handleNewBooking}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </button>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto w-full sm:w-auto">
            {[
              { key: "table", label: "Lista", icon: List },
              { key: "calendar", label: "Calendario", icon: Grid3X3 },
            ].map((view) => {
              const IconComponent = view.icon;
              return (
                <button
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  className={`flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeView === view.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-1 sm:mr-2" />
                  {view.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center px-3 py-2 text-sm border rounded-md transition-colors w-full sm:w-auto justify-center ${
                showAdvancedFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Settings className="h-4 w-4 mr-1" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats - Always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Total de Citas
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Próximas
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats.upcoming}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Reservas Hoy
                  </dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {stats.completed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {(activeView === "table" || showAdvancedFilters) && (
        <Card>
          <div className="p-4 sm:p-6">
            <BookingsFilter
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              totalBookings={filteredBookings.length}
              bookings={bookings}
              loading={isLoading}
            />
          </div>
        </Card>
      )}

      {/* Main Content Based on Active View */}
      {activeView === "table" && (
        <Card>
          <div className="overflow-hidden">
            <BookingsTable
              bookings={paginatedBookings}
              viewMode={viewMode}
              sortConfig={sortConfig}
              onSort={handleSort}
              onBookingClick={handleBookingClick}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onStartChat={handleOpenCommunication}
              onJoinMeet={handleJoinMeet}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                  <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                    {startIndex + 1} a{" "}
                    {Math.min(endIndex, filteredBookings.length)} de{" "}
                    {filteredBookings.length}
                  </div>
                  <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ant.
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page =
                        Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                        i;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium ${
                            page === currentPage
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sig.
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Calendar View */}
      {activeView === "calendar" && (
        <InteractiveCalendar
          bookings={filteredBookings}
          view={calendarView}
          selectedDate={new Date()}
          onBookingClick={handleBookingClick}
          onBookingUpdate={handleBookingUpdate}
          onBookingCreate={handleCalendarBookingCreate}
          onBookingDelete={(bookingId) => {
            setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          }}
        />
      )}

      {/* Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        onStartChat={handleStartChat}
        onJoinMeet={handleJoinMeet}
        onMarkCompleted={handleMarkCompleted}
        onGenerateJustificante={handleGenerateJustificante}
        onEditNotes={(booking) => console.log("Edit notes for:", booking.id)}
        onViewClient={(clientId) => console.log("View client:", clientId)}
        onViewSession={(sessionDoc) => console.log("View session:", sessionDoc)}
        onMarkPaid={handleMarkPaid}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        booking={bookingToReschedule}
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setBookingToReschedule(null);
        }}
        onConfirm={handleConfirmReschedule}
        availableSlots={mockAvailableSlots}
        isLoading={isLoading}
      />

      {/* Cancel Modal */}
      <CancelModal
        booking={bookingToCancel}
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setBookingToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        isLoading={isLoading}
      />

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        onConfirm={handleConfirmNewBooking}
        availableSlots={mockAvailableSlots}
        isLoading={isLoading}
        clients={clients}
      />

      {/* Justificante Modal */}
      <JustificanteModal
        booking={bookingForJustificante}
        isOpen={isJustificanteModalOpen}
        onClose={() => {
          setIsJustificanteModalOpen(false);
          setBookingForJustificante(null);
        }}
      />

      {/* Communication Hub Modal */}
      {communicationOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="communication-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setCommunicationOpen(false)}
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-lg font-medium text-gray-900"
                    id="communication-title"
                  >
                    Centro de Comunicación
                  </h3>
                  <button
                    onClick={() => setCommunicationOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <CommunicationHub
                  selectedBooking={selectedClientForComm}
                  bookings={bookings}
                  clients={clients}
                  isLoadingClients={isLoadingClients}
                  onSendMessage={handleSendMessage}
                  onMakeCall={handleMakeCall}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
