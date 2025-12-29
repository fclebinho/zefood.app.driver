import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Star,
  Phone,
  CreditCard,
  Bike,
  Car,
  Bell,
  FileText,
  HelpCircle,
  ScrollText,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import packageJson from '../../package.json';

export function ProfileScreen() {
  const { user, driver, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getVehicleIcon = () => {
    const iconProps = { size: 32, color: '#F97316' };
    switch (driver?.vehicleType) {
      case 'MOTORCYCLE':
        return <Bike {...iconProps} />;
      case 'BICYCLE':
        return <Bike {...iconProps} />;
      case 'CAR':
        return <Car {...iconProps} />;
      default:
        return <Bike {...iconProps} />;
    }
  };

  const getVehicleName = () => {
    switch (driver?.vehicleType) {
      case 'MOTORCYCLE':
        return 'Moto';
      case 'BICYCLE':
        return 'Bicicleta';
      case 'CAR':
        return 'Carro';
      default:
        return 'Veículo';
    }
  };

  const getStatusBadge = () => {
    switch (driver?.status) {
      case 'APPROVED':
        return { text: 'Ativo', color: '#22C55E', bg: '#DCFCE7' };
      case 'PENDING':
        return { text: 'Pendente', color: '#F97316', bg: '#FFF3E0' };
      case 'REJECTED':
        return { text: 'Rejeitado', color: '#EF4444', bg: '#FEE2E2' };
      case 'SUSPENDED':
        return { text: 'Suspenso', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { text: 'Desconhecido', color: '#666', bg: '#f5f5f5' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {driver?.fullName?.charAt(0)?.toUpperCase() || 'E'}
          </Text>
        </View>
        <Text style={styles.name}>{driver?.fullName || 'Entregador'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusText, { color: statusBadge.color }]}>
            {statusBadge.text}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statValueRow}>
              <Star size={20} color="#F7A922" fill="#F7A922" />
              <Text style={styles.statValue}>{Number(driver?.rating ?? 0).toFixed(1)}</Text>
            </View>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{driver?.totalDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Phone size={16} color="#666" />
                <Text style={styles.infoLabel}>Telefone</Text>
              </View>
              <Text style={styles.infoValue}>{driver?.phone || '-'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <CreditCard size={16} color="#666" />
                <Text style={styles.infoLabel}>CPF</Text>
              </View>
              <Text style={styles.infoValue}>
                {driver?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veículo</Text>

          <View style={styles.infoCard}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconContainer}>
                {getVehicleIcon()}
              </View>
              <View>
                <Text style={styles.vehicleType}>{getVehicleName()}</Text>
                {driver?.vehiclePlate && (
                  <Text style={styles.vehiclePlate}>{driver.vehiclePlate}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Bell size={20} color="#666" />
              <Text style={styles.menuText}>Notificações</Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}>
              <FileText size={20} color="#666" />
              <Text style={styles.menuText}>Documentos</Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}>
              <HelpCircle size={20} color="#666" />
              <Text style={styles.menuText}>Ajuda</Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}>
              <ScrollText size={20} color="#666" />
              <Text style={styles.menuText}>Termos de Uso</Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ZeFood Driver v{packageJson.version}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#F97316',
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    marginRight: 16,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 48,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 32,
  },
});
