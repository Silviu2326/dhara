import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoChatbubbleOutline,
  IoDocumentTextOutline,
  IoHeartOutline,
  IoTrendingUp,
  IoPeopleOutline,
  IoTimeOutline,
} from "react-icons/io5";

const DashboardScreen = ({ user }) => {
  const [stats, setStats] = useState([
    {
      title: "Próxima Cita",
      value: "Cargando...",
      icon: IoCalendarOutline,
      color: "#8CA48F",
      gradient: "from-emerald-400 to-teal-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Sesiones Totales",
      value: "Cargando...",
      icon: IoTrendingUp,
      color: "#C9A2A6",
      gradient: "from-rose-400 to-pink-500",
      bgColor: "bg-rose-50",
    },
    {
      title: "Terapeuta Asignado",
      value: "Cargando...",
      icon: IoPeopleOutline,
      color: "#D58E6E",
      gradient: "from-orange-400 to-amber-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Horas de Terapia",
      value: "Cargando...",
      icon: IoTimeOutline,
      color: "#A2B2C2",
      gradient: "from-slate-400 to-gray-500",
      bgColor: "bg-slate-50",
    },
  ]);

  const [nextAppointment, setNextAppointment] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
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
        if (data.stats) {
          setStats(data.stats.map((stat, i) => ({ ...stat, ...getStatStyle(i) })));
          setNextAppointment(data.nextAppointment);
          setRecentNotes(data.recentNotes || []);
        }
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      setStats([
        {
          title: "Próxima Cita",
          value: "Hoy 14:00",
          icon: IoCalendarOutline,
          color: "#8CA48F",
          gradient: "from-emerald-400 to-teal-500",
          bgColor: "bg-emerald-50",
        },
        {
          title: "Sesiones Totales",
          value: "24",
          icon: IoTrendingUp,
          color: "#C9A2A6",
          gradient: "from-rose-400 to-pink-500",
          bgColor: "bg-rose-50",
        },
        {
          title: "Terapeuta Asignado",
          value: "Dra. García",
          icon: IoPeopleOutline,
          color: "#D58E6E",
          gradient: "from-orange-400 to-amber-500",
          bgColor: "bg-orange-50",
        },
        {
          title: "Horas de Terapia",
          value: "36 hrs",
          icon: IoTimeOutline,
          color: "#A2B2C2",
          gradient: "from-slate-400 to-gray-500",
          bgColor: "bg-slate-50",
        },
      ]);
      setNextAppointment({
        id: 1,
        date: new Date().toISOString(),
        startTime: "14:00",
        therapistName: "Dra. María García",
        type: "Terapia Individual",
      });
      setRecentNotes([
        { id: 1, title: "Nota de sesión - 15 Feb", date: "2024-02-15" },
        { id: 2, title: "Plan de tratamiento", date: "2024-02-10" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatStyle = (index) => {
    const styles = [
      { gradient: "from-emerald-400 to-teal-500", bgColor: "bg-emerald-50" },
      { gradient: "from-rose-400 to-pink-500", bgColor: "bg-rose-50" },
      { gradient: "from-orange-400 to-amber-500", bgColor: "bg-orange-50" },
      { gradient: "from-slate-400 to-gray-500", bgColor: "bg-slate-50" },
    ];
    return styles[index] || styles[0];
  };

  const quickActions = [
    {
      label: "Mis Citas",
      to: "/app/cliente/citas",
      icon: IoCalendarOutline,
      color: "#8CA48F",
      gradient: "from-emerald-400 to-teal-500",
      shadowColor: "shadow-emerald-200",
    },
    {
      label: "Mensajes",
      to: "/app/cliente/chat",
      icon: IoChatbubbleOutline,
      color: "#C9A2A6",
      gradient: "from-rose-400 to-pink-500",
      shadowColor: "shadow-rose-200",
    },
    {
      label: "Documentos",
      to: "/app/cliente/documentos",
      icon: IoDocumentTextOutline,
      color: "#D58E6E",
      gradient: "from-orange-400 to-amber-500",
      shadowColor: "shadow-orange-200",
    },
    {
      label: "Favoritos",
      to: "/app/cliente/favoritos",
      icon: IoHeartOutline,
      color: "#A2B2C2",
      gradient: "from-slate-400 to-gray-500",
      shadowColor: "shadow-slate-200",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header con gradiente sutil */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-gray-50 to-white border border-gray-100 p-6 mb-8 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sage/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-deep to-deep/70 bg-clip-text text-transparent">
              Mi Dashboard
            </h1>
            <p className="text-muted mt-1 text-lg">
              Bienvenido{user?.name ? `, ${user.name}` : ""} 👋
            </p>
          </div>

        </div>
      </div>

      {/* Stats Grid con tarjetas mejoradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 overflow-hidden"
          >
            {/* Gradiente de fondo sutil */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} bg-gradient-to-br from-white to-transparent`}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <IoTrendingUp className="w-3 h-3" />
                  <span>+12%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-deep mb-1">{stat.value}</p>
              <p className="text-sm text-muted font-medium">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Acciones Rápidas mejoradas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sage/10 rounded-lg">
              <IoCalendarOutline className="w-5 h-5 text-sage" />
            </div>
            <h2 className="text-xl font-bold text-deep">Acciones Rápidas</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 ${action.shadowColor} hover:shadow-xl transition-all duration-300 overflow-hidden`}
              >
                {/* Círculo de fondo animado */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg ${action.shadowColor} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 mb-3`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-deep text-center group-hover:text-sage transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Próxima Cita con diseño premium */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
          {/* Header con gradiente */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sage via-emerald-400 to-teal-500"></div>
          
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-gradient-to-br from-sage to-teal-500 rounded-xl shadow-lg shadow-sage/20">
              <IoCalendarOutline className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-deep">Próxima Cita</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="animate-spin w-6 h-6 border-3 border-sage border-t-transparent rounded-full"></div>
              <span className="text-muted font-medium">Cargando...</span>
            </div>
          ) : nextAppointment ? (
            <div className="space-y-4">
              {/* Fecha destacada */}
              <div className="p-4 bg-gradient-to-br from-sage/5 to-emerald-50/50 rounded-xl border border-sage/10">
                <p className="text-2xl font-bold text-deep capitalize">
                  {new Date(nextAppointment.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2 text-muted">
                  <IoTimeOutline className="w-4 h-4 text-sage" />
                  <span className="font-medium">{nextAppointment.startTime}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold text-deep">
                  {nextAppointment.type || "Terapia"}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage to-teal-500 flex items-center justify-center">
                    <IoPeopleOutline className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-muted">
                    con <span className="font-medium text-deep">{nextAppointment.therapistName || user?.therapist}</span>
                  </p>
                </div>
              </div>
              
              <Link
                to="/app/cliente/citas"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sage to-teal-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-sage/30 hover:scale-[1.02] transition-all duration-300"
              >
                <IoCalendarOutline className="w-4 h-4" />
                Ver Detalles
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <IoCalendarOutline className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-deep font-medium mb-4">
                No tienes citas programadas
              </p>
              <Link
                to="/app/cliente/citas"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sage to-teal-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-sage/30 hover:scale-[1.02] transition-all duration-300"
              >
                <IoCalendarOutline className="w-4 h-4" />
                Agendar Cita
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Notas Recientes con diseño mejorado */}
      {recentNotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <IoDocumentTextOutline className="w-5 h-5 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-deep">Notas Recientes</h2>
            </div>
            <Link 
              to="/app/cliente/documentos" 
              className="text-sm font-medium text-sage hover:text-sage/80 transition-colors"
            >
              Ver todas →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <IoDocumentTextOutline className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-deep group-hover:text-sage transition-colors">
                      {note.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{note.date}</p>
                  </div>
                </div>
                <Link
                  to="/app/cliente/documentos"
                  className="px-4 py-2 text-sm font-medium text-sage bg-sage/10 hover:bg-sage hover:text-white rounded-lg transition-all duration-300"
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;
