import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const Sidebar = ({ user, selectedSection, onSectionChange, onLogout, isVisible, onClose }) => {
  const menuItems = [
    {
      id: 'explore-therapists',
      title: 'Búsqueda de profesionales',
      iconFamily: 'Ionicons',
      iconName: 'search-outline',
      description: 'Encontrar especialistas'
    },
    {
      id: 'appointments',
      title: 'Mis Citas',
      iconFamily: 'Ionicons',
      iconName: 'calendar-outline',
      description: 'Citas programadas'
    },
    {
      id: 'chat',
      title: 'Chat',
      iconFamily: 'Ionicons',
      iconName: 'chatbubble-outline',
      description: 'Mensajes y conversaciones'
    },
    {
      id: 'favorites',
      title: 'Favoritos',
      iconFamily: 'Ionicons',
      iconName: 'heart-outline',
      description: 'Terapeutas favoritos'
    },
    {
      id: 'documents',
      title: 'Documentos',
      iconFamily: 'Ionicons',
      iconName: 'document-text-outline',
      description: 'Archivos y reportes'
    },
    {
      id: 'dictionary',
      title: 'Diccionario',
      iconFamily: 'Ionicons',
      iconName: 'book-outline',
      description: 'Términos médicos'
    },
    {
      id: 'reviews',
      title: 'Reseñas',
      iconFamily: 'Ionicons',
      iconName: 'star-outline',
      description: 'Valoraciones y comentarios'
    },
    {
      id: 'payment-history',
      title: 'Historial de Pagos',
      iconFamily: 'Ionicons',
      iconName: 'card-outline',
      description: 'Historial de transacciones'
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      iconFamily: 'Ionicons',
      iconName: 'notifications-outline',
      description: 'Alertas y avisos'
    },
  ];

  const profileItems = [
    {
      id: 'profile',
      title: 'Mi Perfil',
      iconFamily: 'Ionicons',
      iconName: 'person-outline',
      description: 'Información personal'
    },
    {
      id: 'settings',
      title: 'Configuración',
      iconFamily: 'Ionicons',
      iconName: 'settings-outline',
      description: 'Preferencias'
    },
    {
      id: 'help-center',
      title: 'Centro de Ayuda',
      iconFamily: 'Ionicons',
      iconName: 'help-circle-outline',
      description: 'Soporte y ayuda'
    },
    {
      id: 'privacy',
      title: 'Privacidad',
      iconFamily: 'Ionicons',
      iconName: 'shield-checkmark-outline',
      description: 'Configuración de privacidad'
    },
  ];

  const renderIcon = (iconFamily, iconName, isActive) => {
    const iconProps = {
      size: 20,
      color: isActive ? '#8CA48F' : '#A2B2C2',
    };

    switch (iconFamily) {
      case 'Ionicons':
        return <Ionicons name={iconName} {...iconProps} />;
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} {...iconProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} {...iconProps} />;
      default:
        return <Ionicons name={iconName} {...iconProps} />;
    }
  };

  const handleMenuItemPress = (sectionId) => {
    onSectionChange(sectionId);
    // Cerrar sidebar después de seleccionar en cualquier plataforma
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Overlay para toda la pantalla cuando está visible */}
      {isVisible && (
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      )}

      <View style={[styles.sidebar, isVisible && styles.sidebarVisible]}>
        {/* Header del Sidebar */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>DT</Text>
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>Dhara</Text>
              <Text style={styles.brandSubtitle}>Sistema de Gestión</Text>
            </View>
          </View>

          {/* Botón cerrar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Información del Usuario */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>En línea</Text>
            </View>
          </View>
        </View>

        {/* Navegación */}
        <ScrollView style={styles.navigation} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>NAVEGACIÓN</Text>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                selectedSection === item.id && styles.menuItemActive
              ]}
              onPress={() => handleMenuItemPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuIconContainer}>
                  {renderIcon(item.iconFamily, item.iconName, selectedSection === item.id)}
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[
                    styles.menuText,
                    selectedSection === item.id && styles.menuTextActive
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={[
                    styles.menuDescription,
                    selectedSection === item.id && styles.menuDescriptionActive
                  ]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              {selectedSection === item.id && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>PERFIL</Text>

          {profileItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                selectedSection === item.id && styles.menuItemActive
              ]}
              onPress={() => handleMenuItemPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuIconContainer}>
                  {renderIcon(item.iconFamily, item.iconName, selectedSection === item.id)}
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[
                    styles.menuText,
                    selectedSection === item.id && styles.menuTextActive
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={[
                    styles.menuDescription,
                    selectedSection === item.id && styles.menuDescriptionActive
                  ]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              {selectedSection === item.id && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color="white" />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45, 58, 74, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#F3EEE9',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'column',
    position: 'absolute',
    left: -280, // Inicialmente oculta
    zIndex: 1000,
    transform: [{ translateX: 0 }],
  },
  sidebarVisible: {
    left: 0, // Visible cuando está activa
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8CA48F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#A2B2C2',
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3EEE9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: 'bold',
  },
  userInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C9A2A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#A2B2C2',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8CA48F',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#8CA48F',
    fontWeight: '500',
  },
  navigation: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A2B2C2',
    marginBottom: 15,
    letterSpacing: 1,
  },
  sectionTitleSpacing: {
    marginTop: 20,
  },
  menuItem: {
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#F3EEE9',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '500',
    marginBottom: 2,
  },
  menuTextActive: {
    color: '#8CA48F',
    fontWeight: '600',
  },
  menuDescription: {
    fontSize: 12,
    color: '#A2B2C2',
  },
  menuDescriptionActive: {
    color: '#8CA48F',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#8CA48F',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3EEE9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#C9A2A6',
  },
  logoutText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Sidebar;