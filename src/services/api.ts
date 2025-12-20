import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - já inclui /api se necessário
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';
// Base URL para WebSocket (sem /api)
const BASE_URL = API_URL.replace(/\/api$/, '');

// Debug log
console.log('API Configuration:', { BASE_URL, API_URL });

export { BASE_URL, API_URL }; // Export for WebSocket and other hooks

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
