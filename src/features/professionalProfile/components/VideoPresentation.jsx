import React, { useState, useRef } from "react";
import { Button } from "../../../components/Button";
import { supabaseStorageService } from "../../../services/api/supabaseStorageService";
import { authService } from "../../../services/api/authService";

const getCurrentUserId = () => {
  try {
    const user = authService.getCurrentUser();
    return user?.id || user?._id || "anonymous";
  } catch (error) {
    console.error("Error getting user ID:", error);
    return "anonymous";
  }
};

const VideoPresentation = ({ videoData, onChange, isEditing }) => {
  const videoUrl = videoData?.url || null;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Por favor, selecciona un archivo de video válido.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("El archivo es demasiado grande. El tamaño máximo es 50MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const userId = getCurrentUserId();
      const timestamp = Date.now();
      const fileName = `video_${userId}_${timestamp}.${file.name.split(".").pop()}`;

      const result = await supabaseStorageService.uploadFile(file, {
        bucket: "avatars",
        folder: `videos/${userId}`,
        fileName: fileName,
        isPublic: true,
      });

      const newVideoData = {
        url: result.url,
        title: videoData?.title || "Presentación Personal",
        description:
          videoData?.description ||
          "Conoce un poco más sobre mi enfoque terapéutico",
      };

      onChange(newVideoData);
      alert(
        'Video subido correctamente. Presiona "Guardar" para persistir los cambios.',
      );
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Error al subir el video. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleRemoveVideo = () => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar el video de presentación?",
      )
    ) {
      onChange({
        url: null,
        title: "Presentación Personal",
        description: "Conoce un poco más sobre mi enfoque terapéutico",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-deep">
          Video de Presentación
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Sube un video corto de bienvenida para humanizar tu perfil (máximo
          50MB, 2 minutos recomendados)
        </p>
      </div>

      {videoUrl ? (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              src={videoUrl}
              controls
              className="w-full h-64 object-cover"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E"
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                Cambiar Video
              </Button>
              <Button
                onClick={handleRemoveVideo}
                variant="outline"
                className="text-red-600 hover:text-red-800 hover:border-red-300"
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {isEditing ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-sage bg-sage/5"
                  : "border-gray-300 hover:border-sage"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage mx-auto"></div>
                  <p className="text-sm text-gray-600">Subiendo video...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-sage"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">
                      Arrastra tu video aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">
                      Formatos soportados: MP4, WebM, AVI • Máximo 50MB
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-sage text-white hover:bg-sage/90"
                  >
                    Seleccionar Video
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p>No hay video de presentación</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export { VideoPresentation };
