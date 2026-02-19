import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../../../services/api/paymentService';
import { bookingService } from '../../../services/api/bookingService';
import { chatService } from '../../../services/api/chatService';
import { reviewService } from '../../../services/api/reviewService';
import { notificationService } from '../../../services/api/notificationService';
import { subscriptionService } from '../../../services/api/subscriptionService';
import { documentService } from '../../../services/api/documentService';

export const useDashboardData = () => {
  const [data, setData] = useState({
    metrics: null,
    alerts: [],
    appointments: [],
    incomeData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para calcular el total de ingresos de un array de pagos
  const calculateTotalIncome = (payments) => {
    return payments.reduce((total, payment) => {
      // Sumar todos los pagos independientemente del estado
      return total + (payment.amount || 0);
    }, 0);
  };

  // Función para calcular rating promedio de las estadísticas de reseñas
  const calculateAverageRatingFromStats = (stats) => {
    if (!stats) return '4.8';

    // Si viene directamente el promedio
    if (stats.averageRating !== undefined) {
      return Number(stats.averageRating).toFixed(1);
    }

    // Si viene una distribución de ratings
    if (stats.ratingDistribution) {
      let totalRating = 0;
      let totalReviews = 0;

      Object.entries(stats.ratingDistribution).forEach(([rating, count]) => {
        totalRating += Number(rating) * Number(count);
        totalReviews += Number(count);
      });

      if (totalReviews > 0) {
        return (totalRating / totalReviews).toFixed(1);
      }
    }

    // Si viene un array de reseñas
    if (stats.reviews && Array.isArray(stats.reviews)) {
      const total = stats.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      return stats.reviews.length > 0 ? (total / stats.reviews.length).toFixed(1) : '4.8';
    }

    // Si viene estadísticas agregadas
    if (stats.totalRating && stats.totalReviews) {
      return (stats.totalRating / stats.totalReviews).toFixed(1);
    }

    return '4.8'; // Fallback
  };

  // Función para procesar pagos directamente y crear datos para el gráfico
  const processPaymentsForChart = (payments) => {
    console.log('Processing payments for chart:', payments);

    // Crear estructura base para los últimos 6 meses
    const now = new Date();
    const monthlyData = {};

    // Inicializar los últimos 6 meses con valores en 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' });

      monthlyData[monthKey] = {
        month: monthName,
        completed: 0,
        pending: 0,
        processing: 0,
        failed: 0,
        cancelled: 0,
        total: 0,
        date: date // Guardamos la fecha para ordenar
      };
    }

    // Procesar los pagos reales y sumarlos a los meses correspondientes
    payments.forEach(payment => {
      const date = new Date(payment.createdAt || payment.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      // Solo procesar si el pago está dentro del rango de 6 meses
      if (monthlyData[monthKey]) {
        const amount = payment.amount || 0;
        const status = payment.status || 'pending';

        // Sumar al estado correspondiente
        switch (status) {
          case 'completed':
            monthlyData[monthKey].completed += amount;
            break;
          case 'pending':
            monthlyData[monthKey].pending += amount;
            break;
          case 'processing':
            monthlyData[monthKey].processing += amount;
            break;
          case 'failed':
            monthlyData[monthKey].failed += amount;
            break;
          case 'cancelled':
            monthlyData[monthKey].cancelled += amount;
            break;
          default:
            monthlyData[monthKey].pending += amount; // Default a pending
        }

        monthlyData[monthKey].total += amount;
      }
    });

    // Convertir a array y ordenar por fecha
    const result = Object.values(monthlyData)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(item => {
        // Remover la fecha auxiliar antes de retornar
        const { date, ...monthData } = item;
        return monthData;
      });

    console.log('Processed chart data with all 6 months:', result);
    return result;
  };

  // Función para procesar estadísticas financieras del servicio de pagos
  const processFinancialStatistics = (stats) => {
    console.log('Processing financial statistics:', stats);
    
    // Manejar estructura de respuesta del backend: { data: { monthlyRevenue: [...] } }
    const data = stats.data || stats;
    
    // Procesar monthlyRevenue del backend (estructura: [{ month: 1, totalAmount: 300, count: 2 }, ...])
    if (data.monthlyRevenue && Array.isArray(data.monthlyRevenue)) {
      console.log('Using monthlyRevenue from backend:', data.monthlyRevenue);
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      
      // Crear array con los últimos 6 meses
      const now = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          monthIndex: d.getMonth(),
          monthName: monthNames[d.getMonth()],
          year: d.getFullYear()
        });
      }
      
      // Mapear los datos del backend a los últimos 6 meses
      return last6Months.map(({ monthIndex, monthName }) => {
        const monthData = data.monthlyRevenue.find(m => m.month === monthIndex + 1);
        return {
          month: monthName,
          completed: monthData ? Math.round(monthData.totalAmount * 0.8) : 0, // 80% completados
          pending: monthData ? Math.round(monthData.totalAmount * 0.15) : 0,  // 15% pendientes
          processing: monthData ? Math.round(monthData.totalAmount * 0.04) : 0, // 4% procesando
          failed: monthData ? Math.round(monthData.totalAmount * 0.01) : 0,   // 1% fallidos
          cancelled: 0,
          total: monthData ? monthData.totalAmount : 0
        };
      });
    }
    
    if (data.monthlyBreakdown && Array.isArray(data.monthlyBreakdown)) {
      return data.monthlyBreakdown.map(monthData => ({
        month: new Date(monthData.date || monthData.month).toLocaleDateString('es-ES', { month: 'short' }),
        completed: monthData.statusBreakdown?.completed || 0,
        pending: monthData.statusBreakdown?.pending || 0,
        processing: monthData.statusBreakdown?.processing || 0,
        failed: monthData.statusBreakdown?.failed || 0,
        cancelled: monthData.statusBreakdown?.cancelled || 0,
        total: monthData.totalAmount || monthData.amount || 0
      }));
    }

    if (data.dailyBreakdown && Array.isArray(data.dailyBreakdown)) {
      // Agrupar por mes si tenemos datos diarios
      const monthlyTotals = {};
      data.dailyBreakdown.forEach(dayData => {
        const date = new Date(dayData.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });

        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = {
            month: monthName,
            completed: 0,
            pending: 0,
            processing: 0,
            failed: 0,
            cancelled: 0,
            total: 0
          };
        }

        // Si hay breakdown por estado
        if (dayData.statusBreakdown) {
          monthlyTotals[monthKey].completed += dayData.statusBreakdown.completed || 0;
          monthlyTotals[monthKey].pending += dayData.statusBreakdown.pending || 0;
          monthlyTotals[monthKey].processing += dayData.statusBreakdown.processing || 0;
          monthlyTotals[monthKey].failed += dayData.statusBreakdown.failed || 0;
          monthlyTotals[monthKey].cancelled += dayData.statusBreakdown.cancelled || 0;
        }

        monthlyTotals[monthKey].total += dayData.totalAmount || dayData.amount || 0;
      });

      return Object.values(monthlyTotals);
    }

    // Si no hay estructura reconocible, retornar array vacío para mostrar "No hay datos"
    console.log('No recognized data structure found, returning empty array');
    return [];
  };

  // Funciones de fallback para datos de ejemplo
  const generateFallbackIncomeData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
      const total = Math.floor(Math.random() * 1000) + 1800;
      const completed = Math.floor(total * 0.8); // 80% completados
      const pending = Math.floor(total * 0.15); // 15% pendientes
      const processing = Math.floor(total * 0.04); // 4% procesando
      const failed = total - completed - pending - processing; // resto fallidos

      months.push({
        month: monthName,
        completed,
        pending,
        processing,
        failed,
        cancelled: 0,
        total
      });
    }
    return months;
  };

  const generateFallbackAppointments = () => {
    return [
      { date: new Date(), count: 3 },
      { date: new Date(Date.now() + 86400000), count: 2 },
      { date: new Date(Date.now() + 259200000), count: 1 },
      { date: new Date(Date.now() + 432000000), count: 4 }
    ];
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Inicializar servicios si es necesario
      if (!paymentService.isInitialized) {
        await paymentService.initialize();
      }

      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Cargar datos reales de pagos e ingresos
      // Obtener pagos de los últimos 6 meses para el gráfico
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [
        monthlyPayments,
        chartPayments,
        weeklyAppointments,
        unreadChats,
        avgRating,
        recentReviews,
        upcomingAppointments,
        pendingDocuments,
        subscriptionData,
        monthlyIncome,
        calendarData
      ] = await Promise.allSettled([
        // Obtener todos los pagos del mes actual (sin filtro de estado)
        paymentService.getPayments({
          dateFrom: startOfMonth.toISOString(),
          dateTo: endOfMonth.toISOString()
          // Sin filtro de estado para obtener todos los pagos
        }),
        // Obtener pagos de los últimos 6 meses para el gráfico
        paymentService.getPayments({
          dateFrom: sixMonthsAgo.toISOString(),
          dateTo: endOfMonth.toISOString()
          // Sin filtro de estado para obtener todos los pagos
        }),
        // Citas de la semana (usando bookingService si está disponible)
        bookingService.getBookings ? bookingService.getBookings({
          dateFrom: startOfWeek.toISOString(),
          dateTo: endOfWeek.toISOString()
        }) : Promise.resolve([]),
        // Chats no leídos
        chatService.getUnreadChats ? chatService.getUnreadChats() : Promise.resolve([]),
        // Rating promedio de reseñas
        reviewService.getReviewStatistics({}, { groupBy: 'rating' }),
        // Reseñas recientes sin responder
        reviewService.getReviews({
          status: reviewService.reviewStatus?.APPROVED,
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // últimos 7 días
        }, { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        // Próximas citas
        bookingService.getUpcomingAppointments ? bookingService.getUpcomingAppointments() : Promise.resolve([]),
        // Documentos pendientes
        documentService.getPendingDocuments ? documentService.getPendingDocuments() : Promise.resolve([]),
        // Datos de suscripción
        subscriptionService.getCurrentSubscription ? subscriptionService.getCurrentSubscription() : Promise.resolve(null),
        // Estadísticas financieras para gráfico de ingresos
        paymentService.getFinancialStatistics({
          dateFrom: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString(),
          dateTo: endOfMonth.toISOString(),
          groupBy: 'month'
        }),
        // Datos del calendario
        bookingService.getCalendarData ? bookingService.getCalendarData({
          dateFrom: new Date().toISOString(),
          dateTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }) : Promise.resolve([])
      ]);

      // Console logs para debug
      console.log('Monthly payments response:', monthlyPayments);
      console.log('Monthly payments data:', monthlyPayments.value);
      console.log('Payments array:', monthlyPayments.value?.payments);
      console.log('Chart payments response:', chartPayments);
      console.log('Chart payments data:', chartPayments.value?.payments);

      const paymentsArray = monthlyPayments.value?.payments || [];
      const calculatedTotal = calculateTotalIncome(paymentsArray);
      console.log('Calculated total income:', calculatedTotal);
      console.log('Individual payment amounts:', paymentsArray.map(p => ({ amount: p.amount, status: p.status })));

      console.log('Monthly income statistics:', monthlyIncome);
      console.log('Monthly income data:', monthlyIncome.value);
      console.log('Review statistics response:', avgRating);
      console.log('Review statistics data:', avgRating.value);
      console.log('Recent reviews response:', recentReviews);
      console.log('Recent reviews data:', recentReviews.value);

      // Procesar métricas con fallbacks
      const metrics = {
        monthlyIncome: monthlyPayments.status === 'fulfilled'
          ? `€${calculateTotalIncome(monthlyPayments.value?.payments || []).toLocaleString()}`
          : '€0',
        weeklyAppointments: weeklyAppointments.status === 'fulfilled'
          ? weeklyAppointments.value?.length || 0
          : 0,
        unreadMessages: unreadChats.status === 'fulfilled'
          ? unreadChats.value?.length || 0
          : 0,
        averageRating: avgRating.status === 'fulfilled'
          ? calculateAverageRatingFromStats(avgRating.value)
          : '4.8'
      };

      // Procesar alertas
      const alerts = [];

      // Reseñas recientes sin responder
      if (recentReviews.status === 'fulfilled' && recentReviews.value?.data?.reviews) {
        const reviewsWithoutResponse = recentReviews.value.data.reviews.filter(review =>
          !review.response || !review.hasResponse
        );

        if (reviewsWithoutResponse.length > 0) {
          const latestReview = reviewsWithoutResponse[0];
          alerts.push({
            id: `review_${latestReview.id || latestReview.reviewId}`,
            type: 'review',
            priority: latestReview.rating <= 3 ? 'high' : 'medium',
            message: latestReview.rating <= 3 ? 'Reseña negativa necesita respuesta' : 'Nueva reseña pendiente de responder',
            time: `${latestReview.rating} ★ - ${latestReview.reviewerName || latestReview.clientName || 'Cliente'}`,
            clientName: latestReview.reviewerName || latestReview.clientName,
            action: () => window.location.href = '/app/reseñas'
          });
        }
      }

      // Próximas citas
      if (upcomingAppointments.status === 'fulfilled' && upcomingAppointments.value?.length > 0) {
        const nextAppointment = upcomingAppointments.value[0];
        const appointmentTime = new Date(nextAppointment.startTime);
        const timeDiff = appointmentTime.getTime() - new Date().getTime();

        if (timeDiff <= 30 * 60 * 1000 && timeDiff > 0) { // Próxima cita en 30 minutos
          alerts.push({
            id: `appointment_${nextAppointment.id}`,
            type: 'appointment',
            priority: 'high',
            message: `Próxima sesión en ${Math.round(timeDiff / (60 * 1000))} minutos`,
            time: `${appointmentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${nextAppointment.clientName}`,
            clientName: nextAppointment.clientName,
            action: () => window.location.href = '/app/reservas'
          });
        }
      }

      // Documentos pendientes
      if (pendingDocuments.status === 'fulfilled' && pendingDocuments.value?.length > 0) {
        const pendingDoc = pendingDocuments.value[0];
        alerts.push({
          id: `document_${pendingDoc.id}`,
          type: 'document',
          priority: 'medium',
          message: 'Documento pendiente de firmar',
          time: `${pendingDoc.type || 'Documento'} - ${pendingDoc.clientName || 'Cliente'}`,
          clientName: pendingDoc.clientName,
          action: () => window.location.href = '/app/documentos-materiales'
        });
      }

      // Suscripción
      if (subscriptionData.status === 'fulfilled' && subscriptionData.value) {
        const subscription = subscriptionData.value;
        const expiryDate = new Date(subscription.expiresAt);
        const daysDiff = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));

        if (daysDiff <= 7) {
          alerts.push({
            id: `subscription_${subscription.id}`,
            type: 'subscription',
            priority: daysDiff <= 3 ? 'high' : 'medium',
            message: `Suscripción vence en ${daysDiff} días`,
            time: `${subscription.planName || 'Plan'} - Renovar antes del ${expiryDate.toLocaleDateString('es-ES')}`,
            clientName: null,
            action: () => window.location.href = '/app/planes-suscripcion'
          });
        }
      }

      // Procesar datos de ingresos para el gráfico
      console.log('Processing income data...');
      console.log('monthlyIncome.status:', monthlyIncome.status);
      console.log('monthlyIncome.value:', monthlyIncome.value);

      let incomeData = [];

      // Priorizar pagos reales sobre estadísticas agregadas para mayor precisión
      if (chartPayments.status === 'fulfilled' && chartPayments.value?.payments && chartPayments.value.payments.length > 0) {
        console.log('Using real chart payments data (6 months) to generate chart');
        incomeData = processPaymentsForChart(chartPayments.value.payments);
      } else if (monthlyPayments.status === 'fulfilled' && monthlyPayments.value?.payments && monthlyPayments.value.payments.length > 0) {
        console.log('Using real monthly payments data to generate chart');
        incomeData = processPaymentsForChart(monthlyPayments.value.payments);
      } else if (monthlyIncome.status === 'fulfilled' && monthlyIncome.value) {
        console.log('Using financial statistics data');
        incomeData = processFinancialStatistics(monthlyIncome.value);
      } else {
        console.log('No data available, using empty array');
        incomeData = [];
      }

      console.log('Final income data for chart:', incomeData);

      // Procesar datos del calendario
      const appointments = calendarData.status === 'fulfilled' && calendarData.value
        ? calendarData.value.map(day => ({
            date: new Date(day.date),
            count: day.appointments?.length || 0
          }))
        : generateFallbackAppointments();

      setData({
        metrics,
        alerts,
        appointments,
        incomeData
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Error al cargar los datos del dashboard');

      // Si falla la carga de datos reales, usar datos de fallback
      setData({
        metrics: {
          monthlyIncome: '€0',
          weeklyAppointments: 0,
          unreadMessages: 0,
          averageRating: '4.8'
        },
        alerts: [],
        appointments: generateFallbackAppointments(),
        incomeData: generateFallbackIncomeData()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Función para refrescar datos
  const refresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    data,
    loading,
    error,
    refresh
  };
};