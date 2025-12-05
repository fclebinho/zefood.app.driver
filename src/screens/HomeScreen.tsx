import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Vibration,
} from 'react-native';
import {
  MapPin,
  Home,
  User,
  Star,
  Navigation,
  Search,
  Moon,
  AlertTriangle,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Delivery } from '../types';
import { useDriverSocket } from '../hooks/useOrdersSocket';
import { useLocationTracking } from '../hooks/useLocationTracking';

export function HomeScreen({ navigation }: any) {
  const { driver, isOnline, toggleOnline } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  // Location tracking - sends driver position when online
  const { location, isTracking, error: locationError } = useLocationTracking({
    driverId: driver?.id || null,
    isOnline,
  });

  // Handle new delivery from WebSocket
  const handleNewAvailableDelivery = useCallback((order: any) => {
    setDeliveries((prev) => {
      // Check if order already exists
      if (prev.some((d) => d.id === order.id)) {
        return prev;
      }
      // Vibrate to alert driver
      Vibration.vibrate([0, 500, 200, 500]);
      // Add new delivery to the beginning
      return [order, ...prev];
    });
  }, []);

  // Handle delivery taken by another driver
  const handleDeliveryTaken = useCallback((orderId: string) => {
    setDeliveries((prev) => prev.filter((d) => d.id !== orderId));
  }, []);

  // Connect to WebSocket when online
  useDriverSocket({
    driverId: isOnline ? driver?.id : undefined,
    onNewAvailableDelivery: handleNewAvailableDelivery,
    onDeliveryTaken: handleDeliveryTaken,
  });

  const fetchDeliveries = useCallback(async () => {
    if (!isOnline) {
      setDeliveries([]);
      return;
    }

    try {
      const response = await api.get('/drivers/deliveries/available');
      setDeliveries(response.data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDeliveries();
    setIsRefreshing(false);
  };

  const handleToggleOnline = async () => {
    setIsTogglingOnline(true);
    try {
      await toggleOnline();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o status');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      await api.post(`/drivers/deliveries/${deliveryId}/accept`);
      navigation.navigate('CurrentDelivery', { deliveryId });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao aceitar entrega';
      Alert.alert('Erro', message);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const renderDeliveryItem = ({ item }: { item: any }) => {
    // Use restaurant address as pickup, deliveryAddress from order
    const pickupAddress = item.restaurant ?
      `${item.restaurant.street}, ${item.restaurant.number}` :
      'Endereço não disponível';

    const deliveryAddr = item.deliveryAddress ?
      `${item.deliveryAddress.street}, ${item.deliveryAddress.number}` :
      'Endereço não disponível';

    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => handleAcceptDelivery(item.id)}
      >
        <View style={styles.deliveryHeader}>
          <Text style={styles.restaurantName}>{item.restaurant?.name || 'Restaurante'}</Text>
          <Text style={styles.deliveryFee}>{formatCurrency(Number(item.deliveryFee || 0))}</Text>
        </View>

        <View style={styles.deliveryInfo}>
          <View style={styles.addressRow}>
            <MapPin size={16} color="#F97316" />
            <Text style={styles.addressLabel}>Retirada:</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {pickupAddress}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Home size={16} color="#16A34A" />
            <Text style={styles.addressLabel}>Entrega:</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {deliveryAddr}
            </Text>
          </View>
        </View>

        {item.customer && (
          <View style={styles.deliveryMeta}>
            <User size={14} color="#666" />
            <Text style={styles.metaText}>
              {item.customer.fullName}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>Aceitar Entrega</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {driver?.fullName?.split(' ')[0] || 'Entregador'}</Text>
          <Text style={styles.subGreeting}>
            {isOnline ? 'Você está online' : 'Você está offline'}
          </Text>
          {isOnline && isTracking && (
            <View style={styles.trackingRow}>
              <Navigation size={12} color="#16A34A" />
              <Text style={styles.trackingIndicator}>GPS ativo</Text>
            </View>
          )}
          {locationError && (
            <View style={styles.trackingRow}>
              <AlertTriangle size={12} color="#DC2626" />
              <Text style={styles.trackingError}>{locationError}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.onlineToggle,
            isOnline ? styles.onlineActive : styles.onlineInactive,
          ]}
          onPress={handleToggleOnline}
          disabled={isTogglingOnline}
        >
          <Text style={styles.onlineToggleText}>
            {isTogglingOnline ? '...' : isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      {driver && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{driver.totalDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statValueRow}>
              <Star size={14} color="#F7A922" fill="#F7A922" />
              <Text style={styles.statValue}>{Number(driver.rating ?? 0).toFixed(1)}</Text>
            </View>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(Number(driver.totalEarnings ?? 0))}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {!isOnline ? (
        <View style={styles.offlineContainer}>
          <Moon size={64} color="#ccc" />
          <Text style={styles.offlineTitle}>Você está offline</Text>
          <Text style={styles.offlineText}>
            Fique online para receber pedidos de entrega
          </Text>
          <TouchableOpacity
            style={styles.goOnlineButton}
            onPress={handleToggleOnline}
            disabled={isTogglingOnline}
          >
            <Text style={styles.goOnlineButtonText}>Ficar Online</Text>
          </TouchableOpacity>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Search size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Aguardando entregas</Text>
          <Text style={styles.emptyText}>
            Novas entregas aparecerão aqui automaticamente
          </Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#F97316']}
              tintColor="#F97316"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trackingIndicator: {
    fontSize: 12,
    color: '#22C55E',
  },
  trackingError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  onlineToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineActive: {
    backgroundColor: '#22C55E',
  },
  onlineInactive: {
    backgroundColor: '#EF4444',
  },
  onlineToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  offlineIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goOnlineButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  goOnlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  deliveryFee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  deliveryInfo: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  addressLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
    width: 75,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  deliveryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginRight: 16,
  },
  acceptButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
