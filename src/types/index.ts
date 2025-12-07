export interface User {
  id: string;
  email: string;
  role: string;
  driver?: Driver;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  vehicleType: 'MOTORCYCLE' | 'BICYCLE' | 'CAR';
  vehiclePlate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isOnline: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
}

export interface Restaurant {
  id: string;
  name: string;
  phone?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Customer {
  fullName: string;
  phone?: string;
  user?: {
    phone?: string;
  };
}

export interface Delivery {
  id: string;
  orderId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  pickupAddress?: Address;
  deliveryAddress?: Address;
  restaurant: Restaurant;
  customer: Customer;
  items?: any[];
  total?: number;
  paymentMethod?: string;
  notes?: string;
  estimatedDistance?: number;
  estimatedTime?: number;
  deliveryFee?: number;
  createdAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Earnings {
  today: number;
  week: number;
  month: number;
  total: number;
  deliveriesCount: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
}

export interface DeliveryHistory {
  id: string;
  restaurant: string;
  customer: string;
  deliveryFee: number;
  status: string;
  completedAt: string;
}
