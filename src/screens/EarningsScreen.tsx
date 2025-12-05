import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import api from '../services/api';
import { Earnings } from '../types';

export function EarningsScreen() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const response = await api.get('/drivers/earnings');
      // Transform API response to match our Earnings type
      const data = response.data;
      setEarnings({
        today: Number(data.summary?.totalEarnings ?? 0),
        week: Number(data.summary?.totalEarnings ?? 0),
        month: Number(data.summary?.totalEarnings ?? 0),
        total: Number(data.summary?.totalEarnings ?? 0),
        deliveriesCount: {
          today: data.summary?.totalDeliveries ?? 0,
          week: data.summary?.totalDeliveries ?? 0,
          month: data.summary?.totalDeliveries ?? 0,
          total: data.summary?.totalDeliveries ?? 0,
        },
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Set default values on error
      setEarnings({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
        deliveriesCount: { today: 0, week: 0, month: 0, total: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEarnings();
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#F97316']}
          tintColor="#F97316"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Meus Ganhos</Text>
      </View>

      <View style={styles.content}>
        {/* Today */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>Ganhos de Hoje</Text>
          <Text style={styles.mainCardValue}>
            {formatCurrency(earnings?.today || 0)}
          </Text>
          <View style={styles.mainCardMeta}>
            <Text style={styles.metaText}>
              {earnings?.deliveriesCount.today || 0} entregas realizadas
            </Text>
          </View>
        </View>

        {/* Period Cards */}
        <View style={styles.periodCards}>
          <View style={styles.periodCard}>
            <Text style={styles.periodLabel}>Esta Semana</Text>
            <Text style={styles.periodValue}>
              {formatCurrency(earnings?.week || 0)}
            </Text>
            <Text style={styles.periodMeta}>
              {earnings?.deliveriesCount.week || 0} entregas
            </Text>
          </View>

          <View style={styles.periodCard}>
            <Text style={styles.periodLabel}>Este Mês</Text>
            <Text style={styles.periodValue}>
              {formatCurrency(earnings?.month || 0)}
            </Text>
            <Text style={styles.periodMeta}>
              {earnings?.deliveriesCount.month || 0} entregas
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalHeader}>
            <Text style={styles.totalLabel}>Total Acumulado</Text>
            <Text style={styles.totalBadge}>Desde o início</Text>
          </View>
          <Text style={styles.totalValue}>
            {formatCurrency(earnings?.total || 0)}
          </Text>
          <View style={styles.totalMeta}>
            <View style={styles.totalMetaItem}>
              <Text style={styles.totalMetaValue}>
                {earnings?.deliveriesCount.total || 0}
              </Text>
              <Text style={styles.totalMetaLabel}>Entregas</Text>
            </View>
            <View style={styles.totalMetaDivider} />
            <View style={styles.totalMetaItem}>
              <Text style={styles.totalMetaValue}>
                {formatCurrency(
                  (earnings?.total || 0) / Math.max(earnings?.deliveriesCount.total || 1, 1)
                )}
              </Text>
              <Text style={styles.totalMetaLabel}>Média/entrega</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas para ganhar mais</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Fique online durante os horários de pico (11h-14h e 18h-22h)
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Mantenha uma boa avaliação para receber mais pedidos
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Posicione-se em áreas com mais restaurantes
            </Text>
          </View>
        </View>
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
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mainCardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mainCardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 8,
  },
  mainCardMeta: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  periodCards: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  periodValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  periodMeta: {
    fontSize: 12,
    color: '#999',
  },
  totalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  totalBadge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  totalMeta: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  totalMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalMetaDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  totalMetaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  totalMetaLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#F97316',
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
