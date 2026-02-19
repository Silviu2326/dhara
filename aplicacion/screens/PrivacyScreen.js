import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PrivacyScreen = ({ user }) => {
  const privacyItems = [
    { title: 'Configuración de privacidad', description: 'Controla quién puede ver tu información' },
    { title: 'Historial de datos', description: 'Consulta qué datos hemos recopilado' },
    { title: 'Eliminar cuenta', description: 'Eliminar permanentemente tu cuenta y datos' },
    { title: 'Política de privacidad', description: 'Lee nuestra política de privacidad' },
    { title: 'Términos de servicio', description: 'Consulta los términos de uso' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacidad</Text>
      <View style={styles.privacyList}>
        {privacyItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.privacyItem}>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>{item.title}</Text>
              <Text style={styles.privacyDescription}>{item.description}</Text>
            </View>
            <Text style={styles.privacyArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 20 },
  privacyList: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', shadowColor: '#2D3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  privacyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3EEE9' },
  privacyContent: { flex: 1 },
  privacyTitle: { fontSize: 16, color: '#2D3A4A', fontWeight: '600' },
  privacyDescription: { fontSize: 12, color: '#A2B2C2', marginTop: 4 },
  privacyArrow: { fontSize: 20, color: '#A2B2C2' },
});

export default PrivacyScreen;