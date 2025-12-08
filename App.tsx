import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Home, Package, DollarSign, User } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import {
  LoginScreen,
  HomeScreen,
  CurrentDeliveryScreen,
  DeliveryDetailsScreen,
  HistoryScreen,
  EarningsScreen,
  ProfileScreen,
} from './src/screens';

// Error Boundary to catch crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crashed:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 10 }}>
            App Error
          </Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={{ fontSize: 14, color: '#333' }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? '#F97316' : '#999';
  const size = 24;

  const icons: Record<string, React.ReactNode> = {
    Home: <Home size={size} color={color} />,
    History: <Package size={size} color={color} />,
    Earnings: <DollarSign size={size} color={color} />,
    Profile: <User size={size} color={color} />,
  };

  return (
    <View style={styles.tabIconContainer}>
      {icons[name]}
    </View>
  );
}

function MainTabs() {
  console.log('MainTabs rendering...');
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Histórico' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarLabel: 'Ganhos' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  console.log('AppNavigator rendering...');

  let authData;
  try {
    authData = useAuth();
    console.log('useAuth result:', { isAuthenticated: authData.isAuthenticated, isLoading: authData.isLoading });
  } catch (error) {
    console.error('useAuth error:', error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>Auth Error: {String(error)}</Text>
      </View>
    );
  }

  const { isAuthenticated, isLoading } = authData;

  if (isLoading) {
    console.log('AppNavigator: showing loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  console.log('AppNavigator: rendering navigator, isAuthenticated:', isAuthenticated);

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CurrentDelivery"
            component={CurrentDeliveryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DeliveryDetails"
            component={DeliveryDetailsScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  console.log('App rendering...');

  // Temporary: Test if basic render works - set to true to test
  const [testMode] = React.useState(true);

  if (testMode) {
    // Test 4: Full app with AppNavigator
    return (
      <ErrorBoundary>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
