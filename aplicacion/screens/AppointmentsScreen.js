import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_APPOINTMENTS } from '../services/mockData';

const AppointmentsScreen = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [viewMode, setViewMode] = useState('list'); // 'calendar', 'list'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data
      const transformedAppointments = MOCK_APPOINTMENTS.map(booking => ({
        id: booking._id,
        date: new Date(booking.date),
        time: new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patient: booking.therapistName || 'Terapeuta no asignado',
        type: booking.type === 'video' ? 'Video Llamada' : 'Presencial',
        status: booking.status,
        notes: 'Nota de prueba',
        location: 'Consultorio Virtual',
        therapist: { _id: booking.therapistId, name: booking.therapistName },
        duration: booking.duration || 60,
        amount: 800,
        currency: 'MXN',
        endTime: new Date(new Date(booking.date).getTime() + (booking.duration || 60) * 60000).toISOString()
      }));
      
      setAppointments(transformedAppointments);

    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
      // Fallback to empty array on error
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Utility functions
  const formatDate = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  // Filter appointments based on current filter
  const getFilteredAppointments = () => {
    const today = new Date();

    switch (filter) {
      case 'past':
        return appointments.filter(apt => isPastDate(apt.date) || apt.status === 'completed');
      case 'upcoming':
        return appointments.filter(apt => !isPastDate(apt.date) && apt.status !== 'completed' && apt.status !== 'cancelled');
      case 'today':
        return appointments.filter(apt => isToday(apt.date));
      default:
        return appointments;
    }
  };

  // Get appointments for selected date (calendar view)
  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => isSameDate(apt.date, date));
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Adjust to start from Monday
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);

    // Adjust to end on Sunday
    endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7);

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Check if date has appointments
  const hasAppointments = (date) => {
    return appointments.some(apt => isSameDate(apt.date, date));
  };

  // Modal handler
  const handleAppointmentPress = (appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAppointment(null);
  };

  // Helper functions for status mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'upcoming':
        return '#8CA48F';
      case 'completed':
        return '#2D3A4A';
      case 'pending':
        return '#D58E6E';
      case 'cancelled':
        return '#A2B2C2';
      default:
        return '#A2B2C2';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'upcoming':
        return 'Próxima';
      case 'completed':
        return 'Coempletada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Sin estado';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'upcoming':
        return 'checkmark-circle';
      case 'completed':
        return 'checkmark-done-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  // Cancel appointment function
  const handleCancelAppointment = async (appointment) => {
    try {
      Alert.alert(
        'Cancelar Cita',
        '¿Estás seguro de que deseas cancelar esta cita?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                Alert.alert('Éxito', 'La cita ha sido cancelada exitosamente');
                closeModal();
                
                // Update local state to reflect cancellation
                setAppointments(prev => prev.map(apt => 
                  apt.id === appointment.id ? { ...apt, status: 'cancelled' } : apt
                ));
                
              } catch (err) {
                console.error('Error cancelling appointment:', err);
                Alert.alert('Error', 'Ocurrió un error al cancelar la cita');
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error in cancel handler:', err);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  const filteredAppointments = getFilteredAppointments();
  const calendarDays = generateCalendarDays();

  // Show loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8CA48F" />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

  // Show error state
  if (error && appointments.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#D58E6E" />
        <Text style={styles.errorTitle}>Error al cargar las citas</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAppointments}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#8CA48F']}
          tintColor="#8CA48F"
        />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Citas</Text>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={viewMode === 'calendar' ? 'white' : '#8CA48F'}
            />
            <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
              Calendario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === 'list' ? 'white' : '#8CA48F'}
            />
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
              Lista
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => {
                  const prevMonth = new Date(selectedDate);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedDate(prevMonth);
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#2D3A4A" />
              </TouchableOpacity>

              <Text style={styles.calendarTitle}>
                {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => {
                  const nextMonth = new Date(selectedDate);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setSelectedDate(nextMonth);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#2D3A4A" />
              </TouchableOpacity>
            </View>

            {/* Calendar Weekdays */}
            <View style={styles.weekdaysContainer}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Text key={index} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                const isSelected = isSameDate(day, selectedDate);
                const isDayToday = isToday(day);
                const dayHasAppointments = hasAppointments(day);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      !isCurrentMonth && styles.calendarDayOtherMonth,
                      isSelected && styles.calendarDaySelected,
                      isDayToday && styles.calendarDayToday,
                    ]}
                    onPress={() => setSelectedDate(new Date(day))}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      !isCurrentMonth && styles.calendarDayTextOtherMonth,
                      isSelected && styles.calendarDayTextSelected,
                      isDayToday && styles.calendarDayTextToday,
                    ]}>
                      {day.getDate()}
                    </Text>
                    {dayHasAppointments && !isSelected && (
                      <View style={styles.appointmentDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Date Appointments */}
            <View style={styles.selectedDateSection}>
              <Text style={styles.selectedDateTitle}>
                {formatDate(selectedDate)}
              </Text>

              {getAppointmentsForDate(selectedDate).length > 0 ? (
                <View style={styles.appointmentsList}>
                  {getAppointmentsForDate(selectedDate).map((appointment) => (
                    <TouchableOpacity
                      key={appointment.id}
                      style={styles.appointmentItem}
                      onPress={() => handleAppointmentPress(appointment)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.appointmentTime}>
                        <Text style={styles.timeText}>{appointment.time}</Text>
                      </View>
                      <View style={styles.appointmentDetails}>
                        <Text style={styles.appointmentPatient}>{appointment.patient}</Text>
                        <Text style={styles.appointmentType}>{appointment.type}</Text>
                        {appointment.notes && (
                          <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.appointmentStatus,
                        { backgroundColor: getStatusColor(appointment.status) }
                      ]}>
                        <Text style={styles.appointmentStatusText}>
                          {getStatusText(appointment.status)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#A2B2C2" style={styles.chevronIcon} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noAppointmentsContainer}>
                  <Text style={styles.noAppointmentsText}>No hay citas programadas para este día</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <View>
            {/* Filter Buttons */}
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
                onPress={() => setFilter('today')}
              >
                <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
                  Hoy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
                onPress={() => setFilter('upcoming')}
              >
                <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
                  Próximas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
                onPress={() => setFilter('past')}
              >
                <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
                  Pasadas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Appointments List */}
            {filteredAppointments.length > 0 ? (
              <View style={styles.appointmentsList}>
                {filteredAppointments.map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.appointmentItem}
                    onPress={() => handleAppointmentPress(appointment)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appointmentTimeContainer}>
                      <Text style={styles.timeText}>{appointment.time}</Text>
                      <Text style={styles.dateText}>{formatShortDate(appointment.date)}</Text>
                    </View>
                    <View style={styles.appointmentDetails}>
                      <Text style={styles.appointmentPatient}>{appointment.patient}</Text>
                      <Text style={styles.appointmentType}>{appointment.type}</Text>
                      {appointment.notes && (
                        <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.appointmentStatus,
                      { backgroundColor: getStatusColor(appointment.status) }
                    ]}>
                      <Text style={styles.appointmentStatusText}>
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#A2B2C2" style={styles.chevronIcon} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noAppointmentsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#A2B2C2" />
                <Text style={styles.noAppointmentsTitle}>No hay citas</Text>
                <Text style={styles.noAppointmentsText}>
                  {filter === 'past'
                    ? 'No tienes citas pasadas'
                    : filter === 'upcoming'
                    ? 'No tienes citas próximas'
                    : filter === 'today'
                    ? 'No tienes citas para hoy'
                    : 'No tienes citas programadas'
                  }
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Appointment Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAppointment && (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.placeholder} />
                  <Text style={styles.modalHeaderTitle}>Detalles de la Cita</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeModal}
                  >
                    <Ionicons name="close" size={24} color="#2D3A4A" />
                  </TouchableOpacity>
                </View>

                {/* Status Badge - Hidden for cleaner design */}
                {false && (
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, {
                      backgroundColor: getStatusColor(selectedAppointment.status)
                    }]}>
                      <Ionicons
                        name={getStatusIcon(selectedAppointment.status)}
                        size={20}
                        color="white"
                      />
                      <Text style={styles.statusText}>
                        {getStatusText(selectedAppointment.status)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Main Information Card */}
                <View style={styles.modalMainCard}>
                  <View style={styles.patientSection}>
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientAvatarText}>
                        {selectedAppointment.patient.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{selectedAppointment.patient}</Text>
                      <Text style={styles.appointmentType}>{selectedAppointment.type}</Text>
                    </View>
                  </View>

                  {/* Date and Time */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                      <Ionicons name="calendar" size={20} color="#8CA48F" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Fecha</Text>
                        <Text style={styles.infoValue}>{formatDate(selectedAppointment.date)}</Text>
                      </View>
                    </View>

                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={20} color="#8CA48F" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Hora</Text>
                        <Text style={styles.infoValue}>{selectedAppointment.time}</Text>
                      </View>
                    </View>

                    <View style={styles.infoItem}>
                      <Ionicons name="medical" size={20} color="#8CA48F" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Tipo de consulta</Text>
                        <Text style={styles.infoValue}>{selectedAppointment.type}</Text>
                      </View>
                    </View>

                    <View style={styles.infoItem}>
                      <Ionicons name="location" size={20} color="#8CA48F" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Ubicación</Text>
                        <Text style={styles.infoValue}>{selectedAppointment.location}</Text>
                      </View>
                    </View>

                    <View style={styles.infoItem}>
                      <Ionicons name="person" size={20} color="#8CA48F" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Terapeuta</Text>
                        <Text style={styles.infoValue}>{selectedAppointment.patient}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Notes Card */}
                {selectedAppointment.notes && (
                  <View style={styles.modalNotesCard}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="document-text" size={20} color="#8CA48F" />
                      <Text style={styles.cardTitle}>Notas</Text>
                    </View>
                    <Text style={styles.notesText}>{selectedAppointment.notes}</Text>
                  </View>
                )}

                {/* Additional Information */}
                <View style={styles.modalAdditionalCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="information-circle" size={20} color="#8CA48F" />
                    <Text style={styles.cardTitle}>Información adicional</Text>
                  </View>

                  <View style={styles.additionalInfo}>
                    <View style={styles.additionalItem}>
                      <Text style={styles.additionalLabel}>Duración estimada:</Text>
                      <Text style={styles.additionalValue}>{selectedAppointment.duration || 60} minutos</Text>
                    </View>

                    <View style={styles.additionalItem}>
                      <Text style={styles.additionalLabel}>Modalidad:</Text>
                      <Text style={styles.additionalValue}>Presencial</Text>
                    </View>

                    <View style={styles.additionalItem}>
                      <Text style={styles.additionalLabel}>Costo:</Text>
                      <Text style={styles.additionalValue}>{selectedAppointment.amount} {selectedAppointment.currency}</Text>
                    </View>

                    {selectedAppointment.status === 'completed' && (
                      <View style={styles.additionalItem}>
                        <Text style={styles.additionalLabel}>Completada el:</Text>
                        <Text style={styles.additionalValue}>{formatDate(selectedAppointment.date)}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActionsContainer}>
                  {!isPastDate(selectedAppointment.date) && selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <>
                      <TouchableOpacity
                        style={styles.modalPrimaryButton}
                        onPress={() => {
                          Alert.alert('Editar Cita', 'Función en desarrollo');
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color="white" />
                        <Text style={styles.modalPrimaryButtonText}>Editar Cita</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalSecondaryButton}
                        onPress={() => {
                          Alert.alert(
                            'Cancelar Cita',
                            '¿Estás seguro de que deseas cancelar esta cita?',
                            [
                              { text: 'No', style: 'cancel' },
                              { text: 'Sí, cancelar', style: 'destructive', onPress: () => {
                                Alert.alert('Cancelada', 'La cita ha sido cancelada');
                                closeModal();
                              }},
                            ]
                          );
                        }}
                      >
                        <Ionicons name="close-outline" size={20} color="#D58E6E" />
                        <Text style={styles.modalSecondaryButtonText}>Cancelar Cita</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedAppointment.status === 'cancelled' && (
                    <View style={styles.cancelledInfo}>
                      <Ionicons name="information-circle" size={16} color="#D58E6E" />
                      <Text style={styles.cancelledText}>Esta cita ha sido cancelada</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EEE9',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 20,
  },

  // View Mode Toggle
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#8CA48F',
  },
  viewModeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#8CA48F',
  },
  viewModeTextActive: {
    color: 'white',
  },

  // Calendar Styles
  calendarContainer: {
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3EEE9',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    textTransform: 'capitalize',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#A2B2C2',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: '#8CA48F',
    borderRadius: 8,
  },
  calendarDayToday: {
    backgroundColor: '#D58E6E',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3A4A',
  },
  calendarDayTextOtherMonth: {
    color: '#A2B2C2',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: 'white',
    fontWeight: 'bold',
  },
  appointmentDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8CA48F',
  },

  // Selected Date Section
  selectedDateSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3EEE9',
    paddingTop: 20,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 15,
    textTransform: 'capitalize',
  },

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#8CA48F',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8CA48F',
  },
  filterTextActive: {
    color: 'white',
  },

  // Appointments List
  appointmentsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE9',
  },
  appointmentTime: {
    width: 60,
    marginRight: 15,
  },
  appointmentTimeContainer: {
    width: 70,
    marginRight: 15,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  dateText: {
    fontSize: 12,
    color: '#A2B2C2',
    marginTop: 2,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: '#A2B2C2',
  },
  appointmentNotes: {
    fontSize: 12,
    color: '#8CA48F',
    fontStyle: 'italic',
    marginTop: 4,
  },
  appointmentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  appointmentStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  chevronIcon: {
    marginLeft: 8,
  },

  // No Appointments
  noAppointmentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  noAppointmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginTop: 16,
    marginBottom: 8,
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#A2B2C2',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F3EEE9',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3EEE9',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  modalMainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginBottom: 15,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE9',
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8CA48F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  patientAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#A2B2C2',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalNotesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalAdditionalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginLeft: 8,
  },
  notesText: {
    fontSize: 15,
    color: '#2D3A4A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  additionalInfo: {
    gap: 12,
  },
  additionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalLabel: {
    fontSize: 14,
    color: '#A2B2C2',
  },
  additionalValue: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '600',
  },
  modalActionsContainer: {
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8CA48F',
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#D58E6E',
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalSecondaryButtonText: {
    color: '#D58E6E',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3A4A',
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalCompleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Loading and Error States
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8CA48F',
    marginTop: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#A2B2C2',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Cancelled appointment info
  cancelledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D58E6E',
  },
  cancelledText: {
    color: '#D58E6E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Loading and Error States
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8CA48F',
    marginTop: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#A2B2C2',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentsScreen;