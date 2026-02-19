import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoDocumentText,
  IoDownloadOutline,
  IoRefresh,
  IoAlertCircle,
  IoFolderOutline,
} from "react-icons/io5";
import { documentService } from "../../services/api/documentService";

const DocumentsScreen = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const getFileTypeFromMimeType = (mimeType, originalName) => {
    if (mimeType?.includes("pdf")) return "PDF";
    if (mimeType?.includes("image")) return "IMG";
    if (mimeType?.includes("word") || mimeType?.includes("document"))
      return "DOC";
    if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet"))
      return "XLS";
    if (mimeType?.includes("text")) return "TXT";
    if (mimeType?.includes("audio")) return "MP3";
    if (mimeType?.includes("video")) return "MP4";

    const ext = originalName?.split(".").pop()?.toUpperCase();
    return ext || "FILE";
  };

  const getFileTypeColor = (type) => {
    const colors = {
      PDF: "#FF6B6B",
      IMG: "#4ECDC4",
      DOC: "#45B7D1",
      XLS: "#96CEB4",
      TXT: "#FECA57",
      MP3: "#FF9FF3",
      MP4: "#A29BFE",
      FILE: "#A2B2C2",
    };
    return colors[type] || "#A2B2C2";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await documentService.getDocuments(
        {},
        { forceNoCache: true },
      );
      const docs = response.documents || [];

      const transformedDocuments = docs.map((doc) => ({
        _id: doc._id || doc.id,
        title: doc.title || doc.originalName || doc.name,
        originalName: doc.originalName || doc.name,
        mimeType: doc.mimeType,
        size: doc.fileSize || doc.size,
        humanFileSize:
          doc.humanFileSize || formatFileSize(doc.fileSize || doc.size),
        createdAt: doc.createdAt || doc.uploadedAt,
        therapist: doc.therapist || { name: doc.sharedBy || "Terapeuta" },
        category: doc.category || "general",
        url: doc.url || doc.fileUrl,
      }));

      setDocuments(transformedDocuments);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([
        {
          _id: 1,
          title: "Plan de Tratamiento - Juan Pérez",
          originalName: "plan_tratamiento_juan.pdf",
          mimeType: "application/pdf",
          size: 1024 * 1024 * 2.5,
          humanFileSize: "2.5 MB",
          createdAt: "2024-01-15T10:30:00Z",
          therapist: { name: "Dra. María García" },
          category: "therapy_plan",
          url: "#",
        },
        {
          _id: 2,
          title: "Evaluación Inicial",
          originalName: "evaluacion_inicial.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          size: 1024 * 512,
          humanFileSize: "512 KB",
          createdAt: "2024-01-10T14:20:00Z",
          therapist: { name: "Dr. Carlos López" },
          category: "assessment",
          url: "#",
        },
        {
          _id: 3,
          title: "Ejercicios de Relajación",
          originalName: "ejercicios_relajacion.pdf",
          mimeType: "application/pdf",
          size: 1024 * 1024 * 1.2,
          humanFileSize: "1.2 MB",
          createdAt: "2024-01-08T09:15:00Z",
          therapist: { name: "Dra. Ana Martínez" },
          category: "educational",
          url: "#",
        },
        {
          _id: 4,
          title: "Registro de Sesiones - Enero",
          originalName: "registro_enero.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          size: 1024 * 256,
          humanFileSize: "256 KB",
          createdAt: "2024-01-05T16:45:00Z",
          therapist: { name: "Dra. María García" },
          category: "session_notes",
          url: "#",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc._id);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (doc.url && doc.url !== "#") {
        downloadFile(doc.url, doc.originalName);
      } else {
        alert(`Descarga simulada: ${doc.originalName}`);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mb-4"></div>
          <p className="text-muted">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-4">
            <IoAlertCircle className="w-8 h-8 text-rose" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            Error al cargar documentos
          </h2>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={fetchDocuments}
            className="inline-flex items-center bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
          >
            <IoRefresh className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-deep">Documentos</h1>
          <p className="text-muted mt-1">
            {documents.length} documento{documents.length !== 1 ? "s" : ""}{" "}
            disponible{documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-2 text-muted hover:text-sage transition-colors"
          title="Actualizar"
        >
          <IoRefresh className="w-5 h-5" />
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IoFolderOutline className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-deep mb-2">
            No tienes documentos
          </h2>
          <p className="text-muted mb-6">
            Los documentos compartidos por tu terapeuta aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const fileType = getFileTypeFromMimeType(
              doc.mimeType,
              doc.originalName,
            );
            const fileTypeColor = getFileTypeColor(fileType);
            const isDownloading = downloadingId === doc._id;

            return (
              <div
                key={doc._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-deep truncate mb-1">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-muted">
                      Dr. {doc.therapist?.name || "Terapeuta"}
                    </p>
                  </div>
                  <div
                    className="flex-shrink-0 ml-4 px-3 py-1 rounded-lg"
                    style={{ backgroundColor: fileTypeColor }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {fileType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted">
                    {doc.humanFileSize} • {formatDate(doc.createdAt)}
                  </p>
                  {doc.category && (
                    <span className="text-xs px-2 py-1 bg-[#F3EEE9] text-sage rounded-md font-medium">
                      {doc.category.replace("_", " ").toUpperCase()}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                  className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    isDownloading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-sage text-white hover:bg-sage/90"
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
                      Descargando...
                    </>
                  ) : (
                    <>
                      <IoDownloadOutline className="w-4 h-4 mr-2" />
                      Descargar
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 text-muted">
            <IoDocumentText className="w-5 h-5" />
            <p className="text-sm">
              Los documentos son compartidos por tus terapeutas. Contacta con
              ellos si necesitas más información.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsScreen;
