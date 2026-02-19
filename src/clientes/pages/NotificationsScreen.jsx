import React, { useState, useEffect } from "react";
import {
  IoNotificationsOutline,
  IoNotifications,
  IoCalendarOutline,
  IoChatbubbleOutline,
  IoDocumentTextOutline,
  IoCardOutline,
  IoSettingsOutline,
  IoCheckmarkCircle,
  IoTrashOutline,
  IoRefresh,
  IoClose,
  IoChevronForward,
  IoEllipse,
} from "react-icons/io5";

const MOCK_NOTIFICATIONS = [
  {
    _id: "notif-1",
    type: "appointment",
    title: "Recordatorio de cita",
    message: "Tu cita con la Dra. Ana García es mañana a las 10:00 AM",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    source: "Sistema",
    actionUrl: "/app/citas",
  },
  {
    _id: "notif-2",
    type: "message",
    title: "Nuevo mensaje",
    message:
      "La Dra. María García te ha enviado un mensaje sobre tu tratamiento",
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    source: "Dra. María García",
    actionUrl: "/app/chat",
  },
  {
    _id: "notif-3",
    type: "document",
    title: "Nuevo documento compartido",
    message: "La Dra. Ana García ha compartido 'Plan de Tratamiento' contigo",
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    source: "Dra. Ana García",
    actionUrl: "/app/documentos",
  },
  {
    _id: "notif-4",
    type: "appointment",
    title: "Cita confirmada",
    message:
      "Tu cita con el Dr. Carlos Ruiz ha sido confirmada para el 25 de febrero",
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    source: "Sistema",
    actionUrl: "/app/citas",
  },
  {
    _id: "notif-5",
    type: "payment",
    title: "Pago procesado",
    message:
      "Tu pago de $80.00 por la sesión del 15 de febrero ha sido procesado",
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    source: "Sistema",
    actionUrl: "/app/pagos",
  },
  {
    _id: "notif-6",
    type: "system",
    title: "Bienvenido a Dharaterapeutas",
    message:
      "Gracias por registrarte. Explora nuestros servicios y encuentra al terapeuta ideal",
    isRead: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    source: "Sistema",
    actionUrl: "/app/terapeutas",
  },
];

const NOTIFICATION_TYPES = [
  { value: "all", label: "Todas", icon: IoNotificationsOutline },
  { value: "appointment", label: "Citas", icon: IoCalendarOutline },
  { value: "message", label: "Mensajes", icon: IoChatbubbleOutline },
  { value: "document", label: "Documentos", icon: IoDocumentTextOutline },
  { value: "payment", label: "Pagos", icon: IoCardOutline },
  { value: "system", label: "Sistema", icon: IoSettingsOutline },
];

const NotificationsScreen = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment":
        return IoCalendarOutline;
      case "message":
        return IoChatbubbleOutline;
      case "document":
        return IoDocumentTextOutline;
      case "payment":
        return IoCardOutline;
      default:
        return IoSettingsOutline;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "appointment":
        return "bg-sage";
      case "message":
        return "bg-blue-500";
      case "document":
        return "bg-terracotta";
      case "payment":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes <= 1 ? "Hace un momento" : `Hace ${minutes} minutos`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return days === 1 ? "Ayer" : `Hace ${days} días`;
    }

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchNotifications = async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setNotifications(MOCK_NOTIFICATIONS);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("No se pudieron cargar las notificaciones");
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchNotifications();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && !refreshing) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <IoClose className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            Error al cargar notificaciones
          </h2>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            <IoRefresh className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-deep">Notificaciones</h1>
          <p className="text-muted mt-1">
            {unreadCount > 0
              ? `${unreadCount} notificación${unreadCount !== 1 ? "s" : ""} sin leer`
              : "Sin notificaciones nuevas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage/90 transition-colors text-sm"
            >
              <IoCheckmarkCircle className="w-4 h-4" />
              Marcar todo como leído
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-2 text-muted hover:text-sage transition-colors"
            title="Actualizar"
          >
            <IoRefresh
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {NOTIFICATION_TYPES.map((type) => {
          const Icon = type.icon;
          const count =
            type.value === "all"
              ? notifications.length
              : notifications.filter((n) => n.type === type.value).length;

          return (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type.value
                  ? "bg-sage text-white"
                  : "bg-white text-muted hover:bg-sand hover:text-sage border border-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label}
              {count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    filterType === type.value
                      ? "bg-white/20 text-white"
                      : "bg-sand text-sage"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IoNotificationsOutline className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            {filterType === "all"
              ? "Sin notificaciones"
              : `Sin notificaciones de ${NOTIFICATION_TYPES.find((t) => t.value === filterType)?.label.toLowerCase()}`}
          </h2>
          <p className="text-muted mb-6">
            {filterType === "all"
              ? "Las notificaciones de tus citas, mensajes y documentos aparecerán aquí."
              : "No tienes notificaciones de este tipo."}
          </p>
          {filterType !== "all" && (
            <button
              onClick={() => setFilterType("all")}
              className="inline-flex items-center bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
            >
              Ver todas las notificaciones
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconBgColor = getNotificationColor(notification.type);

            return (
              <div
                key={notification._id}
                onClick={() => setSelectedNotification(notification)}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? "border-l-4 border-l-sage" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-deep truncate">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <IoEllipse className="w-3 h-3 text-sage flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <IoChevronForward className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">
                          {formatDate(notification.createdAt)}
                        </span>
                        <span className="text-xs text-muted">
                          • {notification.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1.5 text-sage hover:bg-sand rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <IoCheckmarkCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredNotifications.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={clearAllNotifications}
            className="text-sm text-muted hover:text-red-500 transition-colors"
          >
            Eliminar todas las notificaciones
          </button>
        </div>
      )}

      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-sand rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-deep">
                Detalle de Notificación
              </h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoClose className="w-5 h-5 text-deep" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-full ${getNotificationColor(
                    selectedNotification.type,
                  )} flex items-center justify-center`}
                >
                  {React.createElement(
                    getNotificationIcon(selectedNotification.type),
                    { className: "w-7 h-7 text-white" },
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-deep mb-1">
                    {selectedNotification.title}
                  </h4>
                  <p className="text-sm text-muted">
                    {selectedNotification.source} •{" "}
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-6">
                <p className="text-deep">{selectedNotification.message}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!selectedNotification.isRead && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification._id);
                      setSelectedNotification(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-sage text-white px-4 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
                  >
                    <IoCheckmarkCircle className="w-5 h-5" />
                    Marcar como leída
                  </button>
                )}
                {selectedNotification.actionUrl && (
                  <a
                    href={selectedNotification.actionUrl}
                    className="flex-1 flex items-center justify-center gap-2 bg-sage text-white px-4 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
                  >
                    Ir a{" "}
                    {
                      NOTIFICATION_TYPES.find(
                        (t) => t.value === selectedNotification.type,
                      )?.label
                    }
                    <IoChevronForward className="w-5 h-5" />
                  </a>
                )}
                <button
                  onClick={() => {
                    deleteNotification(selectedNotification._id);
                    setSelectedNotification(null);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  <IoTrashOutline className="w-5 h-5" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
