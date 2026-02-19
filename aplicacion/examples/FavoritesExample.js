import React, { useState } from 'react';
import { View, Alert, Text, Button } from 'react-native';
import FavoritesScreen from '../screens/FavoritesScreen';

/**
 * Ejemplo de cómo usar FavoritesScreen sin React Navigation
 *
 * Este ejemplo muestra cómo implementar la navegación usando callbacks
 * personalizados en lugar de React Navigation.
 */
const FavoritesExample = () => {
  const [currentUser] = useState({
    id: 'client_123',
    name: 'Cliente Ejemplo',
    email: 'cliente@ejemplo.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Tu token real aquí
    role: 'client'
  });

  const handleViewProfile = (therapistId) => {
    // Opción 1: Mostrar Alert con información
    Alert.alert(
      'Perfil del Terapeuta',
      `ID: ${therapistId}\n\nAquí implementarías tu lógica de navegación personalizada.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Ver Perfil',
          onPress: () => {
            // Opción 2: Navegar usando tu sistema personalizado
            console.log(`Navegando al perfil del terapeuta: ${therapistId}`);

            // Ejemplos de navegación personalizada:

            // React Native Navigation (v6+)
            // Navigation.push('ProfessionalProfile', { therapistId });

            // Expo Router
            // router.push(`/profile/${therapistId}`);

            // Estado global (Redux, Context, etc.)
            // dispatch(showProfile(therapistId));

            // Modal personalizado
            // setModalVisible(true);
            // setSelectedTherapistId(therapistId);

            // Navegación web
            // if (Platform.OS === 'web') {
            //   window.location.href = `/profile/${therapistId}`;
            // }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FavoritesScreen
        user={currentUser}
        onViewProfile={handleViewProfile}
      />
    </View>
  );
};

// Ejemplo alternativo: Con navegación simulada
export const FavoritesWithSimulatedNavigation = () => {
  const [currentScreen, setCurrentScreen] = useState('favorites');
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  const currentUser = {
    id: 'client_123',
    token: 'your-token-here',
    name: 'Cliente Ejemplo'
  };

  const handleViewProfile = (therapistId) => {
    setSelectedTherapistId(therapistId);
    setCurrentScreen('profile');
  };

  const handleGoBack = () => {
    setCurrentScreen('favorites');
    setSelectedTherapistId(null);
  };

  if (currentScreen === 'profile') {
    // Aquí renderizarías tu ProfessionalProfileScreen
    // o cualquier otra pantalla de perfil
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Perfil del Terapeuta: {selectedTherapistId}</Text>
        <Button title="Volver" onPress={handleGoBack} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FavoritesScreen
        user={currentUser}
        onViewProfile={handleViewProfile}
      />
    </View>
  );
};

export default FavoritesExample;