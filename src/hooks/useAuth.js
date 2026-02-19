import React, { useState, useEffect } from 'react';
import { useAppStore } from '../app/store';
import { authService } from '../services';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, setUser, logout } = useAppStore();

  useEffect(() => {
    // Check for existing token in localStorage or sessionStorage
    let token = localStorage.getItem('dhara-token');
    let userData = localStorage.getItem('dhara-user');
    
    // If not in localStorage, check sessionStorage
    if (!token) {
      token = sessionStorage.getItem('dhara-token');
      userData = sessionStorage.getItem('dhara-user');
    }
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('dhara-token');
        localStorage.removeItem('dhara-user');
        sessionStorage.removeItem('dhara-token');
        sessionStorage.removeItem('dhara-user');
      }
    }
    
    setLoading(false);
  }, [setUser]);

  const login = async (credentials) => {
    try {
      const result = await authService.login({
        email: credentials.email,
        password: credentials.password
      });

      if (result.success) {
        const { accessToken, user } = result;

        // Store token based on rememberMe preference
        if (credentials.rememberMe) {
          localStorage.setItem('dhara-token', accessToken);
          localStorage.setItem('dhara-user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('dhara-token', accessToken);
          sessionStorage.setItem('dhara-user', JSON.stringify(user));
        }

        setUser(user);
        return { success: true };
      } else {
        return { success: false, error: result.message || 'Credenciales no válidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Error de conexión' };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('dhara-token');
    localStorage.removeItem('dhara-user');
    sessionStorage.removeItem('dhara-token');
    sessionStorage.removeItem('dhara-user');
    logout();
  };

  const getToken = () => {
    return localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout: logoutUser,
    getToken,
  };
};