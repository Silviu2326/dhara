import { bookingService } from '../../services/api/bookingService';
import { paymentService } from '../../services/api/paymentService';
import { clientService } from '../../services/api/clientService';

export const getDashboardStats = async () => {
  try {
    // Fetch data in parallel for better performance
    const [bookingsResult, paymentsResult, clientsResult] = await Promise.allSettled([
      bookingService.getAppointments({ limit: 100 }),
      paymentService.getTransactionHistory({ limit: 100 }),
      clientService.getClients({ limit: 100 })
    ]);

    // Extract data with fallbacks
    const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.appointments || [] : [];
    const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value.transactions || [] : [];
    const clients = clientsResult.status === 'fulfilled' ? clientsResult.value.clients || [] : [];

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = bookings.filter(b => {
      const bookingDate = new Date(b.dateTime || b.date);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    }).length;

    const activeClients = clients.filter(c => c.status === 'active').length;

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyRevenue = payments
      .filter(p => {
        const paymentDate = new Date(p.createdAt || p.date);
        return paymentDate.getMonth() === currentMonth &&
               paymentDate.getFullYear() === currentYear &&
               p.status === 'completed';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      todayAppointments,
      activeClients,
      monthlyRevenue,
      rating: 4.9, // This would come from reviewService in a full implementation
      totalBookings: bookings.length,
      totalPayments: payments.length
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values on error
    return {
      todayAppointments: 0,
      activeClients: 0,
      monthlyRevenue: 0,
      rating: 0,
      totalBookings: 0,
      totalPayments: 0
    };
  }
};

export const getRecentActivity = async () => {
  try {
    // Fetch recent bookings and payments
    const [bookingsResult, paymentsResult] = await Promise.allSettled([
      bookingService.getAppointments({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
      paymentService.getTransactionHistory({ limit: 10 })
    ]);

    const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.appointments || [] : [];
    const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value.transactions || [] : [];

    // Combine and format activities
    const activities = [
      ...bookings.map(b => ({
        id: b.id || b._id,
        type: 'booking',
        description: `Nueva cita programada`,
        date: b.createdAt || b.dateTime,
        data: b
      })),
      ...payments.map(p => ({
        id: p.id || p._id,
        type: 'payment',
        description: `Pago recibido: €${p.amount}`,
        date: p.createdAt || p.date,
        data: p
      }))
    ];

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return activities.slice(0, 10);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

export const getUpcomingAppointments = async () => {
  try {
    const now = new Date();
    const result = await bookingService.getAppointments({
      dateFrom: now.toISOString(),
      status: 'scheduled,confirmed',
      sortBy: 'dateTime',
      sortOrder: 'asc',
      limit: 10
    });

    return result.appointments || [];
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return [];
  }
};