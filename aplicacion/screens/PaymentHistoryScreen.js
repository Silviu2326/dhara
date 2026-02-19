import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PAYMENTS } from '../services/mockData';

const PaymentHistoryScreen = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api';

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Format currency
  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get payment status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#8CA48F';
      case 'pending':
        return '#D58E6E';
      case 'failed':
        return '#FF6B6B';
      default:
        return '#A2B2C2';
    }
  };

  // Get payment status text
  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  // Get payment method text
  const getMethodText = (method) => {
    switch (method.toLowerCase()) {
      case 'card':
        return 'Tarjeta';
      case 'paypal':
        return 'PayPal';
      case 'transfer':
        return 'Transferencia';
      case 'cash':
        return 'Efectivo';
      case 'stripe':
        return 'Stripe';
      case 'online':
        return 'Online';
      case 'other':
        return 'Otro';
      default:
        return method;
    }
  };

  // Fetch client payments
  const fetchPayments = async (pageNumber = 1, append = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data
      const newPayments = MOCK_PAYMENTS.map(payment => ({
        ...payment,
        createdAt: payment.date,
        currency: 'EUR',
        method: 'card'
      }));

      if (append) {
        setPayments(prev => [...prev, ...newPayments]);
      } else {
        setPayments(newPayments);
      }

      // Mock pagination
      setHasMore(false);

    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment summary
  const fetchSummary = async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setSummary({
        totalSpent: 120,
        totalPayments: 2,
        monthlySpent: 60,
        pendingPayments: 0,
        currency: 'EUR'
      });
    } catch (error) {
      console.error('❌ Error fetching summary:', error);
    }
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    setPage(1);
    await Promise.all([fetchPayments(1), fetchSummary()]);
    setLoading(false);
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData();
    setRefreshing(false);
  };

  // Load more payments
  const loadMore = async () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchPayments(nextPage, true);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [user]);

  // Loading state
  if (loading && payments.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8CA48F" />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && payments.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          Historial de Pagos {payments.length > 0 && `(${payments.length})`}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#8CA48F" />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      {Object.keys(summary).length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalSpent, summary.currency)}
            </Text>
            <Text style={styles.summaryLabel}>Total Gastado</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalPayments}</Text>
            <Text style={styles.summaryLabel}>Pagos Realizados</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.monthlySpent, summary.currency)}
            </Text>
            <Text style={styles.summaryLabel}>Este Mes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.pendingPayments}</Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.paymentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={60} color="#8CA48F" />
            <Text style={styles.emptyTitle}>Sin pagos aún</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán todos los pagos que realices por servicios de terapia.
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment._id} style={styles.paymentItem}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>
                <Text style={[styles.paymentStatus, { backgroundColor: getStatusColor(payment.status) }]}>
                  {getStatusText(payment.status)}
                </Text>
              </View>

              <Text style={styles.paymentAmount}>
                {formatCurrency(payment.amount, payment.currency)} • {payment.description || 'Sesión de Terapia'}
              </Text>

              <Text style={styles.paymentMethod}>Método: {getMethodText(payment.method)}</Text>

              {payment.therapist && (
                <Text style={styles.therapistName}>
                  Terapeuta: {payment.therapist.name}
                </Text>
              )}

              {payment.booking && (
                <Text style={styles.bookingInfo}>
                  Cita: {formatDate(payment.booking.date)} - {payment.booking.serviceType}
                </Text>
              )}
            </View>
          ))
        )}

        {hasMore && payments.length > 0 && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            {loading ? (
              <ActivityIndicator size="small" color="#8CA48F" />
            ) : (
              <Text style={styles.loadMoreText}>Cargar más pagos</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3A4A'
  },
  refreshButton: {
    padding: 8,
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },

  // Summary container
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8CA48F',
    marginBottom: 4
  },
  summaryLabel: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center'
  },

  // Payments list
  paymentsList: {
    flex: 1
  },
  paymentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3A4A'
  },
  paymentStatus: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500'
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4
  },
  paymentMethod: {
    fontSize: 14,
    color: '#A2B2C2',
    marginBottom: 4
  },
  therapistName: {
    fontSize: 14,
    color: '#8CA48F',
    fontWeight: '500',
    marginBottom: 4
  },
  bookingInfo: {
    fontSize: 12,
    color: '#A2B2C2'
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginTop: 20,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24
  },

  // Load more button
  loadMoreButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  loadMoreText: {
    color: '#8CA48F',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PaymentHistoryScreen;