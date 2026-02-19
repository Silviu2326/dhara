import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoChevronForward,
  IoCallOutline,
  IoTimeOutline,
  IoStar,
  IoChatbubbleOutline,
  IoSettingsOutline,
  IoHelpCircleOutline,
  IoPencil,
  IoRefresh,
} from "react-icons/io5";

const ProfilePage = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        setProfileData({
          user: user || { name: "Usuario", email: "email@ejemplo.com" },
          stats: {
            totalSessions: 12,
            completedSessions: 8,
            upcomingSessions: 2,
            progressPercentage: 65,
            treatmentDuration: "45 días",
          },
          therapist: {
            name: "Dra. María García",
            specialties: ["Terapia Cognitiva", "Ansiedad"],
            rating: 4.8,
          },
          recentActivity: [
            { title: "Sesión completada", date: "2024-01-15", type: "session" },
            { title: "Documento subido", date: "2024-01-14", type: "document" },
            { title: "Cita agendada", date: "2024-01-12", type: "session" },
          ],
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfileData({
        user: user || { name: "Usuario", email: "email@ejemplo.com" },
        stats: {
          totalSessions: 12,
          completedSessions: 8,
          upcomingSessions: 2,
          progressPercentage: 65,
          treatmentDuration: "45 días",
        },
        therapist: {
          name: "Dra. María García",
          specialties: ["Terapia Cognitiva", "Ansiedad"],
          rating: 4.8,
        },
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mb-4"></div>
          <p className="text-muted">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const userData = profileData?.user || user || {};
  const stats = profileData?.stats || {};
  const therapist = profileData?.therapist || {};
  const recentActivity = profileData?.recentActivity || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-deep">Mi Perfil</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <IoRefresh
            className={`w-5 h-5 text-sage ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {userData?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-deep">
              {userData?.name || "Usuario"}
            </h2>
            <p className="text-sm text-muted">
              {userData?.email || "email@ejemplo.com"}
            </p>
            <div className="flex items-center mt-2">
              <span className="w-2 h-2 rounded-full bg-sage mr-2"></span>
              <span className="text-xs font-medium text-sage">
                Cliente Activo
              </span>
            </div>
          </div>
          <button className="p-2 bg-[#F3EEE9] rounded-full hover:bg-[#E8E3DC] transition-colors">
            <IoPencil className="w-4 h-4 text-sage" />
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-base font-bold text-deep mb-4">
            Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <IoCallOutline className="w-4 h-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Teléfono</p>
                <p className="text-sm font-medium text-deep">
                  {userData?.phone || "No especificado"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IoCalendarOutline className="w-4 h-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Fecha de Nacimiento</p>
                <p className="text-sm font-medium text-deep">
                  {userData?.dateOfBirth
                    ? new Date(userData.dateOfBirth).toLocaleDateString("es-ES")
                    : "No especificado"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="text-lg font-bold text-deep mb-4 flex items-center gap-2">
          <IoAnalytics className="w-5 h-5 text-sage" />
          Estadísticas de Tratamiento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-deep">
              {stats.totalSessions || 0}
            </p>
            <p className="text-xs text-muted">Sesiones Totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-deep">
              {stats.completedSessions || 0}
            </p>
            <p className="text-xs text-muted">Completadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-deep">
              {stats.upcomingSessions || 0}
            </p>
            <p className="text-xs text-muted">Próximas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-deep">
              {stats.progressPercentage || 0}%
            </p>
            <p className="text-xs text-muted">Progreso</p>
          </div>
        </div>
        <div className="flex items-center justify-center pt-4 border-t border-gray-100">
          <IoTimeOutline className="w-4 h-4 text-rose" />
          <span className="text-sm text-rose font-medium ml-2">
            En tratamiento: {stats.treatmentDuration || "0 días"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="text-lg font-bold text-deep mb-4 flex items-center gap-2">
          <span className="text-rose">●</span>
          Mi Profesional
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {therapist?.name?.charAt(0) || "T"}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-deep">
              {therapist?.name || "Sin asignar"}
            </p>
            {therapist?.specialties && therapist.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {therapist.specialties.slice(0, 2).map((specialty, index) => (
                  <span
                    key={index}
                    className="text-xs bg-[#F3EEE9] px-2 py-1 rounded-full text-deep font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
            {therapist?.rating > 0 && (
              <div className="flex items-center mt-1">
                <IoStar className="w-3 h-3 text-rose" />
                <span className="text-xs text-rose font-medium ml-1">
                  {therapist.rating}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center py-3 px-4 bg-[#F3EEE9] rounded-lg font-medium text-deep hover:bg-[#E8E3DC] transition-colors">
            <IoChatbubbleOutline className="w-4 h-4 mr-2" />
            Enviar Mensaje
          </button>
          <Link
            to="/agenda"
            className="flex-1 flex items-center justify-center py-3 px-4 bg-sage text-white rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            <IoCalendarOutline className="w-4 h-4 mr-2" />
            Agendar Cita
          </Link>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-deep mb-4 flex items-center gap-2">
            <IoTimeOutline className="w-5 h-5 text-muted" />
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 3).map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-[#F3EEE9] flex items-center justify-center">
                  {activity.type === "session" ? (
                    <IoCalendarOutline className="w-4 h-4 text-sage" />
                  ) : (
                    <IoDocumentText className="w-4 h-4 text-sage" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-deep">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(activity.date).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Link
          to="/app/configuracion"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <IoSettingsOutline className="w-5 h-5 text-deep mr-3" />
            <span className="text-base font-semibold text-deep">
              Configuración
            </span>
          </div>
          <IoChevronForward className="w-5 h-5 text-muted" />
        </Link>

        <Link
          to="/ayuda"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <IoHelpCircleOutline className="w-5 h-5 text-deep mr-3" />
            <span className="text-base font-semibold text-deep">
              Centro de Ayuda
            </span>
          </div>
          <IoChevronForward className="w-5 h-5 text-muted" />
        </Link>
      </div>
    </div>
  );
};

const IoAnalytics = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M18 20V10M12 20V4M6 20v-6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IoDocumentText = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="14 2 14 8 20 8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="16"
      y1="13"
      x2="8"
      y2="13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="16"
      y1="17"
      x2="8"
      y2="17"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ProfilePage;
