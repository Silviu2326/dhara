import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoHeart,
  IoStar,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoTrashOutline,
} from "react-icons/io5";

const FavoritesScreen = ({ user }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client/favorites", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      setFavorites([
        {
          id: 1,
          name: "Dra. María García",
          specialty: "Terapia Cognitiva-Conductual",
          rating: 4.9,
          reviews: 128,
          image: null,
          isFavorite: true,
        },
        {
          id: 2,
          name: "Dr. Carlos López",
          specialty: "Psicología Clínica",
          rating: 4.7,
          reviews: 95,
          image: null,
          isFavorite: true,
        },
        {
          id: 3,
          name: "Dra. Ana Martínez",
          specialty: "Terapia Familiar",
          rating: 4.8,
          reviews: 156,
          image: null,
          isFavorite: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await fetch(`/api/client/favorites/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFavorites(favorites.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mb-4"></div>
          <p className="text-muted">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-deep">Mis Favoritos</h1>
          <p className="text-muted mt-1">
            {favorites.length} profesional{favorites.length !== 1 ? "es" : ""}{" "}
            guardado{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IoHeart className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            No tienes favoritos aún
          </h2>
          <p className="text-muted mb-6">
            Explora profesionales y guarda tus favoritos para acceder
            rápidamente a ellos
          </p>
          <Link
            to="/terapeutas"
            className="inline-flex items-center bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Explorar Terapeutas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((therapist) => (
            <div
              key={therapist.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center">
                    {therapist.image ? (
                      <img
                        src={therapist.image}
                        alt={therapist.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {therapist.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-deep">
                      {therapist.name}
                    </h3>
                    <p className="text-sm text-muted">{therapist.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(therapist.id)}
                  className="p-2 text-gray-400 hover:text-rose transition-colors"
                  title="Quitar de favoritos"
                >
                  <IoHeart className="w-5 h-5 fill-rose text-rose" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <IoStar className="w-4 h-4 text-rose fill-rose" />
                  <span className="ml-1 text-sm font-medium text-deep">
                    {therapist.rating}
                  </span>
                </div>
                <span className="text-sm text-muted">
                  ({therapist.reviews} reseñas)
                </span>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/terapeutas/${therapist.id}`}
                  className="flex-1 flex items-center justify-center py-2.5 px-4 bg-[#F3EEE9] rounded-lg font-medium text-deep hover:bg-[#E8E3DC] transition-colors"
                >
                  Ver Perfil
                </Link>
                <button className="flex-1 flex items-center justify-center py-2.5 px-4 bg-sage text-white rounded-lg font-medium hover:bg-sage/90 transition-colors">
                  <IoChatbubbleOutline className="w-4 h-4 mr-2" />
                  Mensaje
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-deep mb-4">
            Explorar más profesionales
          </h2>
          <p className="text-muted mb-4">
            Encuentra más terapeutas que puedan ayudarte
          </p>
          <Link
            to="/terapeutas"
            className="inline-flex items-center bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            <IoCalendarOutline className="w-4 h-4 mr-2" />
            Ver Todos los Terapeutas
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesScreen;
