import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DictionaryScreen = ({ user }) => {
  const terms = [
    { term: 'Ansiedad', definition: 'Estado emocional caracterizado por sentimientos de tensión y preocupación.' },
    { term: 'Depresión', definition: 'Trastorno mental caracterizado por tristeza persistente y pérdida de interés.' },
    { term: 'Terapia Cognitiva', definition: 'Enfoque terapéutico que se centra en cambiar patrones de pensamiento negativos.' },
    { term: 'Mindfulness', definition: 'Práctica de atención plena al momento presente sin juicio.' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Diccionario</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#A2B2C2" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar término médico..."
          placeholderTextColor="#A2B2C2"
        />
      </View>
      <View style={styles.termsList}>
        {terms.map((entry, index) => (
          <View key={index} style={styles.termCard}>
            <Text style={styles.termName}>{entry.term}</Text>
            <Text style={styles.termDefinition}>{entry.definition}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3EEE9', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#2D3A4A' },
  termsList: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', shadowColor: '#2D3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  termCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3EEE9' },
  termName: { fontSize: 18, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 8 },
  termDefinition: { fontSize: 14, color: '#A2B2C2', lineHeight: 20 },
});

export default DictionaryScreen;