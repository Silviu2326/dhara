import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_REVIEWS, MOCK_THERAPISTS_LIST } from '../services/mockData';

const ReviewsScreen = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // New review modal states
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);
  const [newReviewLoading, setNewReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({
    therapistId: '',
    rating: 5,
    title: '',
    comment: '',
    tags: [],
    isPublic: true
  });
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [tempTag, setTempTag] = useState('');

  // Therapists selection
  const [availableTherapists, setAvailableTherapists] = useState([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [showTherapistPicker, setShowTherapistPicker] = useState(false);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api';

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Fetch client reviews
  const fetchReviews = async () => {
    try {
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data
      const transformedReviews = MOCK_REVIEWS.map(review => {
        const therapist = MOCK_THERAPISTS_LIST.find(t => t._id === review.therapistId);
        return {
          ...review,
          therapist: { name: therapist ? therapist.name : 'Terapeuta' },
          title: 'Reseña de prueba',
          tags: ['Empatía', 'Profesionalismo'],
          isVerified: true,
          hasResponse: false
        };
      });

      setReviews(transformedReviews);

    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      setError(error.message);
    }
  };

  // Fetch client review stats
  const fetchStats = async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setStats({
        totalReviews: MOCK_REVIEWS.length,
        averageRatingGiven: 4.5,
        uniqueTherapists: 1,
        reviewsWithResponse: 0
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchReviews(), fetchStats()]);
    setLoading(false);
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Fetch available therapists
  const fetchAvailableTherapists = async () => {
    try {
      setTherapistsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setAvailableTherapists(MOCK_THERAPISTS_LIST);

    } catch (error) {
      console.error('❌ Error fetching therapists:', error);
      Alert.alert('Error', 'No se pudieron cargar los terapeutas disponibles');
    } finally {
      setTherapistsLoading(false);
    }
  };

  const selectTherapist = (therapist) => {
    console.log('🎯 Selecting therapist:', therapist);
    setSelectedTherapist(therapist);
    setNewReview(prev => {
      const updated = { ...prev, therapistId: therapist._id };
      console.log('📝 Updated newReview:', updated);
      return updated;
    });
    setShowTherapistPicker(false);
  };

  const getSelectedTherapistName = () => {
    console.log('🔍 Selected therapist state:', selectedTherapist);
    console.log('🔍 newReview.therapistId:', newReview.therapistId);

    if (!selectedTherapist && !newReview.therapistId) {
      console.log('❌ No therapist selected');
      return 'Seleccionar terapeuta';
    }

    // First try to use the stored selectedTherapist object
    if (selectedTherapist) {
      console.log('✅ Using stored therapist:', selectedTherapist.name);
      return selectedTherapist.name;
    }

    // Fallback to searching in availableTherapists array
    const foundTherapist = availableTherapists.find(t => t._id === newReview.therapistId);
    console.log('✅ Found therapist in array:', foundTherapist);
    return foundTherapist?.name || 'Terapeuta seleccionado';
  };

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [user]);

  // New review functions
  const resetNewReviewForm = () => {
    setNewReview({
      therapistId: '',
      rating: 5,
      title: '',
      comment: '',
      tags: [],
      isPublic: true
    });
    setSelectedTherapist(null);
    setTempTag('');
  };

  const openNewReviewModal = () => {
    resetNewReviewForm();
    setShowNewReviewModal(true);
    fetchAvailableTherapists();
  };

  const closeNewReviewModal = () => {
    setShowNewReviewModal(false);
    setShowTherapistPicker(false);
    setSelectedTherapist(null);
    resetNewReviewForm();
  };

  const addTag = () => {
    if (tempTag.trim() && !newReview.tags.includes(tempTag.trim().toLowerCase())) {
      setNewReview(prev => ({
        ...prev,
        tags: [...prev.tags, tempTag.trim().toLowerCase()]
      }));
      setTempTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewReview(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const submitNewReview = async () => {
    // Validation
    if (!newReview.therapistId) {
      Alert.alert('Error', 'Debes seleccionar un terapeuta');
      return;
    }

    if (!newReview.title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (!newReview.comment.trim()) {
      Alert.alert('Error', 'El comentario es obligatorio');
      return;
    }

    if (newReview.title.length < 5) {
      Alert.alert('Error', 'El título debe tener al menos 5 caracteres');
      return;
    }

    if (newReview.comment.length < 10) {
      Alert.alert('Error', 'El comentario debe tener al menos 10 caracteres');
      return;
    }

    try {
      setNewReviewLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('¡Éxito!', 'Tu reseña ha sido creada correctamente');
      closeNewReviewModal();
      
      // Add new review to local state (mock)
      const newReviewObj = {
        _id: 'new-review-' + Date.now(),
        therapistId: newReview.therapistId,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString(),
        clientName: 'Yo',
        therapist: { name: getSelectedTherapistName() },
        title: newReview.title,
        tags: newReview.tags,
        isVerified: true,
        hasResponse: false
      };
      
      setReviews(prev => [newReviewObj, ...prev]);

    } catch (error) {
      console.error('❌ Error creating review:', error);
      Alert.alert('Error', `No se pudo crear la reseña: ${error.message}`);
    } finally {
      setNewReviewLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Reseñas</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8CA48F" />
          <Text style={styles.loadingText}>Cargando reseñas...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Reseñas</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          Mis Reseñas {reviews.length > 0 && `(${reviews.length})`}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={openNewReviewModal}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Nueva Reseña</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#8CA48F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary */}
      {stats.totalReviews > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageRatingGiven?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.uniqueTherapists || 0}</Text>
            <Text style={styles.statLabel}>Terapeutas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.reviewsWithResponse || 0}</Text>
            <Text style={styles.statLabel}>Con Respuesta</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.reviewsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={60} color="#8CA48F" />
            <Text style={styles.emptyTitle}>Sin reseñas aún</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán las reseñas que escribas sobre tus terapeutas.
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.therapistInfo}>
                  <Text style={styles.reviewTherapist}>
                    {review.therapist?.name || 'Terapeuta'}
                  </Text>
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                </View>
                <View style={styles.reviewRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? "star" : "star-outline"}
                      size={18}
                      color="#D58E6E"
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.reviewComment}>{review.comment}</Text>

              {review.tags && review.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {review.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.reviewFooter}>
                <Text style={styles.reviewDate}>
                  {formatDate(review.createdAt)}
                </Text>
                <View style={styles.reviewBadges}>
                  {review.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.verifiedText}>Verificada</Text>
                    </View>
                  )}
                  {review.hasResponse && (
                    <View style={styles.responseBadge}>
                      <Ionicons name="chatbubble" size={14} color="#2196F3" />
                      <Text style={styles.responseText}>Respondida</Text>
                    </View>
                  )}
                </View>
              </View>

              {review.response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Respuesta del terapeuta:</Text>
                  <Text style={styles.responseText}>{review.response}</Text>
                  <Text style={styles.responseDate}>
                    {formatDate(review.responseDate)}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* New Review Modal */}
      <Modal
        visible={showNewReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeNewReviewModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeNewReviewModal}>
              <Ionicons name="close" size={24} color="#2D3A4A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Reseña</Text>
            <TouchableOpacity
              onPress={submitNewReview}
              disabled={newReviewLoading}
              style={[
                styles.saveButton,
                newReviewLoading && styles.saveButtonDisabled
              ]}
            >
              {newReviewLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Therapist Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Terapeuta</Text>
              <TouchableOpacity
                style={styles.therapistSelector}
                onPress={() => setShowTherapistPicker(true)}
                disabled={therapistsLoading}
              >
                <Ionicons name="person" size={20} color="#8CA48F" />
                {therapistsLoading ? (
                  <ActivityIndicator size="small" color="#8CA48F" />
                ) : (
                  <Text style={[
                    styles.selectedTherapist,
                    !newReview.therapistId && styles.placeholderText
                  ]}>
                    {getSelectedTherapistName()}
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#8CA48F" />
              </TouchableOpacity>
            </View>

            {/* Rating */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Calificación</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= newReview.rating ? "star" : "star-outline"}
                      size={28}
                      color={star <= newReview.rating ? "#D58E6E" : "#A2B2C2"}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingText}>({newReview.rating} estrellas)</Text>
              </View>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Título de la reseña</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Excelente profesional"
                value={newReview.title}
                onChangeText={(text) => setNewReview(prev => ({ ...prev, title: text }))}
                maxLength={100}
              />
              <Text style={styles.charCount}>{newReview.title.length}/100</Text>
            </View>

            {/* Comment */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Comentario</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Comparte tu experiencia con este terapeuta..."
                value={newReview.comment}
                onChangeText={(text) => setNewReview(prev => ({ ...prev, comment: text }))}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
              <Text style={styles.charCount}>{newReview.comment.length}/1000</Text>
            </View>

            {/* Tags */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tags (opcional)</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Agregar tag"
                  value={tempTag}
                  onChangeText={setTempTag}
                  onSubmitEditing={addTag}
                  maxLength={30}
                />
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <Ionicons name="add" size={20} color="#8CA48F" />
                </TouchableOpacity>
              </View>

              {newReview.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {newReview.tags.map((tag, index) => (
                    <View key={index} style={styles.modalTag}>
                      <Text style={styles.modalTagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <Ionicons name="close-circle" size={16} color="#8CA48F" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Public toggle */}
            <View style={styles.formGroup}>
              <View style={styles.toggleContainer}>
                <Text style={styles.formLabel}>Reseña pública</Text>
                <TouchableOpacity
                  onPress={() => setNewReview(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  style={[
                    styles.toggleButton,
                    newReview.isPublic && styles.toggleButtonActive
                  ]}
                >
                  <Ionicons
                    name={newReview.isPublic ? "checkmark" : "close"}
                    size={16}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.toggleDescription}>
                {newReview.isPublic
                  ? 'Tu reseña será visible para otros usuarios'
                  : 'Tu reseña será privada, solo visible para ti y el terapeuta'
                }
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Therapist Picker Modal */}
      <Modal
        visible={showTherapistPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTherapistPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTherapistPicker(false)}>
              <Ionicons name="close" size={24} color="#2D3A4A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Terapeuta</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {therapistsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8CA48F" />
                <Text style={styles.loadingText}>Cargando terapeutas...</Text>
              </View>
            ) : availableTherapists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={60} color="#8CA48F" />
                <Text style={styles.emptyTitle}>No hay terapeutas disponibles</Text>
                <Text style={styles.emptyText}>
                  No se encontraron terapeutas disponibles en este momento.
                </Text>
              </View>
            ) : (
              availableTherapists.map((therapist) => (
                <TouchableOpacity
                  key={therapist._id}
                  style={[
                    styles.therapistOption,
                    (selectedTherapist?._id === therapist._id || newReview.therapistId === therapist._id) && styles.therapistOptionSelected
                  ]}
                  onPress={() => selectTherapist(therapist)}
                >
                  <View style={styles.therapistInfo}>
                    <Text style={styles.therapistName}>{therapist.name}</Text>
                    {therapist.specialties && therapist.specialties.length > 0 && (
                      <Text style={styles.therapistSpecialties}>
                        {therapist.specialties.slice(0, 2).join(', ')}
                        {therapist.specialties.length > 2 && ' +' + (therapist.specialties.length - 2)}
                      </Text>
                    )}
                    {therapist.averageRating && (
                      <View style={styles.therapistRating}>
                        <Ionicons name="star" size={14} color="#D58E6E" />
                        <Text style={styles.ratingValue}>{therapist.averageRating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  {(selectedTherapist?._id === therapist._id || newReview.therapistId === therapist._id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#8CA48F" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3A4A'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8CA48F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  refreshButton: {
    padding: 8,
  },

  // Loading and error states
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

  // Stats container
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8CA48F',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'center'
  },

  // Reviews list
  reviewsList: {
    flex: 1
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2D3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  therapistInfo: {
    flex: 1,
    marginRight: 12
  },
  reviewTherapist: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8CA48F'
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2
  },
  reviewComment: {
    fontSize: 14,
    color: '#2D3A4A',
    marginBottom: 12,
    lineHeight: 20
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6
  },
  tag: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4
  },
  tagText: {
    fontSize: 12,
    color: '#8CA48F',
    fontWeight: '500'
  },

  // Review footer
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewDate: {
    fontSize: 12,
    color: '#A2B2C2'
  },
  reviewBadges: {
    flexDirection: 'row',
    gap: 8
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4
  },
  verifiedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500'
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4
  },
  responseText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '500'
  },

  // Response container
  responseContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8CA48F'
  },
  responseLabel: {
    fontSize: 12,
    color: '#8CA48F',
    fontWeight: '600',
    marginBottom: 6
  },
  responseDate: {
    fontSize: 10,
    color: '#A2B2C2',
    marginTop: 6
  },

  // Empty state
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

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3EEE9'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE9'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3A4A'
  },
  saveButton: {
    backgroundColor: '#8CA48F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80
  },
  saveButtonDisabled: {
    backgroundColor: '#A2B2C2'
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },

  // Form styles
  formGroup: {
    marginBottom: 24
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    marginBottom: 8
  },
  therapistSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    justifyContent: 'space-between'
  },
  selectedTherapist: {
    fontSize: 16,
    color: '#2D3A4A',
    fontWeight: '500',
    flex: 1
  },
  placeholderText: {
    color: '#A2B2C2',
    fontWeight: '400'
  },
  ratingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 8
  },
  starButton: {
    padding: 4
  },
  ratingText: {
    fontSize: 14,
    color: '#8CA48F',
    fontWeight: '500',
    marginLeft: 12
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2D3A4A',
    textAlignVertical: 'top'
  },
  textArea: {
    minHeight: 100
  },
  charCount: {
    fontSize: 12,
    color: '#A2B2C2',
    textAlign: 'right',
    marginTop: 4
  },

  // Tags input
  tagInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3A4A'
  },
  addTagButton: {
    padding: 4
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    gap: 6
  },
  modalTagText: {
    fontSize: 12,
    color: '#8CA48F',
    fontWeight: '500'
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A2B2C2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  toggleButtonActive: {
    backgroundColor: '#8CA48F'
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20
  },

  // Therapist picker styles
  therapistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'space-between'
  },
  therapistOptionSelected: {
    borderColor: '#8CA48F',
    borderWidth: 2
  },
  therapistInfo: {
    flex: 1,
    marginRight: 12
  },
  therapistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    marginBottom: 4
  },
  therapistSpecialties: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6
  },
  therapistRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingValue: {
    fontSize: 14,
    color: '#8CA48F',
    fontWeight: '500'
  }
});

export default ReviewsScreen;