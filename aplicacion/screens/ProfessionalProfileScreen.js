import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_THERAPIST, MOCK_THERAPISTS_LIST } from '../services/mockData';

const { width } = Dimensions.get('window');

const ProfessionalProfileScreen = ({ route, navigation, user }) => {
  const { therapistId } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch professional profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find therapist in mock data
      let therapist = MOCK_THERAPISTS_LIST.find(t => t._id === therapistId);
      
      // Fallback to default mock therapist if not found (for demo purposes)
      if (!therapist) {
        therapist = MOCK_THERAPIST;
      }

      // Transform to profile format expected by UI
      const mockProfile = {
        user: {
          name: therapist.name,
          isVerified: true
        },
        therapies: therapist.specialties,
        experience: [
          {
            startDate: '2018-01-01',
            endDate: null,
            position: 'Psicóloga Clínica',
            company: 'Consultorio Privado',
            description: 'Atención a pacientes con ansiedad y depresión.'
          }
        ],
        stats: {
          averageRating: therapist.rating,
          totalClients: 120
        },
        isAvailable: true,
        about: therapist.bio,
        videoPresentation: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Conóceme',
          description: 'Breve introducción a mi método de trabajo.'
        },
        specializations: therapist.specialties.map(s => ({ name: s })),
        languages: [{ language: 'Español', level: 'Nativo' }, { language: 'Inglés', level: 'Avanzado' }],
        education: [
          {
            degree: 'Licenciatura en Psicología',
            institution: 'UNAM',
            year: '2015'
          }
        ],
        rates: {
          sessionPrice: therapist.price || 800,
          coupleSessionPrice: 1200,
          followUpPrice: 700
        },
        workLocations: [
          {
            name: 'Consultorio Roma Norte',
            city: 'Ciudad de México',
            offersOnline: true
          }
        ],
        socialMedia: {
          linkedin: 'https://linkedin.com'
        }
      };

      setProfile(mockProfile);
      await checkFavoriteStatus();

    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if therapist is in favorites
  const checkFavoriteStatus = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      setIsFavorite(false); // Default to false for mock
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsFavorite(!isFavorite);
      Alert.alert(
        'Éxito',
        !isFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos'
      );

    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Open external links
  const openLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err =>
        Alert.alert('Error', 'No se pudo abrir el enlace')
      );
    }
  };

  // Format experience dates
  const formatExperience = (exp) => {
    const start = new Date(exp.startDate).getFullYear();
    const end = exp.endDate ? new Date(exp.endDate).getFullYear() : 'Presente';
    return `${start} - ${end}`;
  };

  // Calculate years of experience
  const calculateExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return 0;

    const totalMonths = experiences.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                     (endDate.getMonth() - startDate.getMonth());
      return total + Math.max(0, months);
    }, 0);

    return Math.round(totalMonths / 12);
  };

  useEffect(() => {
    fetchProfile();
  }, [therapistId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8CA48F" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Error al cargar el perfil</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={60} color="#8CA48F" />
        <Text style={styles.errorTitle}>Perfil no encontrado</Text>
        <Text style={styles.errorText}>
          Este terapeuta no tiene un perfil público disponible.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteHeaderButton}
          onPress={toggleFavorite}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#FF6B6B" : "white"}
          />
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          {profile.user.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>

        <Text style={styles.therapistName}>{profile.user.name}</Text>

        {profile.therapies && profile.therapies.length > 0 && (
          <Text style={styles.mainSpecialty}>{profile.therapies[0]}</Text>
        )}

        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{calculateExperience(profile.experience)}</Text>
            <Text style={styles.statLabel}>Años</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats?.averageRating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats?.totalClients || 0}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
        </View>

        <View style={styles.availabilityContainer}>
          <Ionicons
            name={profile.isAvailable ? "checkmark-circle" : "close-circle"}
            size={16}
            color={profile.isAvailable ? "#4CAF50" : "#FF6B6B"}
          />
          <Text style={[styles.availabilityText, {
            color: profile.isAvailable ? "#4CAF50" : "#FF6B6B"
          }]}>
            {profile.isAvailable ? "Disponible" : "No Disponible"}
          </Text>
        </View>
      </View>

      {/* About Section */}
      {profile.about && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de mí</Text>
          <Text style={styles.aboutText}>{profile.about}</Text>
        </View>
      )}

      {/* Video Presentation */}
      {profile.videoPresentation?.url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video de Presentación</Text>
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => openLink(profile.videoPresentation.url)}
          >
            <Ionicons name="play-circle" size={40} color="#8CA48F" />
            <Text style={styles.videoTitle}>
              {profile.videoPresentation.title || "Ver Video de Presentación"}
            </Text>
            {profile.videoPresentation.description && (
              <Text style={styles.videoDescription}>
                {profile.videoPresentation.description}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Specializations */}
      {profile.specializations && profile.specializations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especializaciones</Text>
          {profile.specializations.map((spec, index) => (
            <View key={index} style={styles.specializationItem}>
              <Text style={styles.specializationName}>{spec.name}</Text>
              {spec.certification && (
                <Text style={styles.specializationCert}>{spec.certification}</Text>
              )}
              {spec.yearObtained && (
                <Text style={styles.specializationYear}>Año: {spec.yearObtained}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idiomas</Text>
          <View style={styles.languagesContainer}>
            {profile.languages.map((lang, index) => (
              <View key={index} style={styles.languageChip}>
                <Text style={styles.languageText}>
                  {lang.language} ({lang.level})
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Educación</Text>
          {profile.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Text style={styles.educationDegree}>{edu.degree}</Text>
              <Text style={styles.educationInstitution}>{edu.institution}</Text>
              {edu.year && <Text style={styles.educationYear}>{edu.year}</Text>}
              {edu.description && (
                <Text style={styles.educationDescription}>{edu.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Experience */}
      {profile.experience && profile.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiencia</Text>
          {profile.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <Text style={styles.experiencePosition}>{exp.position}</Text>
              <Text style={styles.experienceCompany}>{exp.company}</Text>
              <Text style={styles.experienceDate}>{formatExperience(exp)}</Text>
              {exp.description && (
                <Text style={styles.experienceDescription}>{exp.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Rates */}
      {profile.rates && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarifas</Text>
          <View style={styles.ratesContainer}>
            {profile.rates.sessionPrice > 0 && (
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>Sesión individual</Text>
                <Text style={styles.ratePrice}>
                  {profile.rates.sessionPrice}€
                </Text>
              </View>
            )}
            {profile.rates.coupleSessionPrice > 0 && (
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>Sesión de pareja</Text>
                <Text style={styles.ratePrice}>
                  {profile.rates.coupleSessionPrice}€
                </Text>
              </View>
            )}
            {profile.rates.followUpPrice > 0 && (
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>Sesión de seguimiento</Text>
                <Text style={styles.ratePrice}>
                  {profile.rates.followUpPrice}€
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Work Locations */}
      {profile.workLocations && profile.workLocations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicaciones</Text>
          {profile.workLocations.map((location, index) => (
            <View key={index} style={styles.locationItem}>
              <View style={styles.locationHeader}>
                <Ionicons name="location-outline" size={20} color="#8CA48F" />
                <Text style={styles.locationName}>{location.name}</Text>
              </View>
              <Text style={styles.locationCity}>{location.city}</Text>
              {location.offersOnline && (
                <View style={styles.onlineTag}>
                  <Ionicons name="videocam-outline" size={14} color="#4CAF50" />
                  <Text style={styles.onlineText}>Sesiones online disponibles</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Social Media */}
      {profile.socialMedia && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enlaces</Text>
          <View style={styles.socialContainer}>
            {profile.socialMedia.website && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink(profile.socialMedia.website)}
              >
                <Ionicons name="globe-outline" size={24} color="#8CA48F" />
                <Text style={styles.socialText}>Sitio Web</Text>
              </TouchableOpacity>
            )}
            {profile.socialMedia.linkedin && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink(profile.socialMedia.linkedin)}
              >
                <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                <Text style={styles.socialText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bookButton, !profile.isAvailable && styles.disabledButton]}
          disabled={!profile.isAvailable}
        >
          <Ionicons name="calendar-outline" size={20} color="white" />
          <Text style={styles.bookButtonText}>
            {profile.isAvailable ? 'Agendar Cita' : 'No Disponible'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header styles
  header: {
    height: 200,
    backgroundColor: '#8CA48F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    padding: 8,
  },
  favoriteHeaderButton: {
    padding: 8,
  },

  // Profile header styles
  profileHeader: {
    backgroundColor: 'white',
    marginTop: -80,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8CA48F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  therapistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3A4A',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainSpecialty: {
    fontSize: 16,
    color: '#8CA48F',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Section styles
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },

  // Video styles
  videoContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    textAlign: 'center',
    marginTop: 12,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },

  // Specializations styles
  specializationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specializationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
  },
  specializationCert: {
    fontSize: 14,
    color: '#8CA48F',
    marginTop: 4,
  },
  specializationYear: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Languages styles
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  languageText: {
    fontSize: 14,
    color: '#8CA48F',
    fontWeight: '500',
  },

  // Education styles
  educationItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
  },
  educationInstitution: {
    fontSize: 15,
    color: '#8CA48F',
    marginTop: 4,
  },
  educationYear: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  educationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },

  // Experience styles
  experienceItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
  },
  experienceCompany: {
    fontSize: 15,
    color: '#8CA48F',
    marginTop: 4,
  },
  experienceDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },

  // Rates styles
  ratesContainer: {
    gap: 12,
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rateLabel: {
    fontSize: 15,
    color: '#555',
  },
  ratePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8CA48F',
  },

  // Location styles
  locationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    marginLeft: 8,
  },
  locationCity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
  },
  onlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 28,
  },
  onlineText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Social media styles
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3EEE9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8CA48F',
    marginLeft: 8,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#8CA48F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backText: {
    color: '#8CA48F',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ProfessionalProfileScreen;