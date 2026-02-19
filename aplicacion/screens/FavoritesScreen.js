import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_FAVORITES } from '../services/mockData';

/**
 * FavoritesScreen - Displays user's favorite therapists with navigation to professional profiles
 *
 * Props:
 * - user: User object with authentication token
 * - navigation: Navigation prop for screen transitions
 * - onViewProfile: Optional callback function for custom profile navigation
 *
 * Usage:
 * <FavoritesScreen
 *   user={user}
 *   navigation={navigation}
 *   onViewProfile={(therapistId) => navigation.navigate('ProfileScreen', { therapistId })}
 * />
 */
const FavoritesScreen = ({ user, navigation, onViewProfile }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api';

  // Transform API data to UI format
  const transformFavoriteData = (apiFavorites) => {
    return apiFavorites.map(favorite => ({
      id: 'fav-' + favorite._id,
      therapistId: favorite._id,
      name: favorite.name,
      email: favorite.email,
      specialty: favorite.specialties?.[0] || 'Terapia General',
      rating: favorite.rating || 0,
      avatar: favorite.name.charAt(0).toUpperCase(),
      isVerified: true,
      isAvailable: true,
      clientsCount: 15,
      yearsExperience: 5,
      notes: 'Nota de prueba',
      addedAt: new Date().toISOString(),
    }));
  };

  // Fetch favorites from API
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data
      const transformedFavorites = transformFavoriteData(MOCK_FAVORITES);
      setFavorites(transformedFavorites);

    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError(error.message);
      Alert.alert('Error', `Error al cargar favoritos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (therapistId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      Alert.alert('Éxito', 'Terapeuta eliminado de favoritos');
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.therapistId !== therapistId));

    } catch (error) {
      console.error('Error removing from favorites:', error);
      Alert.alert('Error', `Error al eliminar: ${error.message}`);
    }
  };

  // Navigate to professional profile
  const navigateToProfile = (therapistId) => {
    console.log('🔍 Intentando navegar al perfil del terapeuta:', therapistId);

    if (onViewProfile) {
      // Use custom callback if provided
      console.log('✅ Usando callback personalizado');
      onViewProfile(therapistId);
    } else if (navigation && navigation.navigate) {
      // Try React Navigation
      console.log('✅ Usando React Navigation');
      navigation.navigate('ProfessionalProfile', { therapistId });
    } else {
      // Fallback: Show alert with detailed therapist info
      console.log('⚠️ Sin navegación configurada - mostrando Alert');

      Alert.alert(
        '👨‍⚕️ Información del Terapeuta',
        `ID: ${therapistId}\n\n` +
        `Para ver el perfil completo necesitas:\n\n` +
        `1. Añadir prop onViewProfile, o\n` +
        `2. Usar FavoritesWithProfileScreen, o\n` +
        `3. Configurar React Navigation\n\n` +
        `Consulta SOLUCION_INMEDIATA.md para instrucciones.`,
        [
          {
            text: 'Copiar ID',
            onPress: () => {
              // En React Native no hay clipboard directo, pero podemos logearlo
              console.log('📋 ID copiado:', therapistId);
              Alert.alert('ID Copiado', `${therapistId} - Revisa la consola`);
            }
          },
          { text: 'Cerrar' }
        ]
      );
    }
  };

  // Load favorites when component mounts
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favoritos</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8CA48F" />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favoritos</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favoritos</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={60} color="#8CA48F" />
          <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
          <Text style={styles.emptyText}>Explora terapeutas y añade los que más te gusten a tus favoritos.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.section}>
      <Text style={styles.sectionTitle}>Favoritos ({favorites.length})</Text>
      <View style={styles.therapistsList}>
        {favorites.map((therapist) => (
          <View key={therapist.id} style={styles.therapistCard}>
            <View style={styles.therapistHeader}>
              <View style={styles.therapistAvatar}>
                <Text style={styles.therapistAvatarText}>{therapist.avatar}</Text>
                {therapist.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={12} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.therapistInfo}>
                <Text style={styles.therapistName}>{therapist.name}</Text>
                <Text style={styles.therapistSpecialty}>{therapist.specialty}</Text>
                <View style={styles.therapistExperienceContainer}>
                  <Ionicons name="star" size={14} color="#D58E6E" />
                  <Text style={styles.therapistExperience}>{therapist.rating.toFixed(1)}</Text>
                  <Text style={styles.therapistClients}> • {therapist.clientsCount} clientes</Text>
                </View>
                {therapist.notes && (
                  <Text style={styles.therapistNotes} numberOfLines={2}>
                    "{therapist.notes}"
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => removeFromFavorites(therapist.therapistId)}
              >
                <Ionicons name="heart" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <View style={styles.therapistActions}>
              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={() => navigateToProfile(therapist.therapistId)}
              >
                <Ionicons name="person-outline" size={16} color="#2D3A4A" />
                <Text style={styles.viewProfileText}>Ver Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookAppointmentButton, !therapist.isAvailable && styles.disabledButton]}
                disabled={!therapist.isAvailable}
              >
                <Text style={[styles.bookAppointmentText, !therapist.isAvailable && styles.disabledText]}>
                  {therapist.isAvailable ? 'Agendar Cita' : 'No Disponible'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: { padding: 20, flex: 1 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 20 },
  therapistsList: { gap: 15 },
  therapistCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, shadowColor: '#2D3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  therapistHeader: { flexDirection: 'row', marginBottom: 15 },
  therapistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8CA48F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative'
  },
  therapistAvatarText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  therapistInfo: { flex: 1 },
  therapistName: { fontSize: 18, fontWeight: 'bold', color: '#2D3A4A' },
  therapistSpecialty: { fontSize: 16, color: '#8CA48F', fontWeight: '600', marginBottom: 5 },
  therapistExperienceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  therapistExperience: { fontSize: 14, color: '#2D3A4A', fontWeight: '500', marginLeft: 4 },
  therapistClients: { fontSize: 14, color: '#666', fontWeight: '400' },
  therapistNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E0E0E0'
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 10
  },
  therapistActions: { flexDirection: 'row', gap: 10 },
  viewProfileButton: { flex: 1, backgroundColor: '#F3EEE9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  viewProfileText: { fontSize: 14, color: '#2D3A4A', fontWeight: '600', marginLeft: 6 },
  bookAppointmentButton: { flex: 1, backgroundColor: '#8CA48F', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  bookAppointmentText: { fontSize: 14, color: 'white', fontWeight: '600' },
  disabledButton: { backgroundColor: '#CCCCCC' },
  disabledText: { color: '#666666' },

  // Loading states
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

  // Error states
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

  // Empty states
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
});

export default FavoritesScreen;