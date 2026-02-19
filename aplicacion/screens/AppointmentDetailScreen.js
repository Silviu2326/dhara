import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AppointmentDetailScreen = ({ route, navigation }) => {
  const { appointment } = route.params;

  const formatFullDate = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const isUpcoming = () => {
    const now = new Date();
    return appointment.date > now;
  };

  const isPast = () => {
    const now = new Date();
    return appointment.date < now;
  };

  const handleEditAppointment = () => {
    Alert.alert(
      'Editar Cita',
      '¿Qué acción deseas realizar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reprogramar', onPress: () => {
          Alert.alert('Reprogramar', 'Función en desarrollo');
        }},
        { text: 'Editar detalles', onPress: () => {
          Alert.alert('Editar', 'Función en desarrollo');
        }},
      ]
    );
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => {
          Alert.alert('Cancelada', 'La cita ha sido cancelada');
          navigation.goBack();
        }},
      ]
    );
  };

  const handleCompleteAppointment = () => {
    Alert.alert(
      'Marcar como Completada',
      '¿Marcar esta cita como completada?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, completar', onPress: () => {
          Alert.alert('Completada', 'La cita ha sido marcada como completada');
          navigation.goBack();
        }},
      ]
    );
  };

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'confirmed':
        return '#8CA48F';
      case 'completed':
        return '#2D3A4A';
      case 'pending':
        return '#D58E6E';
      default:
        return '#A2B2C2';
    }
  };

  const getStatusText = () => {
    switch (appointment.status) {
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Sin estado';
    }
  };

  const getStatusIcon = () => {
    switch (appointment.status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'completed':
        return 'checkmark-done-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la Cita</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Status Badge - Hidden for cleaner design */}
        {false && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Ionicons name={getStatusIcon()} size={20} color="white" />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
        )}

        {/* Main Information Card */}
        <View style={styles.mainCard}>
          <View style={styles.patientSection}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>
                {appointment.patient.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{appointment.patient}</Text>
              <Text style={styles.appointmentType}>{appointment.type}</Text>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#8CA48F" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{formatFullDate(appointment.date)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#8CA48F" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Hora</Text>
                <Text style={styles.infoValue}>{appointment.time}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="medical" size={20} color="#8CA48F" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tipo de consulta</Text>
                <Text style={styles.infoValue}>{appointment.type}</Text>
              </View>
            </View>

            {appointment.location && (
              <View style={styles.infoItem}>
                <Ionicons name="location" size={20} color="#8CA48F" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>{appointment.location || 'Consultorio principal'}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notes Card */}
        {appointment.notes && (
          <View style={styles.notesCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#8CA48F" />
              <Text style={styles.cardTitle}>Notas</Text>
            </View>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.additionalCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#8CA48F" />
            <Text style={styles.cardTitle}>Información adicional</Text>
          </View>

          <View style={styles.additionalInfo}>
            <View style={styles.additionalItem}>
              <Text style={styles.additionalLabel}>Duración estimada:</Text>
              <Text style={styles.additionalValue}>50 minutos</Text>
            </View>

            <View style={styles.additionalItem}>
              <Text style={styles.additionalLabel}>Modalidad:</Text>
              <Text style={styles.additionalValue}>Presencial</Text>
            </View>

            {appointment.status === 'completed' && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>Completada el:</Text>
                <Text style={styles.additionalValue}>{formatFullDate(appointment.date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isUpcoming() && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleEditAppointment}
              >
                <Ionicons name="create-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Editar Cita</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCancelAppointment}
              >
                <Ionicons name="close-outline" size={20} color="#D58E6E" />
                <Text style={styles.secondaryButtonText}>Cancelar Cita</Text>
              </TouchableOpacity>
            </>
          )}

          {appointment.status === 'confirmed' && isUpcoming() && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteAppointment}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.completeButtonText}>Marcar como Completada</Text>
            </TouchableOpacity>
          )}

          {isPast() && appointment.status !== 'completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteAppointment}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.completeButtonText}>Marcar como Completada</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.2,
  },
  placeholder: {
    width: 48,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F7F8FA',
  },
  patientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  patientAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#8CA48F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#8CA48F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  patientAvatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  appointmentType: {
    fontSize: 16,
    color: '#8CA48F',
    fontWeight: '600',
    backgroundColor: '#F0F7F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  infoSection: {
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8CA48F',
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
    textTransform: 'capitalize',
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F7F8FA',
    borderLeftWidth: 5,
    borderLeftColor: '#D58E6E',
  },
  additionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F7F8FA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginLeft: 12,
    letterSpacing: -0.2,
  },
  notesText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 26,
    fontStyle: 'italic',
    backgroundColor: '#FFF9F5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D58E6E',
  },
  additionalInfo: {
    gap: 16,
  },
  additionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  additionalLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  additionalValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 48,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8CA48F',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#8CA48F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D58E6E',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#D58E6E',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3A4A',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
});

export default AppointmentDetailScreen;