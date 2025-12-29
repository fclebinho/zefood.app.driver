import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import api from '../services/api';

interface EarningsSummary {
  totalEarnings: number;
  totalDeliveries: number;
  totalBonuses: number;
  totalTips: number;
  pendingBalance: number;
  paidOutAmount: number;
  averagePerDelivery: number;
}

interface DailyEarnings {
  date: string;
  earnings: EarningItem[];
  summary: {
    total: number;
    deliveryCount: number;
    averagePerDelivery: number;
  };
}

interface EarningItem {
  id: string;
  amount: number;
  type: 'DELIVERY' | 'BONUS' | 'TIP';
  description: string;
  createdAt: string;
  order?: {
    orderNumber: string;
    restaurant?: {
      name: string;
    };
  };
}

interface EarningsResponse {
  data: EarningItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type TabType = 'today' | 'history' | 'summary';

export function EarningsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [todayEarnings, setTodayEarnings] = useState<DailyEarnings | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, todayRes] = await Promise.all([
        api.get<EarningsSummary>('/driver-finance/summary'),
        api.get<DailyEarnings>('/driver-finance/today'),
      ]);

      setSummary(summaryRes.data);
      setTodayEarnings(todayRes.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Set default values on error
      setSummary({
        totalEarnings: 0,
        totalDeliveries: 0,
        totalBonuses: 0,
        totalTips: 0,
        pendingBalance: 0,
        paidOutAmount: 0,
        averagePerDelivery: 0,
      });
      setTodayEarnings({
        date: new Date().toISOString().split('T')[0],
        earnings: [],
        summary: { total: 0, deliveryCount: 0, averagePerDelivery: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      const response = await api.get<EarningsResponse>(`/driver-finance/earnings?page=${page}&limit=20`);

      if (append) {
        setEarningsHistory(prev => [...prev, ...response.data.data]);
      } else {
        setEarningsHistory(response.data.data);
      }

      setHasMoreHistory(page < response.data.pagination.totalPages);
      setHistoryPage(page);
    } catch (error) {
      console.error('Error fetching earnings history:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'history' && earningsHistory.length === 0) {
      fetchHistory(1);
    }
  }, [activeTab, earningsHistory.length, fetchHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    if (activeTab === 'history') {
      await fetchHistory(1);
    }
    setIsRefreshing(false);
  };

  const loadMoreHistory = () => {
    if (hasMoreHistory && !isLoading) {
      fetchHistory(historyPage + 1, true);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DELIVERY: 'Entrega',
      BONUS: 'Bônus',
      TIP: 'Gorjeta',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DELIVERY: '#22C55E',
      BONUS: '#F97316',
      TIP: '#3B82F6',
    };
    return colors[type] || '#666';
  };

  const renderEarningItem = ({ item }: { item: EarningItem }) => (
    <View style={styles.earningItem}>
      <View style={styles.earningItemLeft}>
        <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
          <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={styles.earningDescription} numberOfLines={1}>
          {item.description}
        </Text>
        {item.order?.restaurant?.name && (
          <Text style={styles.earningRestaurant}>{item.order.restaurant.name}</Text>
        )}
        <Text style={styles.earningTime}>{formatTime(item.createdAt)}</Text>
      </View>
      <Text style={[styles.earningAmount, { color: getTypeColor(item.type) }]}>
        +{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Ganhos</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(summary?.pendingBalance || 0)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.tabActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            Hoje
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Histórico
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Resumo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'today' && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#22C55E']}
              tintColor="#22C55E"
            />
          }
        >
          {/* Today Summary */}
          <View style={styles.todaySummary}>
            <View style={styles.todaySummaryItem}>
              <Text style={styles.todaySummaryValue}>
                {formatCurrency(todayEarnings?.summary.total || 0)}
              </Text>
              <Text style={styles.todaySummaryLabel}>Total</Text>
            </View>
            <View style={styles.todaySummaryDivider} />
            <View style={styles.todaySummaryItem}>
              <Text style={styles.todaySummaryValue}>
                {todayEarnings?.summary.deliveryCount || 0}
              </Text>
              <Text style={styles.todaySummaryLabel}>Entregas</Text>
            </View>
            <View style={styles.todaySummaryDivider} />
            <View style={styles.todaySummaryItem}>
              <Text style={styles.todaySummaryValue}>
                {formatCurrency(todayEarnings?.summary.averagePerDelivery || 0)}
              </Text>
              <Text style={styles.todaySummaryLabel}>Média</Text>
            </View>
          </View>

          {/* Today's Earnings List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ganhos de Hoje</Text>
            {todayEarnings?.earnings && todayEarnings.earnings.length > 0 ? (
              todayEarnings.earnings.map((item) => (
                <View key={item.id} style={styles.earningItem}>
                  <View style={styles.earningItemLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
                      <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
                        {getTypeLabel(item.type)}
                      </Text>
                    </View>
                    <Text style={styles.earningDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                    {item.order?.restaurant?.name && (
                      <Text style={styles.earningRestaurant}>{item.order.restaurant.name}</Text>
                    )}
                    <Text style={styles.earningTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={[styles.earningAmount, { color: getTypeColor(item.type) }]}>
                    +{formatCurrency(item.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nenhum ganho registrado hoje</Text>
                <Text style={styles.emptyStateSubtext}>
                  Fique online para começar a receber entregas!
                </Text>
              </View>
            )}
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
        </ScrollView>
      )}

      {activeTab === 'history' && (
        <FlatList
          data={earningsHistory}
          renderItem={renderEarningItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#22C55E']}
              tintColor="#22C55E"
            />
          }
          onEndReached={loadMoreHistory}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum ganho registrado</Text>
              <Text style={styles.emptyStateSubtext}>
                Seus ganhos aparecerão aqui após completar entregas
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {activeTab === 'summary' && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#22C55E']}
              tintColor="#22C55E"
            />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Total em Entregas</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(summary?.totalEarnings || 0)}
              </Text>
              <Text style={styles.summaryCardMeta}>
                {summary?.totalDeliveries || 0} entregas
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Média por Entrega</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(summary?.averagePerDelivery || 0)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.summaryCardBonus]}>
              <Text style={styles.summaryCardLabel}>Bônus Recebidos</Text>
              <Text style={[styles.summaryCardValue, { color: '#F97316' }]}>
                {formatCurrency(summary?.totalBonuses || 0)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.summaryCardTip]}>
              <Text style={styles.summaryCardLabel}>Gorjetas</Text>
              <Text style={[styles.summaryCardValue, { color: '#3B82F6' }]}>
                {formatCurrency(summary?.totalTips || 0)}
              </Text>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCardFull}>
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceCardTitle}>Saldo</Text>
            </View>
            <View style={styles.balanceCardRow}>
              <Text style={styles.balanceCardRowLabel}>Disponível</Text>
              <Text style={styles.balanceCardRowValue}>
                {formatCurrency(summary?.pendingBalance || 0)}
              </Text>
            </View>
            <View style={styles.balanceCardRow}>
              <Text style={styles.balanceCardRowLabel}>Já retirado</Text>
              <Text style={styles.balanceCardRowValue}>
                {formatCurrency(summary?.paidOutAmount || 0)}
              </Text>
            </View>
            <View style={[styles.balanceCardRow, styles.balanceCardRowTotal]}>
              <Text style={styles.balanceCardRowLabelTotal}>Total Acumulado</Text>
              <Text style={styles.balanceCardRowValueTotal}>
                {formatCurrency((summary?.pendingBalance || 0) + (summary?.paidOutAmount || 0))}
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>ℹ️ Sobre os pagamentos</Text>
            <Text style={styles.infoCardText}>
              O valor das entregas é creditado automaticamente após a confirmação do cliente.
              Bônus e gorjetas são adicionados separadamente ao seu saldo.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#22C55E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#22C55E',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  todaySummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todaySummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  todaySummaryDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  todaySummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  todaySummaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  earningItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  earningDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  earningRestaurant: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  earningTime: {
    fontSize: 12,
    color: '#999',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyList: {
    padding: 16,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  summaryCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  summaryCardBonus: {},
  summaryCardTip: {},
  summaryCardLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  summaryCardMeta: {
    fontSize: 12,
    color: '#999',
  },
  balanceCardFull: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceCardHeader: {
    marginBottom: 16,
  },
  balanceCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  balanceCardRowLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  balanceCardRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  balanceCardRowTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  balanceCardRowLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  balanceCardRowValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
