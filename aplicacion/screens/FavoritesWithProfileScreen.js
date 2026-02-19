import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import FavoritesScreen from './FavoritesScreen';
import ProfessionalProfileScreen from './ProfessionalProfileScreen';

/**
 * Componente que combina FavoritesScreen con navegación a ProfessionalProfileScreen
 * SIN necesidad de React Navigation - Funciona inmediatamente
 */
const FavoritesWithProfileScreen = ({ user }) => {
  const [currentScreen, setCurrentScreen] = useState('favorites');
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  // Función para ir al perfil del terapeuta
  const handleViewProfile = (therapistId) => {
    console.log('🔍 Navegando al perfil del terapeuta:', therapistId);
    setSelectedTherapistId(therapistId);
    setCurrentScreen('profile');
  };

  // Función para volver a favoritos
  const handleGoBack = () => {
    console.log('⬅️ Volviendo a favoritos');
    setCurrentScreen('favorites');
    setSelectedTherapistId(null);
  };

  // Crear objeto navigation mock para ProfessionalProfileScreen
  const mockNavigation = {
    goBack: handleGoBack,
    navigate: (screenName, params) => {
      console.log(`🚀 Navigate to: ${screenName}`, params);
    }
  };

  // Crear objeto route mock para ProfessionalProfileScreen
  const mockRoute = {
    params: {
      therapistId: selectedTherapistId
    }
  };

  // Mostrar pantalla de perfil si está seleccionada
  if (currentScreen === 'profile' && selectedTherapistId) {
    return (
      <View style={styles.container}>
        <ProfessionalProfileScreen
          route={mockRoute}
          navigation={mockNavigation}
          user={user}
        />
      </View>
    );
  }

  // Mostrar pantalla de favoritos por defecto
  return (
    <View style={styles.container}>
      <FavoritesScreen
        user={user}
        onViewProfile={handleViewProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});

export default FavoritesWithProfileScreen;