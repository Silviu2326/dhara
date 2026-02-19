import React, { useState, useEffect } from "react";
import {
  IoCardOutline,
  IoRefresh,
  IoChevronForward,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoCloseCircle,
  IoCalendarOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoDownloadOutline,
} from "react-icons/io5";

const MOCK_PAYMENTS = [
  {
    _id: "pay-1",
    amount: 60,
    status: "completed",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: "Sesión de Terapia Individual",
    method: "card",
    methodDetail: "Visa terminada en 4242",
    therapist: { name: "Dra. María García" },
    booking: {
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      serviceType: "Terapia Individual",
    },
  },
  {
    _id: "pay-2",
    amount: 60,
    status: "completed",
    date: new Date(Date.now() - 86400000 * 9).toISOString(),
    description: "Sesión de Terapia Individual",
    method: "card",
    methodDetail: "Visa terminada en 4242",
    therapist: { name: "Dra. Ana Martínez" },
    booking: {
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      serviceType: "Terapia Individual",
    },
  },
  {
    _id: "pay-3",
    amount: 80,
    status: "pending",
    date: new Date(Date.now() - 86400000).toISOString(),
    description: "Sesión de Terapia Familiar",
    method: "card",
    methodDetail: "Mastercard terminada en 5555",
    therapist: { name: "Dr. Carlos López" },
    booking: {
      date: new Date(Date.now() + 86400000).toISOString(),
      serviceType: "Terapia Familiar",
    },
  },
  {
    _id: "pay-4",
    amount: 45,
    status: "completed",
    date: new Date(Date.now() - 86400000 * 16).toISOString(),
    description: "Sesión de Terapia Online",
    method: "paypal",
    methodDetail: "PayPal",
    therapist: { name: "Dra. Laura Sánchez" },
    booking: {
      date: new Date(Date.now() - 86400000 * 16).toISOString(),
      serviceType: "Terapia Online",
    },
  },
  {
    _id: "pay-5",
    amount: 60,
    status: "failed",
    date: new Date(Date.now() - 86400000 * 23).toISOString(),
    description: "Sesión de Terapia Individual",
    method: "card",
    methodDetail: "Visa terminada en 1234",
    therapist: { name: "Dra. María García" },
    booking: null,
  },
];

