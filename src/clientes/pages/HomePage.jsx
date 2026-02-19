import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IoCalendarOutline, IoChevronForward } from "react-icons/io5";

const HomePage = ({ user }) => {
  const [dashboardCards, setDashboardCards] = useState([
    { title: "Próxima Cita", value: "Cargando...", color: "#8CA48F" },
    { title: "Sesiones Completadas", value: "Cargando...", color: "#C9A2A6" },
    { title: "Ejercicios Pendientes", value: "Cargando...", color: "#D58E6E" },
    { title: "Días de Progreso", value: "Cargando...", color: "#A2B2C2" },
  ]);

  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/client/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.dashboardCards) {
          setDashboardCards(data.dashboardCards);
          setNextAppointment(data.nextAppointment);
        }
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      setDashboardCards([
        { title: "Próxima Cita", value: "Hoy 10:00", color: "#8CA48F" },
        { title: "Sesiones Completadas", value: "12", color: "#C9A2A6" },
        { title: "Ejercicios Pendientes", value: "3", color: "#D58E6E" },
        { title: "Días de Progreso", value: "45", color: "#A2B2C2" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-deep mb-6">Qué bueno verte.</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            style={{ borderLeftWidth: 4, borderLeftColor: card.color }}
          >
            <p className="text-2xl font-bold text-deep">{card.value}</p>
            <p className="text-sm text-muted mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-deep mb-4">Acciones Rápidas</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/app/citas"
            className="flex-1 bg-sage text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Agendar Cita
          </Link>
          <Link
            to="/ejercicios"
            className="flex-1 bg-rose text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-rose/90 transition-colors"
          >
            Ver Ejercicios
          </Link>
        </div>
      </div>

      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4"
        style={{ borderLeftColor: "#8CA48F" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <IoCalendarOutline className="w-4 h-4 text-sage" />
          <h3 className="text-base font-bold text-deep">Próxima Cita</h3>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="animate-spin w-5 h-5 border-2 border-sage border-t-transparent rounded-full"></div>
            <span className="text-muted">Cargando cita...</span>
          </div>
        ) : nextAppointment ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-deep">
                {new Date(nextAppointment.date).toLocaleDateString("es-ES")} a
                las {nextAppointment.startTime}
              </p>
              <p className="text-sm text-muted">
                con {nextAppointment.therapistName || user?.therapist}
              </p>
            </div>
            <Link
              to={`/citas/${nextAppointment.id}`}
              className="inline-flex items-center bg-sage text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sage/90 transition-colors"
            >
              Ver Detalles
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-base text-deep">No tienes citas programadas</p>
            <Link
              to="/agenda"
              className="inline-flex items-center bg-sage text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sage/90 transition-colors"
            >
              Agendar Cita
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
