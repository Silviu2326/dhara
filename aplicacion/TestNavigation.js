import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';

const TestNavigation = () => {
  const [screen, setScreen] = useState('favorites');
  const [therapistId, setTherapistId] = useState(null);

  // CAMBIAR ESTOS DATOS POR TUS DATOS REALES
  const user = {
    id: 'client_123',
    name: 'Cliente Ejemplo',
    email: 'cliente@ejemplo.com',
    // PONER TU TOKEN REAL AQUÍ
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDYxMjRiNTE3YmZmYjIyNWY4YjFmMiIsInR5cGUiOiJjbGllbnQiLCJpYXQiOjE3NTg4NTk4NTEsImV4cCI6MTc1OTQ2NDY1MX0.aKiVApCkF42ANKifW88kcJ1B2MkGj2Ajjz4r8wvwAKM',
    role: 'client'
  };

  const handleViewProfile = (id) => {
    console.log('🚀 ¡NAVEGANDO AL PERFIL!', id);
    setTherapistId(id);
    setScreen('profile');
  };

  const handleGoBack = () => {
    console.log('⬅️ Volviendo a favoritos');
    setScreen('favorites');
    setTherapistId(null);
  };

  // PANTALLA DE PERFIL
  if (screen === 'profile' && therapistId) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header personalizado para volver */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backText}>Favoritos</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil del Terapeuta</Text>
        </View>

        <ProfessionalProfileScreen
          route={{ params: { therapistId } }}
          navigation={{
            goBack: handleGoBack,
            navigate: (screenName, params) => {
              console.log(`Navegación a: ${screenName}`, params);
            }
          }}
          user={user}
        />
      </SafeAreaView>
    );
  }

  // PANTALLA DE FAVORITOS (por defecto)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.favoritesHeader}>
        <Text style={styles.favoritesTitle}>Mis favoritos</Text>
        <Text style={styles.favoritesSubtitle}>Presiona "Ver Perfil" para navegar</Text>
      </View>

      <FavoritesScreen
        user={user}
        onViewProfile={handleViewProfile}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header del perfil
  header: {
    backgroundColor: '#8CA48F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },

  // Header de favoritos
  favoritesHeader: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  favoritesTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  favoritesSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});

export default TestNavigation;