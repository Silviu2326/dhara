import { notificationService } from '../../services/api/notificationService';
import { logger } from '../../services/utils/logger';

// Helper to transform API data to UI format
const transformNotificationForUI = (notification) => {
  return {
    id: notification.id || notification.notificationId,
    title: notification.title,
    summary: notification.body || notification.message || notification.summary,
    type: notification.type,
    isRead: notification.status === 'read',
    isImportant: notification.priority === 'high' || notification.priority === 'urgent' || notification.priority === 'critical',
    createdAt: new Date(notification.createdAt),
    source: notification.source || getSourceFromType(notification.type),
    priority: notification.priority,
    category: notification.category,
    metadata: notification.metadata
  };
};

// Helper to get source from notification type
const getSourceFromType = (type) => {
  const sourceMap = {
    appointment: 'Sistema de Citas',
    message: 'Chat Interno',
    document: 'Sistema de Documentos',
    payment: 'Sistema de Pagos',
    system: 'Administración',
    reminder: 'Recordatorios',
    alert: 'Alertas del Sistema'
  };
  return sourceMap[type] || 'Sistema';
};

// Helper to transform UI filters to API format
const transformFiltersForAPI = (filters) => {
  return {
    type: filters.type === 'all' ? null : filters.type,
    unreadOnly: filters.type === 'unread',
    priority: filters.type === 'important' ? 'high' : null,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
    sortBy: filters.sortBy === 'date_desc' ? 'createdAt' :
            filters.sortBy === 'date_asc' ? 'createdAt' :
            filters.sortBy === 'importance' ? 'priority' : 'createdAt',
    sortOrder: filters.sortBy === 'date_asc' ? 'asc' : 'desc',
    page: filters.page || 1,
    limit: filters.limit || 10
  };
};

export const getNotifications = async (filters = {}) => {
  try {
    logger.info('Fetching notifications with filters', { filters });

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Transform UI filters to API format
    const apiFilters = transformFiltersForAPI(filters);

    // Get notifications from service
    const result = await notificationService.getNotifications(apiFilters, {
      decryptSensitiveData: false
    });

    // Transform notifications for UI
    const transformedNotifications = result.notifications.map(transformNotificationForUI);

    return {
      notifications: transformedNotifications,
      total: result.pagination.total,
      unreadCount: result.unreadCount,
      hasMore: result.pagination.hasMore,
      page: result.pagination.page,
      totalPages: Math.ceil(result.pagination.total / (filters.limit || 10))
    };
  } catch (error) {
    logger.error('Error fetching notifications', { error: error.message, filters });

    // Return fallback data to prevent UI crashes
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      hasMore: false,
      page: 1,
      totalPages: 0
    };
  }
};

export const getNotificationStats = async () => {
  try {
    logger.info('Fetching notification statistics');

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Get stats from service
    const stats = await notificationService.getNotificationStats(null, {
      includeDetails: true,
      timeframe: '7d'
    });

    return {
      unreadCount: stats.unreadCount || 0,
      weeklyCount: stats.weeklyCount || 0,
      importantCount: stats.importantCount || 0,
      totalCount: stats.totalCount || 0,
      byType: stats.byType || {},
      byPriority: stats.byPriority || {}
    };
  } catch (error) {
    logger.error('Error fetching notification stats', { error: error.message });

    // Return fallback data
    return {
      unreadCount: 0,
      weeklyCount: 0,
      importantCount: 0,
      totalCount: 0,
      byType: {},
      byPriority: {}
    };
  }
};

export const markAsRead = async (notificationId) => {
  try {
    logger.info('Marking notification as read', { notificationId });

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Mark notification as read
    await notificationService.markNotificationAsRead(notificationId);

    return { success: true };
  } catch (error) {
    logger.error('Error marking notification as read', { error: error.message, notificationId });
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    logger.info('Marking all notifications as read');

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Mark all notifications as read
    const result = await notificationService.markAllNotificationsAsRead();

    return {
      success: true,
      updatedCount: result.modifiedCount || 0
    };
  } catch (error) {
    logger.error('Error marking all notifications as read', { error: error.message });
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    logger.info('Deleting notification', { notificationId });

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Delete the notification
    await notificationService.deleteNotification(notificationId);

    return { success: true };
  } catch (error) {
    logger.error('Error deleting notification', { error: error.message, notificationId });
    throw error;
  }
};

export const deleteReadNotifications = async () => {
  try {
    logger.info('Deleting read notifications');

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Delete all read notifications
    const result = await notificationService.deleteNotifications({
      status: 'read'
    });

    return {
      success: true,
      deletedCount: result.deletedCount || 0
    };
  } catch (error) {
    logger.error('Error deleting read notifications', { error: error.message });
    throw error;
  }
};

export const sendTestNotification = async () => {
  try {
    logger.info('Sending test notification');

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Create test notification
    const testNotification = await notificationService.createNotification({
      type: 'system',
      title: 'Notificación de prueba',
      message: 'Esta es una notificación de prueba enviada desde el panel de configuración.',
      priority: 'normal',
      channels: ['push'],
      metadata: {
        source: 'test_panel',
        timestamp: Date.now()
      }
    });

    return {
      success: true,
      notification: transformNotificationForUI(testNotification)
    };
  } catch (error) {
    logger.error('Error sending test notification', { error: error.message });
    throw error;
  }
};

export const getNotificationSettings = async () => {
  try {
    logger.info('Fetching notification settings');

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Get notification settings from service
    const settings = await notificationService.getNotificationSettings();

    return settings;
  } catch (error) {
    logger.error('Error fetching notification settings', { error: error.message });

    // Return fallback settings
    return {
      email: {
        enabled: true,
        appointments: true,
        payments: true,
        reminders: true,
        marketing: false
      },
      push: {
        enabled: true,
        appointments: true,
        payments: true,
        reminders: true,
        marketing: false
      },
      sms: {
        enabled: false,
        appointments: false,
        payments: false,
        reminders: false
      },
      inApp: {
        enabled: true,
        sound: true,
        desktop: true
      }
    };
  }
};

export const updateNotificationSettings = async (settings) => {
  try {
    logger.info('Updating notification settings', { settings });

    // Initialize notification service if needed
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Update notification settings
    const updatedSettings = await notificationService.updateNotificationSettings(settings);

    return {
      success: true,
      settings: updatedSettings
    };
  } catch (error) {
    logger.error('Error updating notification settings', { error: error.message, settings });
    throw error;
  }
};