import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MOCK_USER } from './services/mockData';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('email@ejemplo.com');
  const [password, setPassword] = useState('cliente123');
  const [loading, setLoading] = useState(false);

  // Configuration
  // const API_BASE_URL = 'http://localhost:5000/api'; // Backend connection removed

  const handleLogin = async () => {
    console.log('Login attempt:', { email, password });

    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting login process...');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Network delay finished');

      // Mock login success
      console.log('Mock login successful!');

      // Store token in AsyncStorage for persistence (mock token)
      try {
        await AsyncStorage.setItem('clientToken', 'mock-token-12345');
        console.log('Token stored in AsyncStorage');
      } catch (storageError) {
        console.error('AsyncStorage error:', storageError);
        // Continue even if storage fails, just warn
      }

      const user = {
        id: MOCK_USER._id,
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        role: 'Cliente',
        token: 'mock-token-12345',
        therapistId: MOCK_USER.therapistId,
        phone: MOCK_USER.phone,
        status: MOCK_USER.status,
      };

      if (onLogin) {
        onLogin(user);
      } else {
        Alert.alert('Error', 'Función onLogin no disponible');
      }

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Recuperar Contraseña', 'Función de recuperación de contraseña');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('./assets/WhatsApp_Image_2025-10-28_at_13.29.29-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Te damos la bienvenida</Text>
        <Text style={styles.subtitle}>Accede a tu portal de terapias naturales</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#A2B2C2"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#A2B2C2"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={handleForgotPassword}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>Crear nueva cuenta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EEE9',
    justifyContent: 'center',
    padding: 20,
  },
  loginContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#2D3A4A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3A4A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A2B2C2',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A4A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3EEE9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2D3A4A',
    borderWidth: 1,
    borderColor: '#A2B2C2',
  },
  loginButton: {
    backgroundColor: '#8CA48F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8CA48F',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    backgroundColor: '#A2B2C2',
    shadowOpacity: 0,
    elevation: 0,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#C9A2A6',
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#A2B2C2',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#A2B2C2',
    fontSize: 16,
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#D58E6E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#D58E6E',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;