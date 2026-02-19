import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_THERAPISTS_LIST } from '../services/mockData';

const ExploreTherapistsScreen = ({ user, navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api';

  // Static filter options (can be dynamically loaded later)
  const specialties = ['Todas', 'Psicología Clínica', 'Psicoterapia', 'Psicología Infantil', 'Neuropsicología', 'Ansiedad', 'Depresión', 'Terapia de Pareja'];
  const locations = ['Todas', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Online', 'Otra'];

  // Transform API data to UI format
  const transformTherapistData = (apiTherapists) => {
    return apiTherapists.map(therapist => ({
      id: therapist._id,
      name: therapist.name,
      email: therapist.email,
      specialty: therapist.specialties?.[0] || 'Terapia General',
      experience: '5 años', // Mock experience
      rating: therapist.rating || 0,
      location: 'Online', // Mock location
      price: therapist.price ? `${therapist.price} €` : 'Consultar precio',
      avatar: therapist.name.charAt(0).toUpperCase(),
      languages: ['Español'], // Mock languages
      available: true, // Mock availability
      description: therapist.bio || 'Descripción no disponible',
      isVerified: true, // Mock verification
    }));
  };

  // Fetch therapists from API
  const fetchTherapists = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter mock data based on search query and specialty
      let filtered = MOCK_THERAPISTS_LIST;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(t =>
          t.name.toLowerCase().includes(query) ||
          t.specialties.some(s => s.toLowerCase().includes(query))
        );
      }

      if (selectedSpecialty && selectedSpecialty !== 'Todas') {
        filtered = filtered.filter(t =>
          t.specialties.some(s => s.toLowerCase() === selectedSpecialty.toLowerCase())
        );
      }

      const transformedTherapists = transformTherapistData(filtered);
      setTherapists(transformedTherapists);

    } catch (error) {
      console.error('Error fetching therapists:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        'No se pudieron cargar los terapeutas.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load therapists when filters change with debouncing for search
  useEffect(() => {
    const delay = searchQuery ? 500 : 0; // Debounce search, immediate for specialty
    const timeoutId = setTimeout(() => {
      fetchTherapists();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedSpecialty]);

  // Client-side filtering for location only (API handles search and specialty)
  const filteredTherapists = therapists.filter(therapist => {
    if (selectedLocation === 'Otra') {
      return !customLocation || therapist.location.toLowerCase().includes(customLocation.toLowerCase());
    }
    const matchesLocation = !selectedLocation || selectedLocation === 'Todas' ||
      therapist.location.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesLocation;
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Búsqueda de profesionales</Text>

      {/* Filtros de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color="#A2B2C2" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o especialidad..."
            placeholderTextColor="#A2B2C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Especialidad:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {specialties.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.filterChip,
                    selectedSpecialty === specialty && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedSpecialty(specialty === selectedSpecialty ? '' : specialty)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedSpecialty === specialty && styles.filterChipTextActive
                  ]}>
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Ubicación:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.filterChip,
                    selectedLocation === location && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedLocation(location === selectedLocation ? '' : location)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedLocation === location && styles.filterChipTextActive
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedLocation === 'Otra' && (
              <View style={styles.customLocationContainer}>
                <TextInput
                  style={styles.customLocationInput}
                  placeholder="Escribe tu ubicación..."
                  placeholderTextColor="#A2B2C2"
                  value={customLocation}
                  onChangeText={setCustomLocation}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Lista de terapeutas */}
      <View style={styles.therapistsList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8CA48F" />
            <Text style={styles.loadingText}>Cargando terapeutas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#C9A2A6" style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Error al cargar</Text>
            <Text style={styles.errorText}>
              No se pudieron cargar los terapeutas. Verifica tu conexión e intenta nuevamente.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTherapists}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTherapists.length > 0 ? (
          filteredTherapists.map((therapist) => (
            <View key={therapist.id} style={styles.therapistCard}>
              <View style={styles.therapistHeader}>
                <View style={styles.therapistAvatar}>
                  <Text style={styles.therapistAvatarText}>{therapist.avatar}</Text>
                </View>

                <View style={styles.therapistInfo}>
                  <View style={styles.therapistNameRow}>
                    <View style={styles.therapistNameContainer}>
                      <Text style={styles.therapistName}>{therapist.name}</Text>
                      {therapist.isVerified && (
                        <Ionicons name="checkmark-circle" size={18} color="#8CA48F" style={styles.verifiedIcon} />
                      )}
                    </View>
                    {therapist.available ? (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>Disponible</Text>
                      </View>
                    ) : (
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableText}>No disponible</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.therapistSpecialty}>{therapist.specialty}</Text>
                  <View style={styles.therapistLocationContainer}>
                    <Ionicons name="location-outline" size={14} color="#A2B2C2" />
                    <Text style={styles.therapistLocation}>{therapist.location}</Text>
                  </View>

                  <View style={styles.therapistDetails}>
                    <View style={styles.therapistExperienceContainer}>
                      <Ionicons name="star" size={14} color="#D58E6E" />
                      <Text style={styles.therapistExperience}>{therapist.rating} • {therapist.experience}</Text>
                    </View>
                    <Text style={styles.therapistPrice}>{therapist.price}</Text>
                  </View>

                  <Text style={styles.therapistDescription}>{therapist.description}</Text>

                  <View style={styles.therapistLanguages}>
                    {therapist.languages.map((language, index) => (
                      <View key={index} style={styles.languageChip}>
                        <Text style={styles.languageText}>{language}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.therapistActions}>
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ProfessionalProfile', { therapistId: therapist.id })}
                >
                  <Text style={styles.viewProfileText}>Ver Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.bookAppointmentButton,
                    !therapist.available && styles.bookAppointmentButtonDisabled
                  ]}
                  disabled={!therapist.available}
                  activeOpacity={0.8}
                  onPress={() => {
                    console.log('🔘 Agendar Cita clicked for:', therapist.name);
                    console.log('🔘 Navigation available:', !!navigation);
                    console.log('🔘 Therapist available:', therapist.available);

                    if (therapist.available && navigation && navigation.navigate) {
                      console.log('🔘 Navigating to agenda with params:', {
                        therapistId: therapist.id,
                        therapistName: therapist.name
                      });

                      navigation.navigate('agenda', {
                        therapistId: therapist.id,
                        therapistName: therapist.name,
                        selectedTherapist: therapist
                      });
                    } else {
                      console.log('🔘 Navigation blocked - therapist available:', therapist.available, 'navigation:', !!navigation);
                    }
                  }}
                >
                  <Text style={[
                    styles.bookAppointmentText,
                    !therapist.available && styles.bookAppointmentTextDisabled
                  ]}>
                    {therapist.available ? 'Agendar Cita' : 'No Disponible'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#A2B2C2" style={styles.noResultsIcon} />
            <Text style={styles.noResultsTitle}>No se encontraron terapeutas</Text>
            <Text style={styles.noResultsText}>
              Intenta ajustar los filtros de búsqueda para encontrar más opciones.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 20,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EEE9',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#2D3A4A',
  },
  filtersRow: {
    gap: 15,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3A4A',
    marginBottom: 10,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#A2B2C2',
  },
  filterChipActive: {
    backgroundColor: '#8CA48F',
    borderColor: '#8CA48F',
  },
  filterChipText: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  customLocationContainer: {
    marginTop: 10,
  },
  customLocationInput: {
    backgroundColor: '#F3EEE9',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2D3A4A',
    borderWidth: 1,
    borderColor: '#A2B2C2',
  },
  therapistsList: {
    gap: 15,
  },
  therapistCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  therapistHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  therapistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8CA48F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  therapistAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  therapistInfo: {
    flex: 1,
  },
  therapistNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  therapistNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginRight: 6,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  availableBadge: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: '#A2B2C2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  therapistSpecialty: {
    fontSize: 16,
    color: '#8CA48F',
    fontWeight: '600',
    marginBottom: 5,
  },
  therapistLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  therapistLocation: {
    fontSize: 14,
    color: '#A2B2C2',
    marginLeft: 4,
  },
  therapistDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  therapistExperienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  therapistExperience: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '500',
    marginLeft: 4,
  },
  therapistPrice: {
    fontSize: 16,
    color: '#C9A2A6',
    fontWeight: 'bold',
  },
  therapistDescription: {
    fontSize: 14,
    color: '#A2B2C2',
    lineHeight: 20,
    marginBottom: 12,
  },
  therapistLanguages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 15,
  },
  languageChip: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 12,
    color: '#2D3A4A',
    fontWeight: '500',
  },
  therapistActions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: '#F3EEE9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A2B2C2',
  },
  viewProfileText: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '600',
  },
  bookAppointmentButton: {
    flex: 1,
    backgroundColor: '#8CA48F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookAppointmentButtonDisabled: {
    backgroundColor: '#A2B2C2',
  },
  bookAppointmentText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  bookAppointmentTextDisabled: {
    color: '#F3EEE9',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  noResultsIcon: {
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#A2B2C2',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#2D3A4A',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C9A2A6',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#A2B2C2',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExploreTherapistsScreen;