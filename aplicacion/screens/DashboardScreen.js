import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dashboardService } from '../services/dashboardService';

const DashboardScreen = ({ user, navigation }) => {
  const [dashboardCards, setDashboardCards] = useState([
    { title: 'Próxima Cita', value: 'Cargando...', color: '#8CA48F' },
    { title: 'Sesiones Completadas', value: 'Cargando...', color: '#C9A2A6' },
    { title: 'Ejercicios Pendientes', value: 'Cargando...', color: '#D58E6E' },
    { title: 'Días de Progreso', value: 'Cargando...', color: '#A2B2C2' },
  ]);

  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard data from backend
      const response = await dashboardService.getClientDashboard();

      if (response.success && response.data && response.data.dashboardCards) {
        setDashboardCards(response.data.dashboardCards);
        setNextAppointment(response.data.nextAppointment);
      } else {
        // Fallback to static data if API fails
        setDashboardCards([
          { title: 'Próxima Cita', value: 'Sin datos', color: '#8CA48F' },
          { title: 'Sesiones Completadas', value: 'Sin datos', color: '#C9A2A6' },
          { title: 'Ejercicios Pendientes', value: 'Sin datos', color: '#D58E6E' },
          { title: 'Días de Progreso', value: 'Sin datos', color: '#A2B2C2' },
        ]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos del dashboard. Mostrando datos de ejemplo.',
        [{ text: 'OK' }]
      );

      // Fallback to static data
      setDashboardCards([
        { title: 'Próxima Cita', value: 'Hoy 10:00', color: '#8CA48F' },
        { title: 'Sesiones Completadas', value: '12', color: '#C9A2A6' },
        { title: 'Ejercicios Pendientes', value: '3', color: '#D58E6E' },
        { title: 'Días de Progreso', value: '45', color: '#A2B2C2' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Qué bueno verte.</Text>

      <View style={styles.cardsContainer}>
        {dashboardCards.map((card, index) => (
          <View key={index} style={[styles.card, { borderLeftColor: card.color }]}>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8CA48F' }]}
            onPress={() => navigation && navigation.navigate && navigation.navigate('agenda')}
          >
            <Text style={styles.actionButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#C9A2A6' }]}>
            <Text style={styles.actionButtonText}>Ver Ejercicios</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recordatorio de cita */}
      {loading ? (
        <View style={[styles.appointmentReminder, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#8CA48F" />
          <Text style={styles.loadingText}>Cargando cita...</Text>
        </View>
      ) : nextAppointment ? (
        <View style={styles.appointmentReminder}>
          <View style={styles.reminderTitleContainer}>
            <Ionicons name="calendar-outline" size={16} color="#8CA48F" />
            <Text style={styles.reminderTitle}>Próxima Cita</Text>
          </View>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderText}>
              {new Date(nextAppointment.date).toLocaleDateString('es-ES')} a las {nextAppointment.startTime}
            </Text>
            <Text style={styles.therapistName}>con {nextAppointment.therapistName || user?.therapist}</Text>
            <TouchableOpacity style={styles.reminderButton}>
              <Text style={styles.reminderButtonText}>Ver Detalles</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.appointmentReminder}>
          <View style={styles.reminderTitleContainer}>
            <Ionicons name="calendar-outline" size={16} color="#8CA48F" />
            <Text style={styles.reminderTitle}>Próxima Cita</Text>
          </View>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderText}>No tienes citas programadas</Text>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => navigation && navigation.navigate && navigation.navigate('agenda')}
            >
              <Text style={styles.reminderButtonText}>Agendar Cita</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#A2B2C2',
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentReminder: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#8CA48F',
  },
  reminderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginLeft: 8,
  },
  reminderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '600',
  },
  therapistName: {
    fontSize: 14,
    color: '#A2B2C2',
    flex: 1,
    marginLeft: 10,
  },
  reminderButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reminderButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#A2B2C2',
  },
});

export default DashboardScreen;