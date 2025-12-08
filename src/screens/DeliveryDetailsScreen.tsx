import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Home,
  User,
  Clock,
  Navigation,
  Phone,
} from 'lucide-react-native';
import api from '../services/api';
import { Delivery } from '../types';

export function DeliveryDetailsScreen({ route, navigation }: any) {
  const { delivery } = route.params as { delivery: Delivery };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleAcceptDelivery = async () => {
    try {
      await api.post(`/drivers/deliveries/${delivery.id}/accept`);
      navigation.replace('CurrentDelivery', { deliveryId: delivery.id });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao aceitar entrega';
      Alert.alert('Erro', message);
    }
  };

  const openMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Build pickup address from restaurant data
  const pickupAddress = delivery.restaurant
    ? `${delivery.restaurant.street || ''}, ${delivery.restaurant.number || ''} - ${delivery.restaurant.neighborhood || ''}, ${delivery.restaurant.city || ''}`
    : 'Endereço não disponível';

  // Build delivery address
  const deliveryAddr = delivery.deliveryAddress
    ? `${delivery.deliveryAddress.street || ''}, ${delivery.deliveryAddress.number || ''} - ${delivery.deliveryAddress.neighborhood || ''}, ${delivery.deliveryAddress.city || ''}`
    : 'Endereço não disponível';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Entrega</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Fee Banner */}
        <View style={styles.feeBanner}>
          <Text style={styles.feeLabel}>Valor da entrega</Text>
          <Text style={styles.feeValue}>
            {formatCurrency(Number(delivery.deliveryFee || 0))}
          </Text>
        </View>

        {/* Restaurant Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#F97316" />
            <Text style={styles.sectionTitle}>Retirada</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{delivery.restaurant?.name || 'Restaurante'}</Text>
            <Text style={styles.cardAddress}>{pickupAddress}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openMaps(pickupAddress)}
              >
                <Navigation size={16} color="#F97316" />
                <Text style={styles.actionButtonText}>Navegar</Text>
              </TouchableOpacity>
              {delivery.restaurant?.phone && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => callPhone(delivery.restaurant.phone!)}
                >
                  <Phone size={16} color="#F97316" />
                  <Text style={styles.actionButtonText}>Ligar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Home size={18} color="#16A34A" />
            <Text style={styles.sectionTitle}>Entrega</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.customerRow}>
              <User size={16} color="#666" />
              <Text style={styles.customerName}>{delivery.customer?.fullName || 'Cliente'}</Text>
            </View>
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
                <Navigation size={16} color="#16A34A" />
                <Text style={styles.actionButtonText}>Navegar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Items Section */}
        {delivery.items && delivery.items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color="#666" />
              <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            </View>
            <View style={styles.card}>
              {delivery.items.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.orderItem}>
                  <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                  <Text style={styles.itemName}>{item.menuItem?.name || item.name || 'Item'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes Section */}
        {delivery.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Observações</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{delivery.notes}</Text>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total do pedido</Text>
              <Text style={styles.infoValue}>{formatCurrency(Number(delivery.total || 0))}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pagamento</Text>
              <Text style={styles.infoValue}>{delivery.paymentMethod || 'Não informado'}</Text>
            </View>
          </View>
        </View>

        {/* Spacer for button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Accept Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAcceptDelivery}
        >
          <Text style={styles.acceptButtonText}>Aceitar Entrega</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  feeBanner: {
    backgroundColor: '#22C55E',
    padding: 20,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  feeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
    flex: 1,
  },
  notesCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  acceptButton: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
