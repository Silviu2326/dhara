import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileService } from '../services/profileService';

const ProfileScreen = ({ user, navigation }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadProfileData();

    // Start animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await profileService.getClientProfile();

      if (response.success) {
        setProfileData(response.data);
      } else {
        console.warn('Failed to load profile:', response.error);
        // Use fallback data
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil. Mostrando datos básicos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8CA48F" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const userData = profileData?.user || user;
  const stats = profileData?.stats || {};
  const therapist = profileData?.therapist || {};
  const treatmentPlan = profileData?.treatmentPlan;
  const recentActivity = profileData?.recentActivity || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name={refreshing ? "refresh" : "refresh-outline"}
              size={24}
              color="#8CA48F"
            />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userData?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.name || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{userData?.email || 'email@ejemplo.com'}</Text>
              <View style={styles.userStatusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.userStatus}>Cliente Activo</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#8CA48F" />
            </TouchableOpacity>
          </View>

          {/* Personal Info */}
          <View style={styles.personalInfoSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={16} color="#A2B2C2" />
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>
                  {userData?.phone || 'No especificado'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#A2B2C2" />
                <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                <Text style={styles.infoValue}>
                  {userData?.dateOfBirth
                    ? new Date(userData.dateOfBirth).toLocaleDateString('es-ES')
                    : 'No especificado'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Treatment Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>
            <Ionicons name="analytics" size={20} color="#8CA48F" />
            {' '}Estadísticas de Tratamiento
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSessions || 0}</Text>
              <Text style={styles.statLabel}>Sesiones Totales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedSessions || 0}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.upcomingSessions || 0}</Text>
              <Text style={styles.statLabel}>Próximas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.progressPercentage || 0}%</Text>
              <Text style={styles.statLabel}>Progreso</Text>
            </View>
          </View>

          <View style={styles.treatmentDuration}>
            <Ionicons name="time" size={16} color="#C9A2A6" />
            <Text style={styles.durationText}>
              En tratamiento: {stats.treatmentDuration || '0 días'}
            </Text>
          </View>
        </View>

        {/* Therapist Card */}
        <View style={styles.therapistCard}>
          <Text style={styles.cardTitle}>
            <Ionicons name="person" size={20} color="#C9A2A6" />
            {' '}Mi Profesional
          </Text>

          <View style={styles.therapistInfo}>
            <View style={styles.therapistAvatar}>
              <Text style={styles.therapistAvatarText}>
                {therapist?.name?.charAt(0) || 'T'}
              </Text>
            </View>

            <View style={styles.therapistDetails}>
              <Text style={styles.therapistName}>
                {therapist?.name || 'Sin asignar'}
              </Text>

              {therapist?.specialties && therapist.specialties.length > 0 && (
                <View style={styles.specialtiesContainer}>
                  {therapist.specialties.slice(0, 2).map((specialty, index) => (
                    <View key={index} style={styles.specialtyChip}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              )}

              {therapist?.rating > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#D58E6E" />
                  <Text style={styles.ratingText}>{therapist.rating}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.therapistActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={16} color="#8CA48F" />
              <Text style={styles.actionButtonText}>Enviar Mensaje</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => navigation?.navigate && navigation.navigate('agenda')}
            >
              <Ionicons name="calendar" size={16} color="white" />
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                Agendar Cita
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Treatment Plan */}
        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.activityCard}>
            <Text style={styles.cardTitle}>
              <Ionicons name="time-outline" size={20} color="#A2B2C2" />
              {' '}Actividad Reciente
            </Text>

            {recentActivity.slice(0, 3).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={activity.type === 'session' ? 'calendar' : 'document-text'}
                    size={16}
                    color="#8CA48F"
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString('es-ES')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.fullActionButton}>
            <Ionicons name="settings-outline" size={20} color="#2D3A4A" />
            <Text style={styles.fullActionButtonText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fullActionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#2D3A4A" />
            <Text style={styles.fullActionButtonText}>Centro de Ayuda</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EEE9',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EEE9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#A2B2C2',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Profile Card
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8CA48F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#A2B2C2',
    marginBottom: 6,
  },
  userStatusContainer: {
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
  userStatus: {
    fontSize: 12,
    color: '#8CA48F',
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EEE9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Personal Info
  personalInfoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#A2B2C2',
    marginTop: 6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '500',
  },

  // Stats Card
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center',
    lineHeight: 16,
  },
  treatmentDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  durationText: {
    fontSize: 14,
    color: '#C9A2A6',
    fontWeight: '500',
    marginLeft: 6,
  },

  // Therapist Card
  therapistCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  therapistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  therapistAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C9A2A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  therapistAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  therapistDetails: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  specialtyChip: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 11,
    color: '#2D3A4A',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#D58E6E',
    fontWeight: '600',
    marginLeft: 4,
  },
  therapistActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3EEE9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryActionButton: {
    backgroundColor: '#8CA48F',
    borderColor: '#8CA48F',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '600',
    marginLeft: 6,
  },
  primaryActionText: {
    color: 'white',
  },

  // Treatment Card
  treatmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  treatmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 8,
  },
  treatmentDescription: {
    fontSize: 14,
    color: '#A2B2C2',
    lineHeight: 20,
    marginBottom: 16,
  },
  treatmentProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D58E6E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#D58E6E',
    fontWeight: '600',
  },

  // Activity Card
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EEE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3A4A',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#A2B2C2',
  },

  // Action Section
  actionSection: {
    gap: 12,
  },
  fullActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  fullActionButtonText: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ProfileScreen;