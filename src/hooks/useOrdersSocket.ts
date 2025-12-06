import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../services/api';

interface OrderStatusUpdate {
  orderId: string;
  status: string;
  order: any;
}

interface UseDriverSocketOptions {
  driverId?: string;
  onNewAvailableDelivery?: (order: any) => void;
  onDeliveryTaken?: (orderId: string) => void;
  onOrderStatusUpdate?: (data: OrderStatusUpdate) => void;
}

export function useDriverSocket({
  driverId,
  onNewAvailableDelivery,
  onDeliveryTaken,
  onOrderStatusUpdate,
}: UseDriverSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!driverId) return;

    let socket: Socket | null = null;

    try {
      // Create socket connection using BASE_URL (without /api)
      // Connect to /orders namespace which is where the backend gateway listens
      socket = io(`${BASE_URL}/orders`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('WebSocket connected');
        // Join driver room
        socket?.emit('joinDriver', driverId);
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
      });

      // Listen for new available deliveries
      socket.on('newAvailableDelivery', (data: { order: any }) => {
        console.log('New available delivery:', data.order?.id);
        onNewAvailableDelivery?.(data.order);
      });

      // Listen for delivery taken by another driver
      socket.on('deliveryTaken', (data: { orderId: string }) => {
        console.log('Delivery taken:', data.orderId);
        onDeliveryTaken?.(data.orderId);
      });

      // Listen for order status updates
      socket.on('orderStatusUpdate', (data: OrderStatusUpdate) => {
        console.log('Order status update:', data.orderId, data.status);
        onOrderStatusUpdate?.(data);
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }

    // Cleanup on unmount
    return () => {
      socket?.disconnect();
    };
  }, [driverId, onNewAvailableDelivery, onDeliveryTaken, onOrderStatusUpdate]);

  return {
    socket: socketRef.current,
  };
}
