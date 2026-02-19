import React, { useState, useEffect } from "react";
import {
  IoStar,
  IoStarOutline,
  IoAdd,
  IoRefresh,
  IoClose,
  IoCheckmarkCircle,
  IoChatbubble,
  IoPerson,
  IoChevronDown,
  IoCloseCircle,
} from "react-icons/io5";

const MOCK_REVIEWS = [
  {
    _id: "review-1",
    therapistId: "mock-therapist-id-456",
    rating: 5,
    comment:
      "Excelente terapeuta, muy empática y profesional. Me ayudó mucho en mi proceso de crecimiento personal.",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    clientName: "Juan P.",
    title: "Gran experiencia terapéutica",
    tags: ["Empatía", "Profesionalismo"],
    isVerified: true,
    hasResponse: false,
  },
  {
    _id: "review-2",
    therapistId: "mock-therapist-id-456",
    rating: 4,
    comment:
      "Muy buena atención y seguimiento. Las sesiones me han ayudado con mi ansiedad.",
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    clientName: "Maria G.",
    title: "Excelente tratamiento para ansiedad",
    tags: ["Tratamiento", "Seguimiento"],
    isVerified: true,
    hasResponse: true,
    response:
      "Gracias por tu opinión. Fue un placer acompañarte en tu proceso.",
    responseDate: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

const MOCK_THERAPISTS_LIST = [
  {
    _id: "mock-therapist-id-456",
    name: "Dra. Ana García",
    specialties: ["Ansiedad", "Depresión", "Terapia Cognitivo-Conductual"],
    rating: 4.8,
  },
  {
    _id: "mock-therapist-id-789",
    name: "Dr. Carlos Ruiz",
    specialties: ["Pareja", "Familia"],
    rating: 4.9,
  },
  {
    _id: "mock-therapist-id-101",
    name: "Lic. Sofia Lopez",
    specialties: ["Infantil", "Adolescentes"],
    rating: 4.7,
  },
];

const ReviewsPage = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [showNewReviewModal, setShowNewReviewModal] = useState(false);
  const [newReviewLoading, setNewReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({
    therapistId: "",
    rating: 5,
    title: "",
    comment: "",
    tags: [],
    isPublic: true,
  });
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [tempTag, setTempTag] = useState("");

  const [availableTherapists, setAvailableTherapists] = useState([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [showTherapistPicker, setShowTherapistPicker] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchReviews = async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const transformedReviews = MOCK_REVIEWS.map((review) => {
        const therapist = MOCK_THERAPISTS_LIST.find(
          (t) => t._id === review.therapistId,
        );
        return {
          ...review,
          therapist: { name: therapist ? therapist.name : "Terapeuta" },
        };
      });

      setReviews(transformedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError(error.message);
    }
  };

  const fetchStats = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStats({
        totalReviews: MOCK_REVIEWS.length,
        averageRatingGiven: 4.5,
        uniqueTherapists: 1,
        reviewsWithResponse: MOCK_REVIEWS.filter((r) => r.hasResponse).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchReviews(), fetchStats()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fetchAvailableTherapists = async () => {
    try {
      setTherapistsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAvailableTherapists(MOCK_THERAPISTS_LIST);
    } catch (error) {
      console.error("Error fetching therapists:", error);
    } finally {
      setTherapistsLoading(false);
    }
  };

  const selectTherapist = (therapist) => {
    setSelectedTherapist(therapist);
    setNewReview((prev) => ({ ...prev, therapistId: therapist._id }));
    setShowTherapistPicker(false);
  };

  const getSelectedTherapistName = () => {
    if (!selectedTherapist && !newReview.therapistId) {
      return "Seleccionar terapeuta";
    }
    if (selectedTherapist) {
      return selectedTherapist.name;
    }
    const foundTherapist = availableTherapists.find(
      (t) => t._id === newReview.therapistId,
    );
    return foundTherapist?.name || "Terapeuta seleccionado";
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const resetNewReviewForm = () => {
    setNewReview({
      therapistId: "",
      rating: 5,
      title: "",
      comment: "",
      tags: [],
      isPublic: true,
    });
    setSelectedTherapist(null);
    setTempTag("");
  };

  const openNewReviewModal = () => {
    resetNewReviewForm();
    setShowNewReviewModal(true);
    fetchAvailableTherapists();
  };

  const closeNewReviewModal = () => {
    setShowNewReviewModal(false);
    setShowTherapistPicker(false);
    setSelectedTherapist(null);
    resetNewReviewForm();
  };

  const addTag = () => {
    if (
      tempTag.trim() &&
      !newReview.tags.includes(tempTag.trim().toLowerCase())
    ) {
      setNewReview((prev) => ({
        ...prev,
        tags: [...prev.tags, tempTag.trim().toLowerCase()],
      }));
      setTempTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setNewReview((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const submitNewReview = async () => {
    if (!newReview.therapistId) {
      alert("Debes seleccionar un terapeuta");
      return;
    }

    if (!newReview.title.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!newReview.comment.trim()) {
      alert("El comentario es obligatorio");
      return;
    }

    if (newReview.title.length < 5) {
      alert("El título debe tener al menos 5 caracteres");
      return;
    }

    if (newReview.comment.length < 10) {
      alert("El comentario debe tener al menos 10 caracteres");
      return;
    }

    try {
      setNewReviewLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("¡Éxito! Tu reseña ha sido creada correctamente");
      closeNewReviewModal();

      const newReviewObj = {
        _id: "new-review-" + Date.now(),
        therapistId: newReview.therapistId,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString(),
        clientName: "Yo",
        therapist: { name: getSelectedTherapistName() },
        title: newReview.title,
        tags: newReview.tags,
        isVerified: true,
        hasResponse: false,
      };

      setReviews((prev) => [newReviewObj, ...prev]);
    } catch (error) {
      console.error("Error creating review:", error);
      alert(`No se pudo crear la reseña: ${error.message}`);
    } finally {
      setNewReviewLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoClose className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-deep">
          Mis Reseñas {reviews.length > 0 && `(${reviews.length})`}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewReviewModal}
            className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            <IoAdd className="w-5 h-5" />
            Nueva Reseña
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-sand transition-colors"
          >
            <IoRefresh className="w-5 h-5 text-sage" />
          </button>
        </div>
      </div>

      {stats.totalReviews > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-sage">{stats.totalReviews}</p>
            <p className="text-sm text-muted">Reseñas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-sage">
              {stats.averageRatingGiven?.toFixed(1) || "0.0"}
            </p>
            <p className="text-sm text-muted">Promedio</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-sage">
              {stats.uniqueTherapists || 0}
            </p>
            <p className="text-sm text-muted">Terapeutas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-sage">
              {stats.reviewsWithResponse || 0}
            </p>
            <p className="text-sm text-muted">Con Respuesta</p>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mx-auto mb-4">
            <IoStarOutline className="w-8 h-8 text-sage" />
          </div>
          <h3 className="text-lg font-bold text-deep mb-2">Sin reseñas aún</h3>
          <p className="text-muted mb-6">
            Aquí aparecerán las reseñas que escribas sobre tus terapeutas.
          </p>
          <button
            onClick={openNewReviewModal}
            className="bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            Escribir Primera Reseña
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-bold text-deep">
                    {review.therapist?.name || "Terapeuta"}
                  </p>
                  <p className="text-sm text-sage font-medium">
                    {review.title}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= review.rating
                          ? "text-terracotta"
                          : "text-gray-300"
                      }
                    >
                      {star <= review.rating ? (
                        <IoStar className="w-4 h-4 fill-current" />
                      ) : (
                        <IoStarOutline className="w-4 h-4" />
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-deep mb-3">{review.comment}</p>

              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {review.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-sand text-sage text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  {formatDate(review.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  {review.isVerified && (
                    <span className="flex items-center gap-1 bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                      <IoCheckmarkCircle className="w-3 h-3" />
                      Verificada
                    </span>
                  )}
                  {review.hasResponse && (
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                      <IoChatbubble className="w-3 h-3" />
                      Respondida
                    </span>
                  )}
                </div>
              </div>

              {review.response && (
                <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-sage font-semibold mb-1">
                    Respuesta del terapeuta:
                  </p>
                  <p className="text-sm text-deep">{review.response}</p>
                  <p className="text-xs text-muted mt-2">
                    {formatDate(review.responseDate)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sand rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <button
                onClick={closeNewReviewModal}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoClose className="w-5 h-5 text-deep" />
              </button>
              <h3 className="text-lg font-bold text-deep">Nueva Reseña</h3>
              <button
                onClick={submitNewReview}
                disabled={newReviewLoading}
                className="bg-sage text-white px-4 py-2 rounded-lg font-medium hover:bg-sage/90 transition-colors disabled:opacity-50"
              >
                {newReviewLoading ? "Publicando..." : "Publicar"}
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-deep mb-2">
                  Terapeuta
                </label>
                <button
                  onClick={() => setShowTherapistPicker(true)}
                  disabled={therapistsLoading}
                  className="w-full flex items-center gap-3 bg-white p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <IoPerson className="w-5 h-5 text-sage" />
                  {therapistsLoading ? (
                    <span className="text-muted">Cargando...</span>
                  ) : (
                    <span
                      className={
                        !newReview.therapistId ? "text-muted" : "text-deep"
                      }
                    >
                      {getSelectedTherapistName()}
                    </span>
                  )}
                  <IoChevronDown className="w-5 h-5 text-sage ml-auto" />
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-deep mb-2">
                  Calificación
                </label>
                <div className="flex items-center gap-2 bg-white p-4 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setNewReview((prev) => ({ ...prev, rating: star }))
                      }
                      className="p-1"
                    >
                      <span
                        className={
                          star <= newReview.rating
                            ? "text-terracotta"
                            : "text-gray-300"
                        }
                      >
                        {star <= newReview.rating ? (
                          <IoStar className="w-7 h-7 fill-current" />
                        ) : (
                          <IoStarOutline className="w-7 h-7" />
                        )}
                      </span>
                    </button>
                  ))}
                  <span className="ml-2 text-sage font-medium">
                    ({newReview.rating} estrellas)
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-deep mb-2">
                  Título de la reseña
                </label>
                <input
                  type="text"
                  placeholder="Ej. Excelente profesional"
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={100}
                  className="w-full bg-white p-4 rounded-xl text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-sage"
                />
                <p className="text-xs text-muted text-right mt-1">
                  {newReview.title.length}/100
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-deep mb-2">
                  Comentario
                </label>
                <textarea
                  placeholder="Comparte tu experiencia con este terapeuta..."
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  maxLength={1000}
                  rows={4}
                  className="w-full bg-white p-4 rounded-xl text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                />
                <p className="text-xs text-muted text-right mt-1">
                  {newReview.comment.length}/1000
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-deep mb-2">
                  Tags (opcional)
                </label>
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl">
                  <input
                    type="text"
                    placeholder="Agregar tag"
                    value={tempTag}
                    onChange={(e) => setTempTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    maxLength={30}
                    className="flex-1 bg-transparent text-deep placeholder-muted focus:outline-none"
                  />
                  <button
                    onClick={addTag}
                    className="p-1 text-sage hover:bg-sand rounded-lg transition-colors"
                  >
                    <IoAdd className="w-5 h-5" />
                  </button>
                </div>

                {newReview.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newReview.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 bg-white text-sage text-sm px-3 py-1 rounded-full font-medium"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <IoCloseCircle className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-deep">
                    Reseña pública
                  </label>
                  <button
                    onClick={() =>
                      setNewReview((prev) => ({
                        ...prev,
                        isPublic: !prev.isPublic,
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      newReview.isPublic ? "bg-sage" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        newReview.isPublic ? "translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>
                <p className="text-xs text-muted mt-2">
                  {newReview.isPublic
                    ? "Tu reseña será visible para otros usuarios"
                    : "Tu reseña será privada, solo visible para ti y el terapeuta"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTherapistPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-sand rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-deep">
                Seleccionar Terapeuta
              </h3>
              <button
                onClick={() => setShowTherapistPicker(false)}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoClose className="w-5 h-5 text-deep" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              {therapistsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-sage border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-muted">Cargando terapeutas...</p>
                </div>
              ) : availableTherapists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted">No hay terapeutas disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTherapists.map((therapist) => (
                    <button
                      key={therapist._id}
                      onClick={() => selectTherapist(therapist)}
                      className={`w-full flex items-center justify-between p-4 bg-white rounded-xl transition-colors ${
                        selectedTherapist?._id === therapist._id ||
                        newReview.therapistId === therapist._id
                          ? "ring-2 ring-sage"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-deep">
                          {therapist.name}
                        </p>
                        <p className="text-sm text-muted">
                          {therapist.specialties?.slice(0, 2).join(", ")}
                        </p>
                        {therapist.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-terracotta">
                              <IoStar className="w-3 h-3 fill-current" />
                            </span>
                            <span className="text-xs text-sage font-medium">
                              {therapist.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {(selectedTherapist?._id === therapist._id ||
                        newReview.therapistId === therapist._id) && (
                        <IoCheckmarkCircle className="w-6 h-6 text-sage" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
