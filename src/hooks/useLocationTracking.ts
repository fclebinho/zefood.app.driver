import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';

// Import Location with error handling
let Location: typeof import('expo-location') | null = null;
try {
  Location = require('expo-location');
} catch (e) {
  console.warn('expo-location not available:', e);
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
}

interface UseLocationTrackingProps {
  driverId: string | null;
  activeOrderId?: string | null;
  isOnline: boolean;
}

export function useLocationTracking({
  driverId,
  activeOrderId,
  isOnline,
}: UseLocationTrackingProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<any>(null);

  // Connect to tracking socket
  const connectSocket = useCallback(async () => {
    if (!driverId) return;

    try {
      const token = await AsyncStorage.getItem('@FoodApp:token');

      // Connect to /orders namespace which is where the backend gateway listens
      socketRef.current = io(`${BASE_URL}/orders`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      socketRef.current.on('connect', () => {
        console.log('Tracking socket connected');
        socketRef.current?.emit('driverConnect', driverId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Tracking socket disconnected');
      });

      socketRef.current.on('error', (err: any) => {
        console.error('Tracking socket error:', err);
        setError('Connection error');
      });
    } catch (err) {
      console.error('Failed to connect tracking socket:', err);
      setError('Failed to connect');
    }
  }, [driverId]);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Send location update
  const sendLocationUpdate = useCallback(
    (locationData: LocationData) => {
      if (!socketRef.current?.connected || !driverId) return;

      socketRef.current.emit('updateLocation', {
        driverId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        orderId: activeOrderId,
      });
    },
    [driverId, activeOrderId]
  );

  // Start location tracking
  const startTracking = useCallback(async () => {
    // Check if Location module is available
    if (!Location) {
      console.warn('Location module not available');
      setError('Location not available');
      return false;
    }

    try {
      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setError('Location permission denied');
        return false;
      }

      // Request background permissions for delivery tracking (may fail in Expo Go)
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission not granted');
        }
      } catch (bgError) {
        console.warn('Background location not available (requires development build):', bgError);
      }

      // Get initial location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialLocation: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        speed: currentLocation.coords.speed,
        heading: currentLocation.coords.heading,
      };

      setLocation(initialLocation);
      sendLocationUpdate(initialLocation);

      // Start watching location
      watchIdRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (newLocation) => {
          const locationData: LocationData = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            speed: newLocation.coords.speed,
            heading: newLocation.coords.heading,
          };
          setLocation(locationData);
          sendLocationUpdate(locationData);
        }
      );

      setIsTracking(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to start location tracking:', err);
      setError('Failed to start tracking');
      return false;
    }
  }, [sendLocationUpdate]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      watchIdRef.current.remove();
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Connect/disconnect socket based on online status
  useEffect(() => {
    if (isOnline && driverId) {
      connectSocket();
      startTracking();
    } else {
      stopTracking();
      disconnectSocket();
    }

    return () => {
      stopTracking();
      disconnectSocket();
    };
  }, [isOnline, driverId, connectSocket, disconnectSocket, startTracking, stopTracking]);

  // Update tracking when active order changes
  useEffect(() => {
    if (activeOrderId && location) {
      sendLocationUpdate(location);
    }
  }, [activeOrderId, location, sendLocationUpdate]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}
