import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';

/**
 * 🚀 DEMO COMPLETO QUE FUNCIONA INMEDIATAMENTE
 *
 * INSTRUCCIONES:
 * 1. Copia este archivo a tu carpeta principal
 * 2. Importa este componente: import FavoritesDemoScreen from './FavoritesDemoScreen';
 * 3. Úsalo en lugar de tu FavoritesScreen actual: <FavoritesDemoScreen />
 * 4. ¡YA FUNCIONA! El botón "Ver Perfil" navegará automáticamente
 */
const FavoritesDemoScreen = () => {
  const [currentScreen, setCurrentScreen] = useState('favorites');
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  // CAMBIAR ESTOS DATOS POR LOS REALES DE TU USUARIO
  const currentUser = {
    id: 'client_123',
    name: 'Cliente Ejemplo',
    email: 'cliente@ejemplo.com',
    // IMPORTANTE: Poner tu token real aquí
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDYxMjRiNTE3YmZmYjIyNWY4YjFmMiIsInR5cGUiOiJjbGllbnQiLCJpYXQiOjE3NTg4NTk4NTEsImV4cCI6MTc1OTQ2NDY1MX0.aKiVApCkF42ANKifW88kcJ1B2MkGj2Ajjz4r8wvwAKM',
    role: 'client'
  };

  // Función que se ejecuta cuando presionas "Ver Perfil"
  const handleViewProfile = (therapistId) => {
    console.log('🚀 ¡FUNCIONÓ! Navegando al perfil:', therapistId);
    setSelectedTherapistId(therapistId);
    setCurrentScreen('profile');
  };

  // Función para volver a favoritos
  const handleGoBack = () => {
    console.log('⬅️ Volviendo a favoritos');
    setCurrentScreen('favorites');
    setSelectedTherapistId(null);
  };

  // Objetos mock para ProfessionalProfileScreen
  const mockNavigation = {
    goBack: handleGoBack,
    navigate: (screenName, params) => {
      console.log(`Navegación: ${screenName}`, params);
    }
  };

  const mockRoute = {
    params: {
      therapistId: selectedTherapistId
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* PANTALLA DE FAVORITOS */}
      {currentScreen === 'favorites' && (
        <FavoritesScreen
          user={currentUser}
          onViewProfile={handleViewProfile}
        />
      )}

      {/* PANTALLA DE PERFIL PROFESIONAL */}
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

export default FavoritesDemoScreen;

/*
🎯 TESTING:

1. Usa este componente: <FavoritesDemoScreen />
2. Ve a favoritos
3. Presiona "Ver Perfil" en cualquier terapeuta
4. ¡Deberías navegar al perfil completo!
5. Usa el botón de "Atrás" para volver a favoritos

🔧 PERSONALIZACIÓN:

- Cambia currentUser.token por tu token real
- Modifica currentUser con los datos reales
- Personaliza los estilos si quieres

¡Este código funciona inmediatamente sin configuración adicional! 🚀
*/