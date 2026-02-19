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
import { notificationService } from '../services/notificationService';

const NotificationsScreen = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} día${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      const options = {
        day: '2-digit',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      };
      return date.toLocaleDateString('es-ES', options);
    }
  };

  // Get notification color by type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'appointment': return '#8CA48F';
      case 'message': return '#A2B2C2';
      case 'document': return '#D58E6E';
      case 'payment': return '#8CA48F';
      case 'system': return '#C9A2A6';
      case 'review': return '#D58E6E';
      case 'reminder': return '#D58E6E';
      case 'cancellation': return '#FF6B6B';
      default: return '#A2B2C2';
    }
  };

  // Get notification icon by type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment': return 'calendar';
      case 'message': return 'chatbubble';
      case 'document': return 'document-text';
      case 'payment': return 'card';
      case 'system': return 'settings';
      case 'review': return 'star';
      case 'reminder': return 'alarm';
      case 'cancellation': return 'close-circle';
      default: return 'notifications';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#FF6B6B';
      case 'high': return '#FF9800';
      case 'medium': return '#8CA48F';
      case 'low': return '#A2B2C2';
      default: return '#A2B2C2';
    }
  };

  // Fetch client notifications
  const fetchNotifications = async (pageNumber = 1, append = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      console.log('🔔 Fetching client notifications...');
      console.log('📄 Page:', pageNumber);

      const response = await notificationService.getClientNotifications(20, pageNumber);

      if (response.success) {
        const newNotifications = response.data.notifications || [];
        console.log('✅ Notifications loaded:', newNotifications.length);

        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        // Update counts
        setUnreadCount(response.data.unreadCount || 0);
        setTotalCount(response.data.totalCount || 0);

        // Simple pagination - assume more if we got full page
        setHasMore(newNotifications.length === 20);
      } else {
        throw new Error(response.error || 'Error al cargar las notificaciones');
      }

    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setError(error.message || 'Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);

      if (response.success) {
        // Update local state
        setNotifications(prev => prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ));
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  };

  // Dismiss notification (remove from list)
  const dismissNotification = async (notificationId) => {
    try {
      // For now, just remove from local state since we don't have dismiss endpoint
      setNotifications(prev => prev.filter(notification => notification._id !== notificationId));

      // Update counts
      const dismissedNotification = notifications.find(n => n._id === notificationId);
      if (dismissedNotification && !dismissedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setTotalCount(prev => Math.max(0, prev - 1));

      Alert.alert('Éxito', 'Notificación descartada');
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
      Alert.alert('Error', 'No se pudo descartar la notificación');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();

      if (response.success) {
        // Update all notifications as read
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        })));
        setUnreadCount(0);
        Alert.alert('Éxito', 'Todas las notificaciones han sido marcadas como leídas');
      } else {
        Alert.alert('Error', response.error || 'No se pudieron marcar todas las notificaciones como leídas');
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      Alert.alert('Error', 'No se pudieron marcar todas las notificaciones como leídas');
    }
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    setPage(1);
    await fetchNotifications(1);
    setLoading(false);
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData();
    setRefreshing(false);
  };

  // Load more notifications
  const loadMore = async () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchNotifications(nextPage, true);
    }
  };

  // Handle notification press
  const handleNotificationPress = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Handle action URL if exists
    if (notification.actionUrl) {
      // TODO: Implement navigation to action URL
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [user]);

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8CA48F" />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && notifications.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
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
          Notificaciones {notifications.length > 0 && `(${notifications.length})`}
        </Text>
        <View style={styles.headerButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Ionicons name="checkmark-done" size={16} color="#8CA48F" />
              <Text style={styles.markAllText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#8CA48F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Counts Summary */}
      {totalCount > 0 && (
        <View style={styles.countsContainer}>
          <View style={styles.countItem}>
            <Text style={styles.countValue}>{totalCount}</Text>
            <Text style={styles.countLabel}>Total</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countValue, { color: '#FF9800' }]}>{unreadCount}</Text>
            <Text style={styles.countLabel}>Sin leer</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countValue, { color: '#8CA48F' }]}>{totalCount - unreadCount}</Text>
            <Text style={styles.countLabel}>Leídas</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countValue, { color: '#A2B2C2' }]}>{notifications.length}</Text>
            <Text style={styles.countLabel}>Mostradas</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={60} color="#8CA48F" />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán todas tus notificaciones importantes.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification._id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationLeft}>
                <View style={[
                  styles.notificationIcon,
                  { backgroundColor: getNotificationColor(notification.type) }
                ]}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={18}
                    color="white"
                  />
                </View>
                {notification.priority === 'high' || notification.priority === 'critical' ? (
                  <View style={[
                    styles.priorityIndicator,
                    { backgroundColor: getPriorityColor(notification.priority) }
                  ]} />
                ) : null}
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>

                <Text style={styles.notificationSummary} numberOfLines={2}>
                  {notification.summary}
                </Text>

                <View style={styles.notificationFooter}>
                  <View style={styles.notificationBadges}>
                    <Text style={[
                      styles.typeBadge,
                      { color: getNotificationColor(notification.type) }
                    ]}>
                      {notification.type}
                    </Text>
                    {notification.priority !== 'medium' && (
                      <Text style={[
                        styles.priorityBadge,
                        { color: getPriorityColor(notification.priority) }
                      ]}>
                        {notification.priority}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification._id);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#A2B2C2" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {hasMore && notifications.length > 0 && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            {loading ? (
              <ActivityIndicator size="small" color="#8CA48F" />
            ) : (
              <Text style={styles.loadMoreText}>Cargar más notificaciones</Text>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#8CA48F'
  },
  markAllText: {
    color: '#8CA48F',
    fontSize: 12,
    fontWeight: '600'
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

  // Counts container
  countsContainer: {
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
  countItem: {
    flex: 1,
    alignItems: 'center'
  },
  countValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8CA48F',
    marginBottom: 4
  },
  countLabel: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center'
  },

  // Notifications list
  notificationsList: {
    flex: 1
  },
  notificationItem: {
    flexDirection: 'row',
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#8CA48F',
    backgroundColor: '#F8F9FA'
  },
  notificationLeft: {
    marginRight: 12,
    alignItems: 'center'
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4
  },
  notificationContent: {
    flex: 1
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    flex: 1,
    marginRight: 8
  },
  notificationTime: {
    fontSize: 12,
    color: '#A2B2C2',
    minWidth: 80,
    textAlign: 'right'
  },
  notificationSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  notificationBadges: {
    flexDirection: 'row',
    gap: 8
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  priorityBadge: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA'
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

export default NotificationsScreen;