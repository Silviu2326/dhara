import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { availabilityService } from '../services/availabilityService';
const AgendaScreen = ({ navigation, user, route }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTherapyType, setSelectedTherapyType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // Get therapist info from navigation params or use default
  const navParams = route?.params || {};
  const [therapistId, setTherapistId] = useState(navParams.therapistId || '60f7b3b3b3b3b3b3b3b3b3b3');
  const [selectedTherapist, setSelectedTherapist] = useState(navParams.selectedTherapist || null);
  const [dateAvailability, setDateAvailability] = useState({});

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Generate days for the selected month
  const getDaysForMonth = (monthDate) => {
    const days = [];
    const today = new Date();
    const startDate = new Date(Math.max(today.getTime(), monthDate.getTime()));

    // Get first day of the month and last day
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    // Start from today or first of month (whichever is later)
    let currentDate = new Date(Math.max(firstDay.getTime(), today.getTime()));

    // Add next 45 days from current date if we're in current month
    const endDate = monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear()
      ? new Date(today.getTime() + (45 * 24 * 60 * 60 * 1000))
      : lastDay;

    while (currentDate <= endDate) {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

      days.push({
        date: new Date(currentDate),
        dayName: currentDate.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: currentDate.getDate(),
        month: currentDate.toLocaleDateString('es-ES', { month: 'short' }),
        fullDate: currentDate.toISOString().split('T')[0],
        isWeekend: isWeekend,
        isPast: currentDate < today
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Get months for selector (current + next 6 months)
  const getAvailableMonths = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({
        date: monthDate,
        name: monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        shortName: monthDate.toLocaleDateString('es-ES', { month: 'short' })
      });
    }

    return months;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null); // Reset selected date when changing month
  };

  // Base time slots (used as fallback)
  const baseTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
  ];

  // Therapy types
  const therapyTypes = [
    { id: 'individual', name: 'Terapia Individual', duration: '60 min', price: '€80' },
    { id: 'couples', name: 'Terapia de Pareja', duration: '90 min', price: '€120' },
    { id: 'group', name: 'Terapia Grupal', duration: '90 min', price: '€60' },
    { id: 'consultation', name: 'Consulta Inicial', duration: '45 min', price: '€60' }
  ];

  // Location options
  const locationOptions = [
    { id: 'presencial', name: 'Presencial', icon: 'location-outline', description: 'En consulta' },
    { id: 'online', name: 'Online', icon: 'videocam-outline', description: 'Videollamada' }
  ];

  const availableDays = getDaysForMonth(currentMonth);
  const availableMonths = getAvailableMonths();

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDate && therapistId) {
      loadAvailableSlots(selectedDate.fullDate);
    }
  }, [selectedDate, therapistId, selectedTherapyType]);

  // Load available slots from backend
  const loadAvailableSlots = async (date) => {
    try {
      setLoading(true);
      const sessionDuration = selectedTherapyType?.duration === '90 min' ? 90 : 60;

      const response = await availabilityService.getAvailableSlotsForDate(
        therapistId,
        date,
        sessionDuration
      );

      if (response.success) {
        const slots = response.data.slots || [];
        // Extract just the start times for the UI
        const timeSlots = slots.map(slot => slot.startTime).sort();
        setAvailableSlots(timeSlots);

        // Store full slot data for booking
        setDateAvailability({
          ...dateAvailability,
          [date]: {
            isAvailable: response.data.isAvailable,
            slots: slots,
            reason: response.data.reason
          }
        });
      } else {
        console.warn('Failed to load availability:', response.error);
        // Fallback to simulated data
        const fallbackSlots = selectedDate.isWeekend
          ? ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30']
          : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        setAvailableSlots(fallbackSlots);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      // Fallback to basic time slots
      const fallbackSlots = selectedDate.isWeekend
        ? ['10:00', '10:30', '11:00', '11:30']
        : ['09:00', '10:00', '11:00', '14:00', '15:00'];
      setAvailableSlots(fallbackSlots);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelection = (day) => {
    setSelectedDate(day);
    setSelectedTime(null); // Reset time selection when date changes
  };

  const handleTimeSelection = (time) => {
    setSelectedTime(time);
  };

  const handleTherapyTypeSelection = (therapy) => {
    setSelectedTherapyType(therapy);
  };

  const handleLocationSelection = (location) => {
    setSelectedLocation(location);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedTherapyType || !selectedLocation) {
      Alert.alert('Información incompleta', 'Por favor selecciona fecha, hora, tipo de terapia y modalidad.');
      return;
    }

    setLoading(true);

    try {
      // Calculate end time based on therapy duration
      const startTime = selectedTime;
      const duration = selectedTherapyType.duration === '90 min' ? 90 : selectedTherapyType.duration === '45 min' ? 45 : 60;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + duration);
      const endTime = endDate.toTimeString().slice(0, 5);

      // First, verify the slot is still available
      const availabilityCheck = await availabilityService.checkSlotAvailability(
        therapistId,
        selectedDate.fullDate,
        startTime,
        endTime
      );

      if (!availabilityCheck.success || !availabilityCheck.available) {
        Alert.alert(
          'Horario no disponible',
          availabilityCheck.reason || 'Lo sentimos, este horario ya no está disponible. Por favor selecciona otro horario.',
          [{ text: 'OK' }]
        );
        // Reload available slots
        await loadAvailableSlots(selectedDate.fullDate);
        setSelectedTime(null);
        return;
      }

      // For now, show success (booking API would go here)
      Alert.alert(
        'Cita agendada exitosamente',
        `Tu cita de ${selectedTherapyType.name} está programada para el ${selectedDate.dayName} ${selectedDate.dayNumber} de ${selectedDate.month} a las ${selectedTime} (${selectedLocation.name})\n\nDuración: ${selectedTherapyType.duration}\nTerapeuta: Verificado`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation && navigation.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'No se pudo agendar la cita. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation && navigation.goBack && navigation.goBack()}
              activeOpacity={0.7}
            >
              <View style={styles.backButtonCircle}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>✨ Agendar Cita</Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.headerSubtitle}>
            {selectedTherapist
              ? `Agendar con ${selectedTherapist.name}`
              : 'Selecciona tu cita perfecta'
            }
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.contentAnimated,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Date Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="calendar" size={24} color="#8CA48F" />
              <Text style={styles.sectionTitle}>Selecciona fecha</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Elige el día que mejor te convenga</Text>

            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => navigateMonth(-1)}
                disabled={currentMonth.getMonth() === new Date().getMonth() &&
                         currentMonth.getFullYear() === new Date().getFullYear()}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={currentMonth.getMonth() === new Date().getMonth() &&
                        currentMonth.getFullYear() === new Date().getFullYear()
                        ? "#A2B2C2" : "#8CA48F"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthDisplay}
                onPress={() => setShowMonthSelector(!showMonthSelector)}
              >
                <Text style={styles.monthDisplayText}>
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8CA48F" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => navigateMonth(1)}
                disabled={currentMonth.getMonth() === new Date().getMonth() + 5}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={currentMonth.getMonth() === new Date().getMonth() + 5
                        ? "#A2B2C2" : "#8CA48F"}
                />
              </TouchableOpacity>
            </View>

            {/* Month Dropdown */}
            {showMonthSelector && (
              <View style={styles.monthDropdown}>
                {availableMonths.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthOption,
                      currentMonth.getTime() === month.date.getTime() && styles.monthOptionSelected
                    ]}
                    onPress={() => {
                      setCurrentMonth(month.date);
                      setShowMonthSelector(false);
                      setSelectedDate(null);
                    }}
                  >
                    <Text style={[
                      styles.monthOptionText,
                      currentMonth.getTime() === month.date.getTime() && styles.monthOptionTextSelected
                    ]}>
                      {month.name}
                    </Text>
                    {currentMonth.getTime() === month.date.getTime() && (
                      <Ionicons name="checkmark" size={16} color="#8CA48F" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Calendar Days */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {availableDays.map((day, index) => {
                const isDisabled = day.isPast || (day.isWeekend && false); // Can enable weekend restriction here

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCard,
                      selectedDate?.fullDate === day.fullDate && styles.dateCardSelected,
                      day.isWeekend && styles.dateCardWeekend,
                      isDisabled && styles.dateCardDisabled
                    ]}
                    onPress={() => !isDisabled && handleDateSelection(day)}
                    activeOpacity={isDisabled ? 1 : 0.8}
                    disabled={isDisabled}
                  >
                    {selectedDate?.fullDate === day.fullDate && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      </View>
                    )}

                    {day.isWeekend && !selectedDate && (
                      <View style={styles.weekendBadge}>
                        <Ionicons name="sunny" size={12} color="#D58E6E" />
                      </View>
                    )}

                    <Text style={[
                      styles.dayName,
                      selectedDate?.fullDate === day.fullDate && styles.dateTextSelected,
                      day.isWeekend && styles.weekendText,
                      isDisabled && styles.disabledText
                    ]}>
                      {day.dayName.toUpperCase()}
                    </Text>

                    <Text style={[
                      styles.dayNumber,
                      selectedDate?.fullDate === day.fullDate && styles.dateTextSelected,
                      day.isWeekend && styles.weekendText,
                      isDisabled && styles.disabledText
                    ]}>
                      {day.dayNumber}
                    </Text>

                    <Text style={[
                      styles.month,
                      selectedDate?.fullDate === day.fullDate && styles.dateTextSelected,
                      day.isWeekend && styles.weekendText,
                      isDisabled && styles.disabledText
                    ]}>
                      {day.month.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Days counter */}
            <Text style={styles.daysCounter}>
              Mostrando {availableDays.length} días disponibles
            </Text>
          </View>

          {/* Time Selection */}
          {selectedDate && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderContainer}>
                <Ionicons name="time" size={24} color="#C9A2A6" />
                <Text style={styles.sectionTitle}>Selecciona hora</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Horarios disponibles para el {selectedDate.dayName} {selectedDate.dayNumber}
                {selectedDate.isWeekend && (
                  <Text style={styles.weekendNote}> • Horario de fin de semana</Text>
                )}
              </Text>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingCircle}>
                    <ActivityIndicator size="large" color="#8CA48F" />
                  </View>
                  <Text style={styles.loadingText}>✨ Cargando horarios disponibles...</Text>
                </View>
              ) : (
                <View style={styles.timeGrid}>
                  {availableSlots.map((time, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotSelected
                      ]}
                      onPress={() => handleTimeSelection(time)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={selectedTime === time ? "#FFFFFF" : "#8CA48F"}
                        style={styles.timeIcon}
                      />
                      <Text style={[
                        styles.timeText,
                        selectedTime === time && styles.timeTextSelected
                      ]}>
                        {time}
                      </Text>
                      {selectedTime === time && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Therapy Type Selection */}
          {selectedTime && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderContainer}>
                <Ionicons name="medical" size={24} color="#D58E6E" />
                <Text style={styles.sectionTitle}>Tipo de terapia</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Elige el tipo de sesión que necesitas</Text>

              {therapyTypes.map((therapy) => {
                const getTherapyIcon = (id) => {
                  switch (id) {
                    case 'individual': return 'person';
                    case 'couples': return 'heart';
                    case 'group': return 'people';
                    case 'consultation': return 'chatbubble-ellipses';
                    default: return 'medical';
                  }
                };

                return (
                  <TouchableOpacity
                    key={therapy.id}
                    style={[
                      styles.therapyCard,
                      selectedTherapyType?.id === therapy.id && styles.therapyCardSelected
                    ]}
                    onPress={() => handleTherapyTypeSelection(therapy)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.therapyIconContainer}>
                      <Ionicons
                        name={getTherapyIcon(therapy.id)}
                        size={28}
                        color={selectedTherapyType?.id === therapy.id ? "#8CA48F" : "#A2B2C2"}
                      />
                    </View>
                    <View style={styles.therapyInfo}>
                      <Text style={[
                        styles.therapyName,
                        selectedTherapyType?.id === therapy.id && styles.therapyTextSelected
                      ]}>
                        {therapy.name}
                      </Text>
                      <View style={styles.therapyDetailsContainer}>
                        <View style={styles.therapyDetailItem}>
                          <Ionicons name="time" size={14} color={selectedTherapyType?.id === therapy.id ? "#8CA48F" : "#A2B2C2"} />
                          <Text style={[
                            styles.therapyDetailText,
                            selectedTherapyType?.id === therapy.id && styles.therapyTextSelected
                          ]}>
                            {therapy.duration}
                          </Text>
                        </View>
                        <View style={styles.therapyDetailItem}>
                          <Ionicons name="card" size={14} color={selectedTherapyType?.id === therapy.id ? "#8CA48F" : "#A2B2C2"} />
                          <Text style={[
                            styles.therapyPrice,
                            selectedTherapyType?.id === therapy.id && styles.therapyPriceSelected
                          ]}>
                            {therapy.price}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.therapyCheckContainer}>
                      {selectedTherapyType?.id === therapy.id && (
                        <View style={styles.checkmarkCircle}>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Location Selection */}
          {selectedTherapyType && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderContainer}>
                <Ionicons name="location" size={24} color="#A2B2C2" />
                <Text style={styles.sectionTitle}>Modalidad</Text>
              </View>
              <Text style={styles.sectionSubtitle}>¿Cómo prefieres tu sesión?</Text>

              <View style={styles.locationRow}>
                {locationOptions.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.locationCard,
                      selectedLocation?.id === location.id && styles.locationCardSelected
                    ]}
                    onPress={() => handleLocationSelection(location)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.locationIconContainer,
                      selectedLocation?.id === location.id && styles.locationIconSelected
                    ]}>
                      <Ionicons
                        name={location.icon}
                        size={32}
                        color={selectedLocation?.id === location.id ? "#FFFFFF" : "#8CA48F"}
                      />
                    </View>
                    <Text style={[
                      styles.locationName,
                      selectedLocation?.id === location.id && styles.locationTextSelected
                    ]}>
                      {location.name}
                    </Text>
                    <Text style={[
                      styles.locationDescription,
                      selectedLocation?.id === location.id && styles.locationTextSelected
                    ]}>
                      {location.description}
                    </Text>
                    {selectedLocation?.id === location.id && (
                      <View style={styles.locationCheckmark}>
                        <Ionicons name="checkmark-circle" size={20} color="#8CA48F" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Summary and Book Button */}
          {selectedDate && selectedTime && selectedTherapyType && selectedLocation && (
            <View style={styles.finalSection}>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="clipboard" size={24} color="#8CA48F" />
                  <Text style={styles.summaryTitle}>✨ Resumen de tu cita</Text>
                </View>

                <View style={styles.summaryContent}>
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconContainer}>
                      <Ionicons name="calendar" size={20} color="#8CA48F" />
                    </View>
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>Fecha y hora</Text>
                      <Text style={styles.summaryText}>
                        {selectedDate.dayName} {selectedDate.dayNumber} de {selectedDate.month} a las {selectedTime}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconContainer}>
                      <Ionicons name="medical" size={20} color="#C9A2A6" />
                    </View>
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>Tipo de sesión</Text>
                      <Text style={styles.summaryText}>
                        {selectedTherapyType.name}
                      </Text>
                      <Text style={styles.summarySubtext}>
                        Duración: {selectedTherapyType.duration}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconContainer}>
                      <Ionicons name="location" size={20} color="#D58E6E" />
                    </View>
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>Modalidad</Text>
                      <Text style={styles.summaryText}>
                        {selectedLocation.name}
                      </Text>
                      <Text style={styles.summarySubtext}>
                        {selectedLocation.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryPriceContainer}>
                    <Text style={styles.summaryPriceLabel}>Total a pagar</Text>
                    <Text style={styles.summaryPrice}>{selectedTherapyType.price}</Text>
                  </View>
                </View>
              </View>

              {/* Book Button with Gradient */}
              <TouchableOpacity
                style={[styles.bookButton, loading && styles.bookButtonDisabled]}
                onPress={handleBookAppointment}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.bookButtonContent}>
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.bookButtonText}>Procesando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                      <Text style={styles.bookButtonText}>🎉 Confirmar Cita</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <Text style={styles.disclaimerText}>
                Al confirmar tu cita aceptas nuestros términos y condiciones
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EEE9',
  },

  // Header Styles
  headerContainer: {
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
    backgroundColor: '#8CA48F',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  placeholder: {
    width: 40,
  },

  // Content Styles
  content: {
    flex: 1,
  },
  contentAnimated: {
    padding: 20,
  },

  // Section Styles
  section: {
    marginBottom: 30,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginLeft: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A2B2C2',
    marginBottom: 20,
    lineHeight: 20,
  },
  weekendNote: {
    color: '#D58E6E',
    fontWeight: '600',
    fontSize: 12,
  },

  // Date Selection Styles
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EEE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  monthDisplayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  monthDropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  monthOptionSelected: {
    backgroundColor: '#F8FCF8',
  },
  monthOptionText: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  monthOptionTextSelected: {
    color: '#8CA48F',
    fontWeight: 'bold',
  },
  dateScroll: {
    flexDirection: 'row',
    paddingBottom: 5,
    marginBottom: 15,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  dateCardSelected: {
    backgroundColor: '#8CA48F',
    borderColor: '#7A9680',
    transform: [{ scale: 1.05 }],
  },
  dateCardWeekend: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE4B5',
    borderWidth: 1,
  },
  dateCardDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#8CA48F',
    borderRadius: 12,
    padding: 2,
  },
  weekendBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFE4B5',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 11,
    color: '#A2B2C2',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4,
  },
  month: {
    fontSize: 11,
    color: '#A2B2C2',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dateTextSelected: {
    color: 'white',
  },
  weekendText: {
    color: '#D58E6E',
  },
  disabledText: {
    color: '#CCCCCC',
  },
  daysCounter: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingCircle: {
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#A2B2C2',
    textAlign: 'center',
  },

  // Time Grid Styles
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 50,
  },
  timeSlotSelected: {
    backgroundColor: '#8CA48F',
    borderColor: '#7A9680',
    transform: [{ scale: 1.05 }],
  },
  timeIcon: {
    marginRight: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#2D3A4A',
    fontWeight: '600',
    marginHorizontal: 4,
  },
  timeTextSelected: {
    color: 'white',
  },

  // Therapy Card Styles
  therapyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  therapyCardSelected: {
    borderColor: '#8CA48F',
    backgroundColor: '#F8FCF8',
    transform: [{ scale: 1.02 }],
  },
  therapyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3EEE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  therapyInfo: {
    flex: 1,
  },
  therapyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 8,
  },
  therapyDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  therapyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  therapyDetailText: {
    fontSize: 14,
    color: '#A2B2C2',
    marginLeft: 4,
    fontWeight: '500',
  },
  therapyPrice: {
    fontSize: 16,
    color: '#8CA48F',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  therapyPriceSelected: {
    color: '#8CA48F',
  },
  therapyTextSelected: {
    color: '#8CA48F',
  },
  therapyCheckContainer: {
    width: 30,
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8CA48F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Location Styles
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  locationCardSelected: {
    borderColor: '#8CA48F',
    backgroundColor: '#F8FCF8',
    transform: [{ scale: 1.05 }],
  },
  locationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3EEE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  locationIconSelected: {
    backgroundColor: '#8CA48F',
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 6,
    textAlign: 'center',
  },
  locationDescription: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center',
  },
  locationTextSelected: {
    color: '#8CA48F',
  },
  locationCheckmark: {
    position: 'absolute',
    top: -8,
    right: -8,
  },

  // Final Section Styles
  finalSection: {
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginLeft: 12,
  },
  summaryContent: {
    paddingTop: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EEE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#A2B2C2',
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '500',
    lineHeight: 22,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#A2B2C2',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  summaryPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  summaryPriceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A',
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8CA48F',
  },

  // Book Button Styles
  bookButton: {
    backgroundColor: '#8CA48F',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#8CA48F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: '#A2B2C2',
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
});

export default AgendaScreen;