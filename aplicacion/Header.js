import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from './services/notificationService';

const Header = ({ user, onToggleSidebar, onLogout, onNavigate }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationCount();

    // Set up interval to refresh notification count every 30 seconds
    const interval = setInterval(() => {
      loadNotificationCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotificationCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();

      if (response.success) {
        setUnreadCount(response.count);
      } else {
        console.warn('Failed to load notification count:', response.error);
        // Keep previous count or set to 0
        if (loading) setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
      if (loading) setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = () => {
    if (onNavigate) {
      onNavigate('notifications');

      // Refresh notification count after a delay to account for user interactions
      setTimeout(() => {
        loadNotificationCount();
      }, 1000);
    }
  };

  // Function will refresh automatically after navigation

  return (
    <View style={styles.container}>
      {/* Left Section - Menu Button & Title */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onToggleSidebar}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={20} color="#2D3A4A" />
        </TouchableOpacity>

      </View>

      {/* Right Section - User Info & Actions */}
      <View style={styles.rightSection}>
        {/* Notifications Button */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={unreadCount > 0 ? "notifications" : "notifications-outline"}
            size={18}
            color={unreadCount > 0 ? "#C9A2A6" : "#2D3A4A"}
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Menu */}
        <View style={styles.userMenu}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
            <Text style={styles.userRole}>Paciente</Text>
          </View>

          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
          </View>

          {/* Dropdown Menu Button */}
          <TouchableOpacity style={styles.dropdownButton}>
            <Ionicons name="chevron-down-outline" size={12} color="#A2B2C2" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE9',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EEE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EEE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C9A2A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  userMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EEE9',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  userInfo: {
    marginRight: 10,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  userRole: {
    fontSize: 12,
    color: '#A2B2C2',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8CA48F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  dropdownButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;