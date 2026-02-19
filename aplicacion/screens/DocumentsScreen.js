import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_DOCUMENTS } from '../services/mockData';

const DocumentsScreen = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api';

  // Map file types to display types
  const getFileTypeFromMimeType = (mimeType, originalName) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'IMG';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS';
    if (mimeType.includes('text')) return 'TXT';
    if (mimeType.includes('audio')) return 'MP3';
    if (mimeType.includes('video')) return 'MP4';

    // Fallback to file extension
    const ext = originalName.split('.').pop().toUpperCase();
    return ext || 'FILE';
  };

  // Get file type color
  const getFileTypeColor = (type) => {
    const colors = {
      'PDF': '#FF6B6B',
      'IMG': '#4ECDC4',
      'DOC': '#45B7D1',
      'XLS': '#96CEB4',
      'TXT': '#FECA57',
      'MP3': '#FF9FF3',
      'MP4': '#A29BFE',
      'FILE': '#A2B2C2'
    };
    return colors[type] || '#A2B2C2';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Helper function to download files in web environment
  const downloadFileFromUrl = (url, filename) => {
    if (Platform.OS === 'web') {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';

      // Add link to document, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For mobile, you could use a different approach like expo-file-system
      Linking.openURL(url);
    }
  };

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data
      const transformedDocuments = MOCK_DOCUMENTS.map(doc => ({
        _id: doc._id,
        title: doc.name,
        originalName: doc.name,
        mimeType: doc.type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024 * 1024 * (doc.size.includes('MB') ? parseFloat(doc.size) : 0.5), // Mock size in bytes
        humanFileSize: doc.size,
        createdAt: doc.uploadedAt,
        therapist: { name: 'Ana García' },
        category: 'general'
      }));

      setDocuments(transformedDocuments);

    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Download document
  const downloadDocument = async (documentId, filename) => {
    try {
      setDownloadingId(documentId);

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Descarga Simulada',
        `El documento "${filename}" se ha descargado (simulación).`
      );

    } catch (error) {
      console.error('❌ Error downloading document:', error);
      Alert.alert('Error', `Error al descargar: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Load documents when component mounts
  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8CA48F" />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDocuments}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={60} color="#8CA48F" />
          <Text style={styles.emptyTitle}>No tienes documentos</Text>
          <Text style={styles.emptyText}>
            Los documentos compartidos por tu terapeuta aparecerán aquí.
          </Text>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Documentos ({documents.length})</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchDocuments}>
          <Ionicons name="refresh" size={20} color="#8CA48F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
        {documents.map((doc) => {
          const fileType = getFileTypeFromMimeType(doc.mimeType, doc.originalName);
          const fileTypeColor = getFileTypeColor(fileType);
          const isDownloading = downloadingId === doc._id;

          return (
            <View key={doc._id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentTitleContainer}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  {doc.therapist && (
                    <Text style={styles.therapistName}>
                      Dr. {doc.therapist.name}
                    </Text>
                  )}
                </View>
                <View style={[styles.documentType, { backgroundColor: fileTypeColor }]}>
                  <Text style={styles.documentTypeText}>{fileType}</Text>
                </View>
              </View>

              <View style={styles.documentMeta}>
                <Text style={styles.documentInfo}>
                  {doc.humanFileSize} • {formatDate(doc.createdAt)}
                </Text>
                {doc.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {doc.category.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.downloadButton, isDownloading && styles.downloadingButton]}
                onPress={() => downloadDocument(doc._id, doc.originalName)}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.downloadButtonText}>Descargando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color="white" />
                    <Text style={styles.downloadButtonText}>Descargar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
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
  refreshButton: {
    padding: 8,
  },
  documentsList: {
    flex: 1
  },
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  documentTitleContainer: {
    flex: 1,
    marginRight: 12
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3A4A',
    marginBottom: 4
  },
  therapistName: {
    fontSize: 14,
    color: '#8CA48F',
    fontWeight: '500'
  },
  documentType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center'
  },
  documentTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600'
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  documentInfo: {
    fontSize: 14,
    color: '#A2B2C2'
  },
  categoryBadge: {
    backgroundColor: '#F3EEE9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  categoryText: {
    fontSize: 10,
    color: '#8CA48F',
    fontWeight: '500'
  },
  downloadButton: {
    backgroundColor: '#8CA48F',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  downloadingButton: {
    backgroundColor: '#A2B2C2'
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  },

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

export default DocumentsScreen;