import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use o IP da máquina para o celular conseguir conectar
const BASE_URL = 'http://192.168.200.104:3001';
const API_URL = `${BASE_URL}/api`;

export { BASE_URL as API_URL }; // Export for WebSocket

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
