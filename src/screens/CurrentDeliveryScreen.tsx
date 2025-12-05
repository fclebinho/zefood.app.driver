import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { Delivery } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLocationTracking } from '../hooks/useLocationTracking';

export function CurrentDeliveryScreen({ route, navigation }: any) {
  const { deliveryId } = route.params;
  const { driver } = useAuth();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Track location during active delivery
  const { location, isTracking } = useLocationTracking({
    driverId: driver?.id || null,
    activeOrderId: delivery?.id,
    isOnline: true,
  });

  useEffect(() => {
    fetchDelivery();
  }, [deliveryId]);

  const fetchDelivery = async () => {
    try {
      const response = await api.get('/drivers/deliveries/current');
      setDelivery(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da entrega');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!delivery?.id) return;
    setIsUpdating(true);
    try {
      const response = await api.patch(`/orders/${delivery.id}/status`, {
        status: newStatus,
      });
      setDelivery(response.data);

      if (newStatus === 'DELIVERED') {
        Alert.alert('Sucesso', 'Entrega concluída!', [
          { text: 'OK', onPress: () => navigation.navigate('Main') },
        ]);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao atualizar status';
      Alert.alert('Erro', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelDelivery = () => {
    if (!delivery?.id) return;
    Alert.alert(
      'Cancelar Entrega',
      'Tem certeza que deseja cancelar esta entrega?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await api.patch(`/orders/${delivery.id}/status`, {
                status: 'CANCELLED',
              });
              navigation.navigate('Main');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar a entrega');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const openMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusInfo = () => {
    switch (delivery?.status) {
      case 'PICKED_UP':
        return {
          title: 'Entregue ao cliente',
          subtitle: 'Leve o pedido até o endereço de entrega',
          nextAction: 'Iniciar Entrega',
          nextStatus: 'IN_TRANSIT',
          color: '#F97316',
        };
      case 'IN_TRANSIT':
        return {
          title: 'Em trânsito',
          subtitle: 'Entregue o pedido ao cliente',
          nextAction: 'Confirmar Entrega',
          nextStatus: 'DELIVERED',
          color: '#22C55E',
        };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!delivery) {
    return null;
  }

  const statusInfo = getStatusInfo();

  // Build pickup address from restaurant data
  const pickupAddress = delivery.restaurant
    ? `${delivery.restaurant.street || ''}, ${delivery.restaurant.number || ''} - ${delivery.restaurant.neighborhood || ''}, ${delivery.restaurant.city || ''}`
    : 'Endereço não disponível';

  // Build delivery address from deliveryAddress JSON field
  const deliveryAddr = delivery.deliveryAddress
    ? `${delivery.deliveryAddress.street || ''}, ${delivery.deliveryAddress.number || ''} - ${delivery.deliveryAddress.neighborhood || ''}, ${delivery.deliveryAddress.city || ''}`
    : 'Endereço não disponível';

  return (
    <ScrollView style={styles.container}>
      {statusInfo && (
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurante</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{delivery.restaurant?.name || 'Restaurante'}</Text>
          <Text style={styles.cardAddress}>{pickupAddress}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openMaps(pickupAddress)}
            >
              <Text style={styles.actionButtonText}>📍 Abrir Mapa</Text>
            </TouchableOpacity>
            {delivery.restaurant?.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => callPhone(delivery.restaurant.phone!)}
              >
                <Text style={styles.actionButtonText}>📞 Ligar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{delivery.customer?.fullName || 'Cliente'}</Text>
          <Text style={styles.cardAddress}>{deliveryAddr}</Text>
          {delivery.deliveryAddress?.complement && (
            <Text style={styles.complement}>
              Complemento: {delivery.deliveryAddress.complement}
            </Text>
          )}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openMaps(deliveryAddr)}
            >
              <Text style={styles.actionButtonText}>📍 Abrir Mapa</Text>
            </TouchableOpacity>
            {delivery.customer?.user?.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => callPhone(delivery.customer.user.phone!)}
              >
                <Text style={styles.actionButtonText}>📞 Ligar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes do Pedido</Text>
        <View style={styles.card}>
          <View style={styles.orderItems}>
            {(delivery.items || []).map((item: any) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.menuItem?.name || 'Item'}</Text>
              </View>
            ))}
          </View>
          {delivery.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Observações:</Text>
              <Text style={styles.notesText}>{delivery.notes}</Text>
            </View>
          )}
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Pagamento:</Text>
            <Text style={styles.paymentMethod}>{delivery.paymentMethod || 'Não informado'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Valores</Text>
        <View style={styles.card}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Total do pedido</Text>
            <Text style={styles.valueText}>{formatCurrency(Number(delivery.total || 0))}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabelHighlight}>Sua comissão</Text>
            <Text style={styles.valueHighlight}>{formatCurrency(Number(delivery.deliveryFee || 0))}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {statusInfo && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: statusInfo.color }]}
            onPress={() => handleUpdateStatus(statusInfo.nextStatus)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{statusInfo.nextAction}</Text>
            )}
          </TouchableOpacity>
        )}
        {delivery.status === 'PICKED_UP' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelDelivery}
            disabled={isUpdating}
          >
            <Text style={styles.cancelButtonText}>Cancelar Entrega</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  statusBanner: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  complement: {
    fontSize: 14,
    color: '#F97316',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F97316',
    marginRight: 8,
    width: 30,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
  },
  notes: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 14,
    color: '#666',
  },
  valueText: {
    fontSize: 14,
    color: '#333',
  },
  valueLabelHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  valueHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});
