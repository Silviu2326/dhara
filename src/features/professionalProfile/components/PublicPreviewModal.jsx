import React from 'react';
import { X, Star, MapPin, Clock, DollarSign, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '../../../components/Button';

export const PublicPreviewModal = ({ isOpen, onClose, profileData, stats = {} }) => {
  if (!isOpen) return null;

  const {
    avatar,
    banner,
    name = 'Dr. Nombre Apellido',
    about = '',
    therapies = [],
    credentials = [],
    rates = {},
    workLocations = [],
    isAvailable = false
  } = profileData || {};

  const selectedCurrency = rates.currency || 'EUR';
  const currencySymbol = selectedCurrency === 'EUR' ? '€' : '$';

  const formatPrice = (price) => {
    if (!price) return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return null;
    return `${currencySymbol}${numPrice.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Obtener datos reales de las estadísticas
  const publicData = {
    rating: stats.averageRating || 0,
    reviewCount: stats.totalReviews || 0,
    location: workLocations.length > 0 ? workLocations[0].city : '',
    responseTime: stats.responseTime ? (stats.responseTime < 1 ? '< 1 hora' : `${Math.round(stats.responseTime)} horas`) : '',
    completedSessions: stats.totalSessions || 0
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-deep">Vista previa pública</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar vista previa"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Banner */}
          {banner && (
            <div className="w-full h-48 rounded-lg overflow-hidden mb-6">
              <img src={banner} alt="Banner del perfil" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header del perfil */}
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl font-bold">
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-deep">{name}</h1>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{publicData.rating}</span>
                      <span>({publicData.reviewCount} reseñas)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{publicData.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Responde en {publicData.responseTime}</span>
                    </div>
                    <div>
                      <span>{publicData.completedSessions} sesiones completadas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sobre mí */}
              {about && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-deep mb-3">Sobre mí</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {about.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Especialidades */}
              {therapies.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-deep mb-3">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {therapies.map((therapy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sage/10 text-sage border border-sage/20"
                      >
                        {therapy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Formación */}
              {credentials.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-deep mb-3">Formación y Credenciales</h3>
                  <div className="space-y-3">
                    {credentials.map((credential, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{credential.title}</h4>
                        <p className="text-gray-600">{credential.institution}</p>
                        <p className="text-sm text-gray-500">{credential.year}</p>
                        {credential.description && (
                          <p className="text-sm text-gray-600 mt-2">{credential.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tarifas */}
              {(rates.sessionPrice || rates.packagePrice) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-deep mb-4 flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Tarifas</span>
                  </h3>
                  <div className="space-y-3">
                    {rates.sessionPrice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sesión (50 min)</span>
                        <span className="font-semibold text-deep">{formatPrice(rates.sessionPrice)}</span>
                      </div>
                    )}
                    {rates.packagePrice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pack 4 sesiones</span>
                        <span className="font-semibold text-deep">{formatPrice(rates.packagePrice)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <Button className="w-full bg-sage text-white hover:bg-sage/90 py-3 rounded-lg flex items-center justify-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Reservar cita</span>
                  </Button>
                  <Button className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg flex items-center justify-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Enviar mensaje</span>
                  </Button>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Información adicional</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Idiomas:</span>
                    <span>Español, Inglés</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modalidad:</span>
                    <span>Presencial, Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experiencia:</span>
                    <span>8+ años</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Esta es una vista previa de cómo los clientes verán tu perfil público.
          </p>
        </div>
      </div>
    </div>
  );
};