const PaymentHistoryScreen = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount, currency = "EUR") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
          dot: "bg-green-500",
        };
      case "pending":
        return {
          bg: "bg-amber-100",
          text: "text-amber-600",
          dot: "bg-amber-500",
        };
      case "failed":
        return { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-500" };
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Completado";
      case "pending":
        return "Pendiente";
      case "failed":
        return "Fallido";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return IoCheckmarkCircle;
      case "pending":
        return IoTimeOutline;
      case "failed":
        return IoCloseCircle;
      default:
        return IoTimeOutline;
    }
  };

  const getMethodIcon = (method) => {
    return IoCardOutline;
  };

  const fetchPayments = async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPayments(MOCK_PAYMENTS);

      const totalSpent = MOCK_PAYMENTS.filter(
        (p) => p.status === "completed",
      ).reduce((sum, p) => sum + p.amount, 0);
      const totalPayments = MOCK_PAYMENTS.filter(
        (p) => p.status === "completed",
      ).length;
      const pendingPayments = MOCK_PAYMENTS.filter(
        (p) => p.status === "pending",
      ).length;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlySpent = MOCK_PAYMENTS.filter(
        (p) => p.status === "completed" && new Date(p.date) >= startOfMonth,
      ).reduce((sum, p) => sum + p.amount, 0);

      setSummary({
        totalSpent,
        totalPayments,
        monthlySpent,
        pendingPayments,
        currency: "EUR",
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("No se pudieron cargar los pagos");
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchPayments();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredPayments = payments
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .filter(
      (p) =>
        searchQuery === "" ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.therapist?.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const handleDownloadReceipt = (payment) => {
    alert(`Descargando recibo para pago ${payment._id}...`);
  };

  if (loading && !refreshing) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Cargando historial de pagos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <IoCloseCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            Error al cargar pagos
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
          <h1 className="text-3xl font-bold text-deep">Historial de Pagos</h1>
          <p className="text-muted mt-1">
            {payments.length > 0
              ? `${payments.length} pago${payments.length !== 1 ? "s" : ""} en total`
              : "Sin pagos registrados"}
          </p>
        </div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
              <IoCardOutline className="w-5 h-5 text-sage" />
            </div>
            <div>
              <p className="text-2xl font-bold text-deep">
                {formatCurrency(summary.totalSpent || 0)}
              </p>
              <p className="text-xs text-muted">Total Gastado</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <IoCheckmarkCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-deep">
                {summary.totalPayments || 0}
              </p>
              <p className="text-xs text-muted">Pagos Realizados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <IoCalendarOutline className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-deep">
                {formatCurrency(summary.monthlySpent || 0)}
              </p>
              <p className="text-xs text-muted">Este Mes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <IoTimeOutline className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-deep">
                {summary.pendingPayments || 0}
              </p>
              <p className="text-xs text-muted">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Buscar por descripción o terapeuta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-deep focus:outline-none focus:ring-2 focus:ring-sage/50"
            />
          </div>
          <div className="flex gap-2">
            {["all", "completed", "pending", "failed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-sage text-white"
                    : "bg-sand text-muted hover:bg-sage/10 hover:text-sage"
                }`}
              >
                {status === "all" ? "Todos" : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IoCardOutline className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            {searchQuery || filterStatus !== "all"
              ? "Sin resultados"
              : "Sin pagos aún"}
          </h2>
          <p className="text-muted">
            {searchQuery || filterStatus !== "all"
              ? "No se encontraron pagos con los filtros aplicados."
              : "Los pagos por tus sesiones de terapia aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const StatusIcon = getStatusIcon(payment.status);
            const statusColors = getStatusColor(payment.status);

            return (
              <div
                key={payment._id}
                onClick={() => setSelectedPayment(payment)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${statusColors.bg} flex items-center justify-center`}
                    >
                      <StatusIcon className={`w-5 h-5 ${statusColors.text}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted">
                        {formatDate(payment.date)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}
                        ></span>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-deep">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted">{payment.methodDetail}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-sm font-medium text-deep mb-2">
                    {payment.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted">
                    {payment.therapist && (
                      <div className="flex items-center gap-1">
                        <IoPersonOutline className="w-3.5 h-3.5" />
                        <span>{payment.therapist.name}</span>
                      </div>
                    )}
                    {payment.booking && (
                      <div className="flex items-center gap-1">
                        <IoCalendarOutline className="w-3.5 h-3.5" />
                        <span>{formatDate(payment.booking.date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadReceipt(payment);
                    }}
                    className="flex items-center gap-1 text-sm text-sage hover:text-sage/80 transition-colors"
                  >
                    <IoDownloadOutline className="w-4 h-4" />
                    Descargar recibo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-sand rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-deep">Detalle del Pago</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoChevronForward className="w-5 h-5 text-deep rotate-90" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-3xl font-bold text-deep">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDate(selectedPayment.date)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status).bg} ${getStatusColor(selectedPayment.status).text}`}
                >
                  {React.createElement(getStatusIcon(selectedPayment.status), {
                    className: "w-4 h-4",
                  })}
                  {getStatusText(selectedPayment.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Descripción</p>
                  <p className="text-sm font-medium text-deep">
                    {selectedPayment.description}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Método de Pago</p>
                  <div className="flex items-center gap-2">
                    <IoCardOutline className="w-4 h-4 text-muted" />
                    <p className="text-sm font-medium text-deep">
                      {selectedPayment.methodDetail}
                    </p>
                  </div>
                </div>

                {selectedPayment.therapist && (
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">Terapeuta</p>
                    <div className="flex items-center gap-2">
                      <IoPersonOutline className="w-4 h-4 text-muted" />
                      <p className="text-sm font-medium text-deep">
                        {selectedPayment.therapist.name}
                      </p>
                    </div>
                  </div>
                )}

                {selectedPayment.booking && (
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">Cita</p>
                    <div className="flex items-center gap-2">
                      <IoCalendarOutline className="w-4 h-4 text-muted" />
                      <p className="text-sm font-medium text-deep">
                        {formatDate(selectedPayment.booking.date)} -{" "}
                        {selectedPayment.booking.serviceType}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleDownloadReceipt(selectedPayment);
                    setSelectedPayment(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-sage text-white px-4 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
                >
                  <IoDownloadOutline className="w-5 h-5" />
                  Descargar Recibo
                </button>
                {selectedPayment.booking && (
                  <a
                    href="/app/citas"
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-deep px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <IoDocumentTextOutline className="w-5 h-5" />
                    Ver Cita
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryScreen;
