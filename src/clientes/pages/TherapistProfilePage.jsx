import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  IoArrowBack,
  IoHeart,
  IoHeartOutline,
  IoStar,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoLocationOutline,
  IoVideocamOutline,
  IoGlobeOutline,
  IoLogoLinkedin,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoPlayCircle,
} from "react-icons/io5";

const MOCK_THERAPIST = {
  _id: "1",
  name: "Dra. María García",
  specialties: ["Psicología Clínica", "Ansiedad"],
  rating: 4.9,
  price: 60,
  bio: "Especialista en trastornos de ansiedad y depresión con más de 10 años de experiencia. Enfoque integrador que combina terapia cognitivo-conductual con mindfulness.",
  location: "Madrid",
  languages: ["Español", "Inglés"],
  available: true,
  experience: [
    {
      startDate: "2018-01-01",
      endDate: null,
      position: "Psicóloga Clínica",
      company: "Consultorio Privado",
      description: "Atención a pacientes con ansiedad y depresión.",
    },
  ],
  stats: {
    averageRating: 4.9,
    totalClients: 120,
  },
  education: [
    {
      degree: "Licenciatura en Psicología",
      institution: "Universidad Complutense de Madrid",
      year: "2015",
    },
    {
      degree: "Máster en Psicología Clínica",
      institution: "Universidad Autónoma de Madrid",
      year: "2017",
    },
  ],
  specializations: [
    {
      name: "Psicología Clínica",
      certification: "Colegiada nº 12345",
      yearObtained: "2018",
    },
    {
      name: "Terapia Cognitivo-Conductual",
      certification: "Certificada",
      yearObtained: "2019",
    },
  ],
  languages: [
    { language: "Español", level: "Nativo" },
    { language: "Inglés", level: "Avanzado" },
  ],
  rates: {
    sessionPrice: 60,
    coupleSessionPrice: 90,
    followUpPrice: 50,
  },
  workLocations: [
    { name: "Consultorio Centro", city: "Madrid", offersOnline: true },
    { name: "Consultorio Norte", city: "Madrid", offersOnline: true },
  ],
  videoPresentation: {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Conóceme",
    description: "Breve introducción a mi método de trabajo.",
  },
  socialMedia: {
    linkedin: "https://linkedin.com",
    website: "https://ejemplo.com",
  },
};

const TherapistProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/therapists/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(transformProfile(data));
      } else {
        const mockProfile = MOCK_THERAPISTS_LIST?.find((t) => t._id === id);
        if (mockProfile) {
          setProfile(transformProfile(mockProfile));
        } else {
          setProfile(transformProfile(MOCK_THERAPIST));
        }
      }
      await checkFavoriteStatus();
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(transformProfile(MOCK_THERAPIST));
    } finally {
      setLoading(false);
    }
  };

  const transformProfile = (therapist) => ({
    user: {
      name: therapist.name,
      isVerified: true,
    },
    therapies: therapist.specialties,
    experience: therapist.experience || [],
    stats: therapist.stats || {
      averageRating: therapist.rating,
      totalClients: 0,
    },
    isAvailable: therapist.available,
    about: therapist.bio,
    videoPresentation: therapist.videoPresentation,
    specializations:
      therapist.specializations ||
      therapist.specialties?.map((s) => ({ name: s })),
    languages: therapist.languages || [],
    education: therapist.education || [],
    rates: therapist.rates || { sessionPrice: therapist.price },
    workLocations: therapist.workLocations || [
      { name: therapist.location, city: "", offersOnline: true },
    ],
    socialMedia: therapist.socialMedia,
  });

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites/check/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const method = isFavorite ? "DELETE" : "POST";
      await fetch(`/api/favorites/${id}`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorite(!isFavorite);
    }
  };

  const openLink = (url) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const calculateExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return 0;
    const totalMonths = experiences.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      return total + Math.max(0, months);
    }, 0);
    return Math.round(totalMonths / 12);
  };

  const formatExperience = (exp) => {
    const start = new Date(exp.startDate).getFullYear();
    const end = exp.endDate ? new Date(exp.endDate).getFullYear() : "Presente";
    return `${start} - ${end}`;
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

  if (error || !profile) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <IoAlertCircle className="w-16 h-16 text-rose mb-4" />
        <h3 className="text-xl font-bold text-deep mb-2">
          Error al cargar el perfil
        </h3>
        <p className="text-muted text-center mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={fetchProfile}
            className="px-5 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-[#F3EEE9] text-sage rounded-lg font-medium hover:bg-[#E8E3DC] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="h-48 bg-sage">
        <div className="flex items-center justify-between p-4 pt-16">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <IoArrowBack className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={toggleFavorite}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            {isFavorite ? (
              <IoHeart className="w-6 h-6 text-rose" />
            ) : (
              <IoHeartOutline className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="px-6 -mt-20 pb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col items-center -mt-20 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {profile.user.name.charAt(0)}
                </span>
              </div>
              {profile.user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">
                  <IoCheckmarkCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-deep text-center mb-1">
            {profile.user.name}
          </h1>
          {profile.therapies && profile.therapies.length > 0 && (
            <p className="text-base text-sage font-medium text-center mb-4">
              {profile.therapies[0]}
            </p>
          )}

          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-deep">
                {calculateExperience(profile.experience)}
              </p>
              <p className="text-xs text-muted">Años</p>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-xl font-bold text-deep">
                {profile.stats?.averageRating?.toFixed(1) || "0.0"}
              </p>
              <p className="text-xs text-muted">Rating</p>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-xl font-bold text-deep">
                {profile.stats?.totalClients || 0}
              </p>
              <p className="text-xs text-muted">Clientes</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {profile.isAvailable ? (
              <span className="flex items-center text-green-600 font-medium">
                <IoCheckmarkCircle className="w-4 h-4 mr-1" />
                Disponible
              </span>
            ) : (
              <span className="flex items-center text-rose font-medium">
                <IoCloseCircle className="w-4 h-4 mr-1" />
                No Disponible
              </span>
            )}
          </div>
        </div>

        {profile.about && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Acerca de mí</h2>
            <p className="text-sm text-muted leading-relaxed">
              {profile.about}
            </p>
          </div>
        )}

        {profile.videoPresentation?.url && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">
              Video de Presentación
            </h2>
            <button
              onClick={() => openLink(profile.videoPresentation.url)}
              className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-sage hover:bg-sage/5 transition-colors"
            >
              <IoPlayCircle className="w-12 h-12 text-sage mb-2" />
              <p className="text-base font-semibold text-deep">
                {profile.videoPresentation.title}
              </p>
              {profile.videoPresentation.description && (
                <p className="text-sm text-muted mt-1">
                  {profile.videoPresentation.description}
                </p>
              )}
            </button>
          </div>
        )}

        {profile.specializations && profile.specializations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">
              Especializaciones
            </h2>
            <div className="space-y-3">
              {profile.specializations.map((spec, index) => (
                <div
                  key={index}
                  className="pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <p className="text-base font-semibold text-deep">
                    {spec.name}
                  </p>
                  {spec.certification && (
                    <p className="text-sm text-sage">{spec.certification}</p>
                  )}
                  {spec.yearObtained && (
                    <p className="text-xs text-muted">
                      Año: {spec.yearObtained}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Idiomas</h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-[#F3EEE9] rounded-full text-sm font-medium text-sage"
                >
                  {lang.language} ({lang.level})
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.education && profile.education.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Educación</h2>
            <div className="space-y-3">
              {profile.education.map((edu, index) => (
                <div
                  key={index}
                  className="pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <p className="text-base font-semibold text-deep">
                    {edu.degree}
                  </p>
                  <p className="text-sm text-sage">{edu.institution}</p>
                  {edu.year && <p className="text-xs text-muted">{edu.year}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.experience && profile.experience.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Experiencia</h2>
            <div className="space-y-3">
              {profile.experience.map((exp, index) => (
                <div
                  key={index}
                  className="pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <p className="text-base font-semibold text-deep">
                    {exp.position}
                  </p>
                  <p className="text-sm text-sage">{exp.company}</p>
                  <p className="text-xs text-muted">{formatExperience(exp)}</p>
                  {exp.description && (
                    <p className="text-sm text-muted mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.rates && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Tarifas</h2>
            <div className="space-y-2">
              {profile.rates.sessionPrice > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted">Sesión individual</span>
                  <span className="text-base font-bold text-sage">
                    {profile.rates.sessionPrice}€
                  </span>
                </div>
              )}
              {profile.rates.coupleSessionPrice > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted">Sesión de pareja</span>
                  <span className="text-base font-bold text-sage">
                    {profile.rates.coupleSessionPrice}€
                  </span>
                </div>
              )}
              {profile.rates.followUpPrice > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted">Sesión de seguimiento</span>
                  <span className="text-base font-bold text-sage">
                    {profile.rates.followUpPrice}€
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {profile.workLocations && profile.workLocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Ubicaciones</h2>
            <div className="space-y-3">
              {profile.workLocations.map((location, index) => (
                <div
                  key={index}
                  className="pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <IoLocationOutline className="w-5 h-5 text-sage" />
                    <p className="text-base font-semibold text-deep">
                      {location.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted ml-7">{location.city}</p>
                  {location.offersOnline && (
                    <div className="flex items-center mt-2 ml-7">
                      <IoVideocamOutline className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium ml-1">
                        Sesiones online disponibles
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.socialMedia && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-lg font-bold text-deep mb-3">Enlaces</h2>
            <div className="flex gap-3">
              {profile.socialMedia.website && (
                <button
                  onClick={() => openLink(profile.socialMedia.website)}
                  className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <IoGlobeOutline className="w-5 h-5 text-sage" />
                  <span className="text-sm font-medium text-muted">
                    Sitio Web
                  </span>
                </button>
              )}
              {profile.socialMedia.linkedin && (
                <button
                  onClick={() => openLink(profile.socialMedia.linkedin)}
                  className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <IoLogoLinkedin className="w-5 h-5 text-[#0077B5]" />
                  <span className="text-sm font-medium text-muted">
                    LinkedIn
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 pb-6">
          <button className="flex-1 flex items-center justify-center py-4 bg-[#F3EEE9] rounded-xl font-semibold text-sage hover:bg-[#E8E3DC] transition-colors">
            <IoChatbubbleOutline className="w-5 h-5 mr-2" />
            Contactar
          </button>
          <Link
            to={`/agenda?therapistId=${id}`}
            className={`flex-1 flex items-center justify-center py-4 rounded-xl font-semibold text-white transition-colors ${
              profile.isAvailable
                ? "bg-sage hover:bg-sage/90"
                : "bg-muted cursor-not-allowed"
            }`}
          >
            <IoCalendarOutline className="w-5 h-5 mr-2" />
            {profile.isAvailable ? "Agendar Cita" : "No Disponible"}
          </Link>
        </div>
      </div>
    </div>
  );
};

const IoAlertCircle = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default TherapistProfilePage;
