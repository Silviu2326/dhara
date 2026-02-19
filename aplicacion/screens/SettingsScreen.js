import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SettingsScreen = ({ user }) => {
  const settings = [
    'Preferencias de Notificaciones',
    'Configurar Horarios',
    'Métodos de Pago',
    'Privacidad y Seguridad',
    'Ayuda y Soporte'
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Configuración</Text>
      <View style={styles.settingsList}>
        {settings.map((setting, index) => (
          <TouchableOpacity key={index} style={styles.settingItem}>
            <Text style={styles.settingText}>{setting}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3A4A', marginBottom: 20 },
  settingsList: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', shadowColor: '#2D3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3EEE9' },
  settingText: { fontSize: 16, color: '#2D3A4A' },
  settingArrow: { fontSize: 20, color: '#A2B2C2' },
});

export default SettingsScreen;