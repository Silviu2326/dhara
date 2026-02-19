import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';

// Importa tus componentes
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfessionalProfileScreen from '../screens/ProfessionalProfileScreen';

/**
 * COPIA ESTE CÓDIGO COMPLETO
 *
 * Este es un ejemplo funcional que puedes usar directamente
 * Reemplaza tu componente actual con este código
 */
const SimpleNavigation = () => {
  // Estado para controlar qué pantalla mostrar
  const [currentScreen, setCurrentScreen] = useState('favorites'); // 'favorites' o 'profile'
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  // Tu usuario actual - CAMBIA ESTOS DATOS
  const currentUser = {
    id: 'client_123',
    name: 'Cliente Ejemplo',
    email: 'cliente@ejemplo.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDYxMjRiNTE3YmZmYjIyNWY4YjFmMiIsInR5cGUiOiJjbGllbnQiLCJpYXQiOjE3NTg4NTk4NTEsImV4cCI6MTc1OTQ2NDY1MX0.aKiVApCkF42ANKifW88kcJ1B2MkGj2Ajjz4r8wvwAKM', // Tu token real
    role: 'client'
  };

  // Función que se ejecuta cuando presionas "Ver Perfil"
  const handleViewProfile = (therapistId) => {
    console.log('🚀 Navegando al perfil del terapeuta:', therapistId);
    setSelectedTherapistId(therapistId);
    setCurrentScreen('profile');
  };

  // Función que se ejecuta cuando presionas "Volver" en el perfil
  const handleGoBack = () => {
    console.log('⬅️ Volviendo a favoritos');
    setCurrentScreen('favorites');
    setSelectedTherapistId(null);
  };

  // Simulamos el objeto navigation que espera ProfessionalProfileScreen
  const mockNavigation = {
    goBack: handleGoBack,
    navigate: (screenName, params) => {
      console.log(`Intentando navegar a: ${screenName}`, params);
    }
  };

  // Simulamos el objeto route que espera ProfessionalProfileScreen
  const mockRoute = {
    params: {
      therapistId: selectedTherapistId
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'favorites' && (
        <FavoritesScreen
          user={currentUser}
          onViewProfile={handleViewProfile}
        />
      )}

      {currentScreen === 'profile' && selectedTherapistId && (
        <ProfessionalProfileScreen
          route={mockRoute}
          navigation={mockNavigation}
          user={currentUser}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});

export default SimpleNavigation;

/**
 * CÓMO USAR ESTE CÓDIGO:
 *
 * 1. Copia este archivo completo
 * 2. Cambia los datos en 'currentUser' por los reales
 * 3. Importa este componente en tu App.js:
 *    import SimpleNavigation from './examples/SimpleNavigation';
 * 4. Úsalo en lugar de tu componente actual:
 *    <SimpleNavigation />
 *
 * ¡Ya funciona el botón "Ver Perfil"! 🎉
 */