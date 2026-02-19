import React, { useState, useEffect } from "react";
import { X, Star, MessageSquare, Pencil, Check, RotateCcw } from "lucide-react";

const STORAGE_KEY = "auto_responses";

const defaultResponses = {
  1: "Lamentamos profundamente que tu experiencia no haya sido la esperada. Nos gustaría entender mejor qué ocurrió para poder mejorar. Por favor, contáctanos directamente para poder atender tu caso personalmente.",
  2: "Gracias por tus comentarios. Sentimos que no hayamos cumplido totalmente con tus expectativas. Tomaremos muy en cuenta tus observaciones para mejorar nuestros servicios en el futuro.",
  3: "Gracias por tu reseña. Nos alegra que hayas compartido tu opinión con nosotros. Siempre buscamos mejorar y tus comentarios son muy valiosos para nuestro crecimiento.",
  4: "¡Muchas gracias por tu buena valoración! Nos alegra mucho saber que tuviste una experiencia positiva con nosotros. Esperamos poder atenderte de nuevo pronto.",
  5: "¡Muchísimas gracias por tu excelente valoración! Nos hace muy felices saber que estás satisfecho con nuestro servicio. ¡Es un placer atenderte!",
};

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Error loading from localStorage:", err);
  }
  return null;
};

const saveToStorage = (responses) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  } catch (err) {
    console.error("Error saving to localStorage:", err);
  }
};

export const AutoResponseModal = ({ onSelect, onClose }) => {
  const [responses, setResponses] = useState(
    () => loadFromStorage() || defaultResponses,
  );
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEditing = (rating) => {
    setEditingId(rating);
    setEditValue(responses[rating]);
  };

  const saveEdit = (rating) => {
    const newResponses = { ...responses, [rating]: editValue };
    setResponses(newResponses);
    saveToStorage(newResponses);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const resetToDefault = (rating) => {
    const newResponses = { ...responses, [rating]: defaultResponses[rating] };
    setResponses(newResponses);
    saveToStorage(newResponses);
    setEditingId(null);
  };

  const hasChanges = () => {
    const stored = loadFromStorage();
    if (!stored) return false;
    return JSON.stringify(stored) !== JSON.stringify(defaultResponses);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sage" />
            Respuestas Automáticas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {[1, 2, 3, 4, 5].map((rating) => (
            <div key={rating} className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {rating === 1
                      ? "Respuesta para 1 estrella"
                      : `Respuesta para ${rating} estrellas`}
                  </span>
                </div>
                <button
                  onClick={() => startEditing(rating)}
                  className="text-xs text-gray-400 hover:text-sage transition-colors flex items-center gap-1"
                  title="Editar respuesta"
                  disabled={editingId !== null}
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              </div>

              {editingId === rating ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full text-left p-4 rounded-lg border border-sage focus:border-sage focus:ring-1 focus:ring-sage outline-none resize-none text-gray-700"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(rating)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-sage text-white rounded-lg text-sm hover:bg-sage/90 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => resetToDefault(rating)}
                      className="flex items-center gap-1 px-3 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg text-sm transition-colors ml-auto"
                      title="Restaurar valor por defecto"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onSelect(responses[rating])}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-sage hover:bg-sage/5 transition-all group"
                >
                  <p className="text-gray-700 group-hover:text-gray-900">
                    {responses[rating]}
                  </p>
                  <span className="inline-block mt-2 text-xs font-medium text-sage opacity-0 group-hover:opacity-100 transition-opacity">
                    Click para usar esta respuesta
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
