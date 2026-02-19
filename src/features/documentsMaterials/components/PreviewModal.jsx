import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { fileTypeUtils } from './TypeChips';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Componente para vista previa de PDF
const PDFPreview = ({ url, filename }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando PDF...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600 mb-2">No se pudo cargar el PDF</p>
            <p className="text-sm text-gray-500">{filename}</p>
            <button 
              onClick={() => window.open(url, '_blank')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Abrir en nueva pestaña
            </button>
          </div>
        </div>
      )}
      
      {!error && (
        <iframe
          src={url}
          className={`w-full flex-1 border-0 ${loading ? 'hidden' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          title={filename}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )}
    </div>
  );
};

// Componente para vista previa de imágenes
const ImagePreview = ({ url, filename }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controles de zoom */}
      <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 border-b">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MagnifyingGlassMinusIcon className="w-4 h-4" />
        </button>
        
        <span className="text-sm text-gray-600 min-w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MagnifyingGlassPlusIcon className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleResetZoom}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowsPointingOutIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Imagen */}
      <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center">
        {loading && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando imagen...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600 mb-2">No se pudo cargar la imagen</p>
            <p className="text-sm text-gray-500">{filename}</p>
          </div>
        )}
        
        <img
          src={url}
          alt={filename}
          className={`max-w-full max-h-full object-contain transition-transform ${
            zoom > 1 ? 'cursor-move' : 'cursor-zoom-in'
          } ${loading || error ? 'hidden' : ''}`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onMouseDown={handleMouseDown}
          onClick={zoom === 1 ? handleZoomIn : undefined}
          draggable={false}
        />
      </div>
    </div>
  );
};

// Componente para vista previa de audio
const AudioPreview = ({ url, filename }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SpeakerWaveIcon className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{filename}</h3>
          <p className="text-sm text-gray-500">Archivo de audio</p>
        </div>
        
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* Controles de reproducción */}
        <div className="space-y-4">
          {/* Barra de progreso */}
          <div className="space-y-2">
            <div
              className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-2 bg-purple-600 rounded-full transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Botones de control */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6 ml-1" />
              )}
            </button>
          </div>
          
          {/* Control de volumen */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-gray-800"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-5 h-5" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para vista previa de vídeo
const VideoPreview = ({ url, filename }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        src={url}
        controls
        className="max-w-full max-h-full"
        preload="metadata"
      >
        Tu navegador no soporta la reproducción de vídeo.
      </video>
    </div>
  );
};

// Componente para archivos no soportados
const UnsupportedPreview = ({ document: documentData }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">{documentData.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{documentData.filename}</p>
        <p className="text-sm text-gray-600 mb-6">
          Vista previa no disponible para este tipo de archivo
        </p>
        
        <button
          onClick={() => window.open(documentData.url, '_blank')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Descargar archivo
        </button>
      </div>
    </div>
  );
};

export const PreviewModal = ({ 
  isOpen, 
  onClose, 
  document: selectedDocument, 
  documents = [], 
  onDownload, 
  onResend, 
  onDelete 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (selectedDocument && documents.length > 0) {
      const index = documents.findIndex(doc => doc.id === selectedDocument.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [selectedDocument, documents]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < documents.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, documents.length, onClose]);

  if (!isOpen || !selectedDocument) return null;

  const currentDocument = documents[currentIndex] || selectedDocument;
  const fileType = fileTypeUtils.getFileType(currentDocument.filename);
  const canNavigate = documents.length > 1;

  const renderPreview = () => {
    switch (fileType) {
      case 'pdf':
        return <PDFPreview url={currentDocument.url} filename={currentDocument.filename} />;
      case 'image':
        return <ImagePreview url={currentDocument.url} filename={currentDocument.filename} />;
      case 'audio':
        return <AudioPreview url={currentDocument.url} filename={currentDocument.filename} />;
      case 'video':
        return <VideoPreview url={currentDocument.url} filename={currentDocument.filename} />;
      default:
        return <UnsupportedPreview document={currentDocument} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {currentDocument.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{currentDocument.filename}</span>
                <span>{formatFileSize(currentDocument.size || 0)}</span>
                <span>{formatDate(currentDocument.createdAt)}</span>
                {canNavigate && (
                  <span>{currentIndex + 1} de {documents.length}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navegación */}
            {canNavigate && (
              <>
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setCurrentIndex(Math.min(documents.length - 1, currentIndex + 1))}
                  disabled={currentIndex === documents.length - 1}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
              </>
            )}
            
            {/* Acciones */}
            <button
              onClick={() => onDownload(currentDocument)}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Descargar"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
            
            {currentDocument.client && (
              <button
                onClick={() => onResend(currentDocument)}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Reenviar al cliente"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={() => onDelete(currentDocument)}
              className="p-2 text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;