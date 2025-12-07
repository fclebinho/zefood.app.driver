import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Navigation, Store, MapPin, Navigation2 } from 'lucide-react-native';

interface Location {
  latitude: number;
  longitude: number;
}

interface DeliveryMapViewProps {
  driverLocation: Location | null;
  restaurantLocation: Location | null;
  customerLocation: Location | null;
  restaurantName?: string;
  customerName?: string;
  deliveryStatus: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | string;
  onNavigatePress?: (destination: 'restaurant' | 'customer') => void;
}

export function DeliveryMapView({
  driverLocation,
  restaurantLocation,
  customerLocation,
  restaurantName = 'Restaurante',
  customerName = 'Cliente',
  deliveryStatus,
  onNavigatePress,
}: DeliveryMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Determine which destination to focus based on status
  const isGoingToRestaurant = deliveryStatus === 'PICKED_UP';
  const currentDestination = isGoingToRestaurant ? restaurantLocation : customerLocation;
  const destinationName = isGoingToRestaurant ? restaurantName : customerName;

  // Calculate region to fit all markers
  const getRegion = (): Region | undefined => {
    const points: Location[] = [];

    if (driverLocation) points.push(driverLocation);
    if (restaurantLocation) points.push(restaurantLocation);
    if (customerLocation) points.push(customerLocation);

    if (points.length === 0) return undefined;

    if (points.length === 1) {
      return {
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padding = 0.002;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + padding, 0.01),
      longitudeDelta: Math.max(maxLng - minLng + padding, 0.01),
    };
  };

  // Fit map to show all markers when data changes
  useEffect(() => {
    if (mapReady && mapRef.current) {
      const points: { latitude: number; longitude: number }[] = [];

      if (driverLocation) points.push(driverLocation);
      if (restaurantLocation) points.push(restaurantLocation);
      if (customerLocation) points.push(customerLocation);

      if (points.length > 1) {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
          animated: true,
        });
      }
    }
  }, [mapReady, driverLocation, restaurantLocation, customerLocation]);

  // Open navigation app
  const openNavigation = (destination: Location, label: string) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'google.navigation:',
    });

    const url = Platform.select({
      ios: `maps:?daddr=${destination.latitude},${destination.longitude}&dirflg=d`,
      android: `google.navigation:q=${destination.latitude},${destination.longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance to current destination
  const getDistanceText = (): string => {
    if (!driverLocation || !currentDestination) return '';
    const distance = calculateDistance(driverLocation, currentDestination);
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // Create route polyline points
  const getRoutePoints = (): Location[] => {
    const points: Location[] = [];

    if (driverLocation) points.push(driverLocation);

    // If going to restaurant, show route: driver -> restaurant
    // If in transit, show route: driver -> customer
    if (isGoingToRestaurant && restaurantLocation) {
      points.push(restaurantLocation);
    } else if (customerLocation) {
      points.push(customerLocation);
    }

    return points;
  };

  const initialRegion = getRegion();

  // If no valid location data, show placeholder
  if (!driverLocation && !restaurantLocation && !customerLocation) {
    return (
      <View style={styles.noLocationContainer}>
        <MapPin size={48} color="#ccc" />
        <Text style={styles.noLocationText}>Aguardando localização...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        onMapReady={() => setMapReady(true)}
      >
        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Você"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Navigation2 size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Restaurant marker */}
        {restaurantLocation && (
          <Marker
            coordinate={restaurantLocation}
            title={restaurantName}
            description="Retirada"
          >
            <View style={[
              styles.destinationMarker,
              { backgroundColor: isGoingToRestaurant ? '#F97316' : '#94a3b8' }
            ]}>
              <Store size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Customer marker */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title={customerName}
            description="Entrega"
          >
            <View style={[
              styles.destinationMarker,
              { backgroundColor: !isGoingToRestaurant ? '#22C55E' : '#94a3b8' }
            ]}>
              <MapPin size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {getRoutePoints().length >= 2 && (
          <Polyline
            coordinates={getRoutePoints()}
            strokeColor={isGoingToRestaurant ? '#F97316' : '#22C55E'}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Navigation info overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isGoingToRestaurant ? '#F97316' : '#22C55E' }
            ]} />
            <View style={styles.infoText}>
              <Text style={styles.destinationLabel}>
                {isGoingToRestaurant ? 'Indo para retirada' : 'Indo para entrega'}
              </Text>
              <Text style={styles.destinationName}>{destinationName}</Text>
            </View>
            {driverLocation && currentDestination && (
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceText}>{getDistanceText()}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Navigation button */}
      {currentDestination && (
        <TouchableOpacity
          style={[
            styles.navigateButton,
            { backgroundColor: isGoingToRestaurant ? '#F97316' : '#22C55E' }
          ]}
          onPress={() => openNavigation(currentDestination, destinationName)}
        >
          <Navigation size={24} color="#fff" />
          <Text style={styles.navigateButtonText}>Navegar</Text>
        </TouchableOpacity>
      )}

      {/* Center on driver button */}
      {driverLocation && (
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            mapRef.current?.animateToRegion({
              ...driverLocation,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }}
        >
          <Navigation2 size={20} color="#333" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noLocationContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  noLocationText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  distanceContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  navigateButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
