import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User, Driver } from '../types';

interface AuthContextType {
  user: User | null;
  driver: Driver | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Clear auth state (called on 401 errors)
  const clearAuth = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    setUser(null);
    setDriver(null);
    setIsOnline(false);
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (token && storedUser) {
        // Validate token by fetching driver profile
        try {
          const response = await api.get('/drivers/me');
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setDriver(response.data);
          setIsOnline(response.data.isOnline);
        } catch (error: any) {
          // Token is invalid or expired - clear everything
          console.log('Token invalid, clearing auth');
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = response.data;

    if (userData.role !== 'DRIVER') {
      throw new Error('Esta conta não é de entregador');
    }

    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);

    // Fetch driver profile
    try {
      const driverResponse = await api.get('/drivers/me');
      setDriver(driverResponse.data);
      setIsOnline(driverResponse.data.isOnline || false);
    } catch (driverError: any) {
      // Driver profile might not exist yet
      console.log('Driver profile not found, user may need to complete registration');
      setDriver(null);
      setIsOnline(false);
    }
  };

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const toggleOnline = async () => {
    const response = await api.patch('/drivers/status', {
      isOnline: !isOnline,
    });
    setIsOnline(response.data.isOnline);
    setDriver(response.data);
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!isOnline) return;

    try {
      await api.patch('/drivers/location', { latitude, longitude });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        driver,
        isLoading,
        isAuthenticated: !!user,
        isOnline,
        login,
        logout,
        toggleOnline,
        updateLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
