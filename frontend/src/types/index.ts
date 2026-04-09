export interface AvailabilityTimeRange {
  startTime: string;
  endTime: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'client' | 'caregiver';
  phone?: string;
  avatar?: string;
}

export interface AvailabilityDate {
  date: string;
  slots?: ('manha' | 'tarde' | 'noite' | 'integral')[];
  timeRanges: AvailabilityTimeRange[];
  isAvailable: boolean;
}

export interface Caregiver {
  _id: string;
  userId: User;
  bio: string;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number;
  servicePrices: CaregiverServicePrice[];
  city: string;
  state: string;
  availabilityCalendar: AvailabilityDate[];
  certifications: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  profileImage?: string;
}

export interface CaregiverServicePrice {
  serviceKey: string;
  pricePerHour: number;
  isAvailable: boolean;
}

export interface ServiceDuration {
  key: string;
  label: string;
  description?: string;
  hours: number;
  multiplier: number;
}

export interface ServiceType {
  _id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  durations: ServiceDuration[];
  basePriceMin: number;
  basePriceMax: number;
  suggestedPrice: number;
  includes: string[];
  requirements: string[];
  isActive: boolean;
  order: number;
}

export interface PriceCalculation {
  service: ServiceType;
  duration: ServiceDuration;
  pricePerHour: number;
  hours: number;
  baseTotal: number;
  discount: number;
  totalAmount: number;
}

export interface Booking {
  _id: string;
  clientId: User;
  caregiverId: Caregiver;
  serviceType: string;
  serviceName?: string;
  durationKey: string;
  durationHours: number;
  durationLabel?: string;
  pricePerHour: number;
  totalAmount: number;
  discount: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  address?: string;
  addressLat?: number;
  addressLon?: number;
  checkInAt?: string;
  checkInLat?: number;
  checkInLon?: number;
  checkInDistanceMeters?: number;
  patientName?: string;
  patientAge?: number;
  patientCondition?: string;
  specialRequirements?: string[];
  createdAt: string;
}

export interface Review {
  _id: string;
  clientId: User;
  caregiverId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const SPECIALTIES: Record<string, string> = {
  cuidado_idosos: 'Cuidado de Idosos',
  cuidado_deficiencia: 'Cuidado PcD',
  fisioterapia: 'Fisioterapia',
  enfermagem: 'Enfermagem',
  companhia: 'Companhia',
  higiene_pessoal: 'Higiene Pessoal',
  medicacao: 'Medicação',
  mobilidade: 'Mobilidade',
};

export const DAYS: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
};

export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];
