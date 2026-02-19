import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpCenterScreen = ({ user }) => {
  const helpItems = [
    { title: 'Cómo agendar una cita', category: 'Citas', icon: 'help-circle-outline' },
    { title: 'Configurar notificaciones', category: 'Configuración', icon: 'settings-outline' },
    { title: 'Métodos de pago', category: 'Pagos', icon: 'card-outline' },
    { title: 'Contactar soporte', category: 'Soporte', icon: 'call-outline' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Centro de Ayuda</Text>
      <View style={styles.helpList}>
        {helpItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.helpCard}>
            <Ionicons name={item.icon} size={24} color="#8CA48F" style={styles.helpIcon} />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>{item.title}</Text>
              <Text style={styles.helpCategory}>{item.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A2B2C2" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 20 },
  helpList: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', shadowColor: '#2D3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  helpCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3EEE9' },
  helpIcon: { marginRight: 15 },
  helpContent: { flex: 1 },
  helpTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 4 },
  helpCategory: { fontSize: 14, color: '#A2B2C2' },
});

export default HelpCenterScreen;