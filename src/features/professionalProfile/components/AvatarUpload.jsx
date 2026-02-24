import React, { useState, useRef } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "../../../components/Button";
import { supabaseStorageService } from "../../../services/api/supabaseStorageService";
import { authService } from "../../../services/api/authService";

const getCurrentUserId = () => {
  try {
    const user = authService.getCurrentUser();
    console.log("🔍 [AvatarUpload] User from authService:", user);
    return user?.id || user?._id || "anonymous";
  } catch (error) {
    console.error("Error getting user ID:", error);
    return "anonymous";
  }
};

export const AvatarUpload = ({
  currentAvatar,
  onAvatarChange,
  isEditing = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      const userId = getCurrentUserId();
      const timestamp = Date.now();
      const fileName = `avatar_${userId}_${timestamp}.${file.name.split(".").pop()}`;

      const result = await supabaseStorageService.uploadFile(file, {
        bucket: "avatars",
        folder: userId,
        fileName: fileName,
        isPublic: true,
        onProgress: (progress) => setUploadProgress(progress),
      });

      if (onAvatarChange) {
        onAvatarChange(file, result.url);
      }

      alert(
        'Foto subida correctamente. Presiona "Guardar" para persistir los cambios.',
      );
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (event) => {
    if (isEditing && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div
          className={`
            relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg
            ${isEditing ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          `}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={isEditing ? 0 : -1}
          role={isEditing ? "button" : "img"}
          aria-label={isEditing ? "Cambiar foto de perfil" : "Foto de perfil"}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar del terapeuta"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {isEditing && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Subiendo... {uploadProgress}%</p>
                <div className="w-24 bg-gray-600 rounded-full h-1 mt-2">
                  <div
                    className="bg-sage h-1 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <Button
          onClick={handleClick}
          disabled={isUploading}
          className="bg-sage text-white hover:bg-sage/90 px-4 py-2 rounded-lg flex items-center space-x-2"
          aria-label="Cambiar foto de perfil"
        >
          <Upload className="h-4 w-4" />
          <span>{isUploading ? "Subiendo..." : "Cambiar foto"}</span>
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Seleccionar archivo de imagen"
      />
    </div>
  );
};
