import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KpiCards } from './components/KpiCards';
import { ReviewsFilter } from './components/ReviewsFilter';
import { ReviewsList } from './components/ReviewsList';
import { RatingTrendChart } from './components/RatingTrendChart';
import { AutoResponseModal } from './components/AutoResponseModal';
import { getReviews, getReviewsStats, getRatingTrend, respondToReview, moderateReview } from './reviews.api';
import { notificationService } from '../../services/api/notificationService.js';
import { reviewService } from '../../services/api/reviewService.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AlertCircle, CheckCircle, Info, X, RefreshCw, Star, PartyPopper, Shield, TrendingUp, Lightbulb, MessageSquare } from 'lucide-react';

// Enhanced toast notification system with real-time WebSocket integration
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastIdRef.current;
    const duration = options.duration || (type === 'error' ? 8000 : 5000);
    const persistent = options.persistent || false;

    const toast = {
      id,
      message,
      type,
      timestamp: new Date(),
      persistent,
      action: options.action || null
    };

    setToasts(prev => [...prev, toast]);

    if (!persistent) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    info: (message, options) => addToast(message, 'info', options),
    warning: (message, options) => addToast(message, 'warning', options),
    removeToast,
    clearAll
  };
};

// Simulated real-time notifications using polling (no WebSocket needed)
const usePollingNotifications = (onNotification, pollingInterval = 30000) => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const pollingTimer = useRef(null);
  const lastCheckTime = useRef(Date.now());

  const checkForUpdates = useCallback(async () => {
    try {
      setConnectionStatus('connected');

      // Here you could call an API to check for new notifications
      // For now, we'll just update the timestamp
      lastCheckTime.current = Date.now();

      // Simulate occasional notifications for demo purposes
      if (Math.random() < 0.1) { // 10% chance every poll
        const sampleNotifications = [
          {
            type: 'new_review',
            data: {
              rating: Math.floor(Math.random() * 5) + 1,
              clientName: 'Cliente de prueba',
              reviewId: 'sample-' + Date.now()
            }
          }
        ];

        if (onNotification && sampleNotifications.length > 0) {
          onNotification(sampleNotifications[0]);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      setConnectionStatus('error');
    }
  }, [onNotification]);

  const startPolling = useCallback(() => {
    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
    }

    pollingTimer.current = setInterval(checkForUpdates, pollingInterval);
    setConnectionStatus('connected');
  }, [checkForUpdates, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    connectionStatus,
    reconnect: startPolling,
    disconnect: stopPolling
  };
};

const ToastContainer = ({ toasts, onRemove, onClearAll }) => {
  if (toasts.length === 0) return null;

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.length > 3 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClearAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar todas ({toasts.length})
          </button>
        </div>
      )}

      {toasts.slice(-5).map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg text-white text-sm border-l-4
            animate-slide-in transform transition-all duration-300
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              {getToastIcon(toast.type)}
              <div className="flex-1">
                <p className="font-medium leading-tight">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={toast.action.callback}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </div>

            {!toast.persistent && (
              <button
                onClick={() => onRemove(toast.id)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Connection status indicator (simplified for polling)
const ConnectionStatus = ({ status, onReconnect }) => {
  // Don't show status indicator for polling since it's always "connected"
  if (status === 'connected' || status === 'disconnected') return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 bg-red-100 text-red-800 border border-red-200">
        <AlertCircle className="h-3 w-3" />
        <span>Error en actualizaciones automáticas</span>
        <button
          onClick={onReconnect}
          className="ml-2 underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
};

export const Reviews = () => {
  const [filters, setFilters] = useState({
    ratings: [],
    responded: 'all',
    sortBy: 'newest',
    dateRange: { start: '', end: '' },
    search: '',
    moderationStatus: 'all'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  });

  const [isMobile, setIsMobile] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAutoResponseModal, setShowAutoResponseModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const lastNotificationTime = useRef(Date.now());

  // Inicializar servicios
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await notificationService.initialize();
        await reviewService.initialize();
        console.log('Review services initialized successfully');
        console.log('Data from reviewService:', reviewService);
      } catch (error) {
        console.error('Error initializing review services:', error);
        toast.error('Error al inicializar servicios');
      }
    };

    initializeServices();
  }, [toast]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Real-time notification handler
  const handleRealtimeNotification = useCallback((notification) => {
    const now = Date.now();

    // Prevent duplicate notifications within 1 second
    if (now - lastNotificationTime.current < 1000) return;
    lastNotificationTime.current = now;

    switch (notification.type) {
      case 'new_review':
        // Invalidate queries to fetch fresh data
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        queryClient.invalidateQueries({ queryKey: ['reviewsStats'] });

        const rating = notification.data?.rating || 0;
        const clientName = notification.data?.clientName || 'Un cliente';

        if (rating <= 2) {
          toast.error(
            <>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Nueva reseña {rating}</span>
                <Star className="h-3 w-3 fill-current" />
                <span>de {clientName} - Respuesta urgente requerida</span>
              </div>
            </>,
            {
              duration: 10000,
              action: {
                label: 'Ver reseña',
                callback: () => {
                  // Scroll to review or open modal
                  const reviewElement = document.getElementById(`review-${notification.data.reviewId}`);
                  reviewElement?.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }
          );

          // Add to alerts
          setAlerts(prev => [{
            id: `review-${notification.data.reviewId}`,
            type: 'low_rating',
            priority: 'high',
            message: `Nueva reseña de ${rating} estrellas requiere atención`,
            data: notification.data,
            timestamp: new Date()
          }, ...prev]);

        } else if (rating >= 4) {
          toast.success(
            <div className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4" />
              <span>Nueva reseña positiva ({rating}</span>
              <Star className="h-3 w-3 fill-current" />
              <span>) de {clientName}</span>
            </div>
          );
        } else {
          toast.info(
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Nueva reseña ({rating}</span>
              <Star className="h-3 w-3 fill-current" />
              <span>) de {clientName}</span>
            </div>
          );
        }
        break;

      case 'review_response_needed':
        toast.warning(
          `⏰ Recordatorio: ${notification.data?.reviewsCount || 1} reseñas pendientes de respuesta`,
          { duration: 8000 }
        );
        break;

      case 'moderation_alert':
        toast.error(
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Alerta de moderación: {notification.message}</span>
          </div>,
          { duration: 12000 }
        );
        break;

      case 'sentiment_alert':
        toast.warning(
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Alerta de sentimiento: {notification.message}</span>
          </div>,
          { duration: 8000 }
        );
        break;

      default:
        console.log('Unknown notification type:', notification);
    }
  }, [queryClient, toast]);

  // Polling connection for notifications (no WebSocket needed)
  const { connectionStatus, reconnect } = usePollingNotifications(handleRealtimeNotification, 60000); // Poll every minute

  // Enhanced queries with pagination and error handling
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', filters, pagination],
    queryFn: async () => {
      try {
        console.log('Calling getReviews with filters:', filters, 'pagination:', pagination);
        const result = await getReviews(filters, pagination.page, pagination.limit);
        console.log('Reviews data received:', result);
        return result;
      } catch (error) {
        console.error('Error in getReviews:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for more real-time feel
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Reviews query error:', error);
      toast.error(`Error al cargar reseñas: ${error.message}`);
    }
  });

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['reviewsStats'],
    queryFn: async () => {
      try {
        console.log('Calling getReviewsStats');
        const result = await getReviewsStats({ includeAdvanced: true });
        console.log('Stats data received:', result);
        return result;
      } catch (error) {
        console.error('Error in getReviewsStats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('Stats query error:', error);
      toast.error('Error al cargar estadísticas');
    }
  });

  const { data: trendData, isLoading: trendLoading, error: trendError } = useQuery({
    queryKey: ['ratingTrend'],
    queryFn: async () => {
      try {
        console.log('Calling getRatingTrend');
        const result = await getRatingTrend({ timeframe: '30_days', includeDetails: true });
        console.log('Trend data received:', result);
        return result;
      } catch (error) {
        console.error('Error in getRatingTrend:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error) => {
      console.error('Trend query error:', error);
      toast.error('Error al cargar tendencias');
    }
  });

  // Enhanced mutations with better error handling and audit logging
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, response, options = {} }) =>
      respondToReview(reviewId, response, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviewsStats'] });

      const successMessage = data.moderationResult?.status === 'pending'
        ? 'Respuesta enviada y en revisión por moderación'
        : 'Respuesta enviada correctamente';

      toast.success(successMessage);

      console.log('Review response sent successfully:', {
        reviewId: variables.reviewId,
        responseLength: variables.response.length,
        moderationStatus: data.moderationResult?.status
      });

      // Remove alert if it was for this review
      setAlerts(prev => prev.filter(alert =>
        alert.data?.reviewId !== variables.reviewId
      ));
    },
    onError: (error, variables) => {
      const errorMessage = error.message.includes('moderation')
        ? 'Respuesta bloqueada por moderación automática'
        : 'Error al enviar la respuesta';

      toast.error(errorMessage, {
        action: error.message.includes('moderation') ? {
          label: 'Revisar contenido',
          callback: () => {
            // Could open a modal with moderation details
            console.log('Opening moderation review modal');
          }
        } : null
      });

      console.error('Reply error:', error, {
        reviewId: variables.reviewId,
        errorMessage: error.message
      });
    }
  });

  // Moderation mutation
  const moderationMutation = useMutation({
    mutationFn: ({ reviewId, action, reason }) =>
      moderateReview(reviewId, action, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviewsStats'] });

      const actionLabel = {
        approve: 'aprobada',
        flag: 'marcada para revisión',
        block: 'bloqueada',
        delete: 'eliminada'
      }[variables.action] || 'moderada';

      toast.success(`Reseña ${actionLabel} correctamente`);
    },
    onError: (error, variables) => {
      toast.error(`Error en moderación: ${error.message}`);
      console.error('Moderation error:', error);
    }
  });

  const handleReply = async (reviewId, response, options = {}) => {
    try {
      await replyMutation.mutateAsync({ reviewId, response, options });
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Reply submission failed:', error);
    }
  };

  const handleModerate = async (reviewId, action, reason = '') => {
    try {
      await moderationMutation.mutateAsync({ reviewId, action, reason });
    } catch (error) {
      console.error('Moderation failed:', error);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAutoResponseSelect = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Respuesta copiada al portapapeles');
    setShowAutoResponseModal(false);
  };

  // Automatic alert system for reviews requiring attention
  useEffect(() => {
    if (reviewsData?.reviews) {
      const now = new Date();

      // Find reviews needing immediate attention
      const urgentReviews = reviewsData.reviews.filter(review => {
        const createdAt = new Date(review.createdAt);
        const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);

        return (
          // Low rating without response
          (review.rating <= 2 && !review.response) ||
          // Any review older than 24 hours without response
          (!review.response && hoursSinceCreated > 24) ||
          // Reviews flagged for moderation
          (review.moderationFlags && review.moderationFlags.length > 0)
        );
      });

      // Update alerts state
      const newAlerts = urgentReviews.map(review => {
        const createdAt = new Date(review.createdAt);
        const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);

        let priority = 'medium';
        let message = 'Reseña requiere atención';

        if (review.rating <= 2) {
          priority = 'high';
          message = `Reseña de ${review.rating} estrellas sin responder`;
        } else if (hoursSinceCreated > 48) {
          priority = 'high';
          message = `Reseña sin respuesta por ${Math.floor(hoursSinceCreated)} horas`;
        } else if (review.moderationFlags?.length > 0) {
          priority = 'critical';
          message = 'Reseña marcada para moderación';
        }

        return {
          id: `review-${review.id}`,
          type: 'review_attention',
          priority,
          message,
          data: {
            reviewId: review.id,
            clientName: review.clientName,
            rating: review.rating,
            hoursSinceCreated: Math.floor(hoursSinceCreated)
          },
          timestamp: createdAt
        };
      });

      setAlerts(newAlerts);
    }
  }, [reviewsData]);

  // Auto-refresh data every 2 minutes (more frequent since no WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!reviewsLoading && !statsLoading) {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        queryClient.invalidateQueries({ queryKey: ['reviewsStats'] });
        console.log('Auto-refreshing reviews data...');
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [queryClient, reviewsLoading, statsLoading]);

  return (
    <>
      <ToastContainer
        toasts={toast.toasts}
        onRemove={toast.removeToast}
        onClearAll={toast.clearAll}
      />
      <ConnectionStatus
        status={connectionStatus}
        onReconnect={reconnect}
      />

      <div className="space-y-6 pb-8">
        {/* Critical Alerts Banner */}
        {alerts.filter(alert => alert.priority === 'critical').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Atención Crítica Requerida</span>
            </div>
            <div className="space-y-2">
              {alerts
                .filter(alert => alert.priority === 'critical')
                .slice(0, 3)
                .map(alert => (
                  <div key={alert.id} className="flex items-center justify-between text-sm">
                    <span>{alert.message}</span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-deep">Reseñas</h1>
            <p className="text-gray-600 mt-1">Gestiona las opiniones de tus clientes</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAutoResponseModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors shadow-sm"
            >
              <MessageSquare className="h-4 w-4 text-sage" />
              Respuestas automáticas
            </button>

            {/* Manual refresh button */}
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['reviews'] });
                queryClient.invalidateQueries({ queryKey: ['reviewsStats'] });
                queryClient.invalidateQueries({ queryKey: ['ratingTrend'] });
                toast.info('Actualizando datos...');
              }}
              disabled={reviewsLoading || statsLoading || trendLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-sage hover:bg-sage/90 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${(reviewsLoading || statsLoading || trendLoading) ? 'animate-spin' : ''}`} />
              Actualizar
            </button>

            {statsData && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{statsData.totalReviews}</span>
                  <span>reseñas totales</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{statsData.averageRating.toFixed(1)}</span>
                  <Star className="h-3 w-3 fill-current inline" />
                  <span>promedio</span>
                </div>
                {alerts.length > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">{alerts.length}</span>
                    <span>pendientes</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards stats={statsData} loading={statsLoading} />

        {/* Layout responsive: En móvil, gráfico debajo de KPI */}
        <div className={`grid gap-6 ${
          isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
        }`}>
          {/* Gráfico de tendencia */}
          <div className={isMobile ? 'order-1' : 'lg:col-span-2'}>
            <RatingTrendChart data={trendData} loading={trendLoading} />
          </div>

          {/* Espacio para futuras métricas adicionales en desktop */}
          {!isMobile && (
            <div className="space-y-6">
              {/* Alerts Summary Widget */}
              {alerts.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <h3 className="font-semibold text-deep mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Alertas Activas
                  </h3>
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="text-xs text-gray-700 bg-white/50 rounded p-2">
                        {alert.message}
                      </div>
                    ))}
                    {alerts.length > 3 && (
                      <div className="text-xs text-gray-600 font-medium">
                        +{alerts.length - 3} más...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tip Widget */}
              <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-xl p-6 border border-sage/20">
                <h3 className="font-semibold text-deep mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-sage" />
                  Consejo
                </h3>
                <p className="text-sm text-gray-600">
                  Responde a las reseñas con rating ≤ 3 dentro de las primeras 24 horas para mostrar profesionalismo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <ReviewsFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isMobile={isMobile}
          stats={statsData}
        />

        {/* Lista de reseñas */}
        <ReviewsList
          reviews={reviewsData?.reviews || []}
          loading={reviewsLoading}
          error={reviewsError}
          onReply={handleReply}
          onModerate={handleModerate}
          pagination={{
            current: pagination.page,
            total: reviewsData?.totalPages || 1,
            hasNext: reviewsData?.hasNextPage || false,
            hasPrevious: reviewsData?.hasPreviousPage || false,
            onChange: handlePageChange
          }}
          alerts={alerts}
          moderationLoading={moderationMutation.isLoading}
        />

        {showAutoResponseModal && (
          <AutoResponseModal
            onSelect={handleAutoResponseSelect}
            onClose={() => setShowAutoResponseModal(false)}
          />
        )}
      </div>
    </>
  );
};