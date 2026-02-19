import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoSearch,
  IoLocationOutline,
  IoStar,
  IoCheckmarkCircle,
  IoChatbubbleOutline,
} from "react-icons/io5";

const specialties = [
  "Todas",
  "Psicología Clínica",
  "Psicoterapia",
  "Psicología Infantil",
  "Neuropsicología",
  "Ansiedad",
  "Depresión",
  "Terapia de Pareja",
];

const locations = [
  "Todas",
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Online",
  "Otra",
];

const MOCK_THERAPISTS = [
  {
    _id: "1",
    name: "Dra. María García",
    specialties: ["Psicología Clínica", "Ansiedad"],
    rating: 4.9,
    price: 60,
    bio: "Especialista en trastornos de ansiedad y depresión con más de 10 años de experiencia.",
    location: "Madrid",
    languages: ["Español", "Inglés"],
    available: true,
  },
  {
    _id: "2",
    name: "Dr. Carlos López",
    specialties: ["Psicoterapia", "Terapia de Pareja"],
    rating: 4.7,
    price: 55,
    bio: "Enfoque integrador para problemas de pareja y familiares.",
    location: "Barcelona",
    languages: ["Español", "Catalán"],
    available: true,
  },
  {
    _id: "3",
    name: "Dra. Ana Martínez",
    specialties: ["Psicología Infantil", "Neuropsicología"],
    rating: 4.8,
    price: 65,
    bio: "Especializada en desarrollo infantil y evaluaciones neuropsicológicas.",
    location: "Valencia",
    languages: ["Español"],
    available: false,
  },
  {
    _id: "4",
    name: "Dr. Pablo Ruiz",
    specialties: ["Depresión", "Ansiedad"],
    rating: 4.6,
    price: 50,
    bio: "Enfoque cognitivo-conductual para tratamientos de depresión y estrés.",
    location: "Online",
    languages: ["Español", "Inglés"],
    available: true,
  },
  {
    _id: "5",
    name: "Dra. Laura Sánchez",
    specialties: ["Psicología Clínica", "Terapia de Pareja"],
    rating: 4.9,
    price: 70,
    bio: "Más de 15 años de experiencia en terapia individual y de pareja.",
    location: "Sevilla",
    languages: ["Español"],
    available: true,
  },
];

const TherapistsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const delay = searchQuery ? 500 : 0;
    const timeoutId = setTimeout(() => {
      fetchTherapists();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedSpecialty, selectedLocation]);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/therapists", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTherapists(data);
      } else {
        setTherapists(MOCK_THERAPISTS);
      }
    } catch (error) {
      console.error("Error fetching therapists:", error);
      setTherapists(MOCK_THERAPISTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter((therapist) => {
    const matchesSearch =
      !searchQuery ||
      therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.specialties.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesSpecialty =
      !selectedSpecialty ||
      selectedSpecialty === "Todas" ||
      therapist.specialties.some(
        (s) => s.toLowerCase() === selectedSpecialty.toLowerCase(),
      );

    let matchesLocation = !selectedLocation || selectedLocation === "Todas";
    if (matchesLocation && selectedLocation !== "Todas") {
      if (selectedLocation === "Otra") {
        matchesLocation = therapist.location
          .toLowerCase()
          .includes(customLocation.toLowerCase());
      } else {
        matchesLocation = therapist.location
          .toLowerCase()
          .includes(selectedLocation.toLowerCase());
      }
    }

    return matchesSearch && matchesSpecialty && matchesLocation;
  });

  const handleSpecialtyClick = (specialty) => {
    setSelectedSpecialty(
      specialty === selectedSpecialty || specialty === "Todas" ? "" : specialty,
    );
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(
      location === selectedLocation || location === "Todas" ? "" : location,
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-deep mb-6">
        Búsqueda de profesionales
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="relative mb-5">
          <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F3EEE9] rounded-xl py-3 pl-12 pr-4 text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-deep mb-3">
              Especialidad:
            </p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => handleSpecialtyClick(specialty)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSpecialty === specialty ||
                    (specialty === "Todas" && !selectedSpecialty)
                      ? "bg-sage text-white"
                      : "bg-[#F3EEE9] text-deep hover:bg-[#E8E3DC]"
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-deep mb-3">Ubicación:</p>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => handleLocationClick(location)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedLocation === location ||
                    (location === "Todas" && !selectedLocation)
                      ? "bg-sage text-white"
                      : "bg-[#F3EEE9] text-deep hover:bg-[#E8E3DC]"
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
            {selectedLocation === "Otra" && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Escribe tu ubicación..."
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full bg-[#F3EEE9] rounded-xl py-3 px-4 text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted">Cargando terapeutas...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl">
          <IoAlertCircle className="w-12 h-12 text-rose mb-4" />
          <h3 className="text-lg font-bold text-rose mb-2">Error al cargar</h3>
          <p className="text-sm text-muted text-center mb-4 max-w-md">
            No se pudieron cargar los terapeutas. Verifica tu conexión e intenta
            nuevamente.
          </p>
          <button
            onClick={fetchTherapists}
            className="px-5 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filteredTherapists.length > 0 ? (
        <div className="space-y-4">
          {filteredTherapists.map((therapist) => (
            <div
              key={therapist._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">
                    {therapist.name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-deep truncate">
                      {therapist.name}
                    </h3>
                    <IoCheckmarkCircle className="w-5 h-5 text-sage flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        therapist.available
                          ? "bg-sage text-white"
                          : "bg-muted text-white"
                      }`}
                    >
                      {therapist.available ? "Disponible" : "No disponible"}
                    </span>
                  </div>

                  <p className="text-sm text-sage font-medium mb-1">
                    {therapist.specialties[0]}
                  </p>

                  <div className="flex items-center gap-1 mb-2">
                    <IoLocationOutline className="w-4 h-4 text-muted" />
                    <span className="text-sm text-muted">
                      {therapist.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <IoStar className="w-4 h-4 text-rose" />
                      <span className="text-sm font-medium text-deep">
                        {therapist.rating}
                      </span>
                      <span className="text-sm text-muted">• 5 años</span>
                    </div>
                    <span className="text-base font-bold text-rose">
                      {therapist.price ? `${therapist.price} €` : "Consultar"}
                    </span>
                  </div>

                  <p className="text-sm text-muted line-clamp-2 mb-3">
                    {therapist.bio}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {therapist.languages?.map((language, index) => (
                      <span
                        key={index}
                        className="text-xs bg-[#F3EEE9] px-3 py-1 rounded-full text-deep font-medium"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/terapeutas/${therapist._id}`}
                  className="flex-1 flex items-center justify-center py-3 bg-[#F3EEE9] rounded-lg font-medium text-deep hover:bg-[#E8E3DC] transition-colors"
                >
                  Ver Perfil
                </Link>
                <Link
                  to={`/agenda?therapistId=${therapist._id}`}
                  className={`flex-1 flex items-center justify-center py-3 rounded-lg font-medium transition-colors ${
                    therapist.available
                      ? "bg-sage text-white hover:bg-sage/90"
                      : "bg-muted text-white cursor-not-allowed"
                  }`}
                >
                  <IoChatbubbleOutline className="w-4 h-4 mr-2" />
                  {therapist.available ? "Agendar Cita" : "No Disponible"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl">
          <IoSearch className="w-12 h-12 text-muted mb-4" />
          <h3 className="text-lg font-bold text-deep mb-2">
            No se encontraron terapeutas
          </h3>
          <p className="text-sm text-muted text-center max-w-md">
            Intenta ajustar los filtros de búsqueda para encontrar más opciones.
          </p>
        </div>
      )}
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

export default TherapistsPage;
