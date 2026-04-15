export interface AvailabilityTimeRange {
  startTime: string;
  endTime: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'client' | 'caregiver' | 'admin';
  phone?: string;
  avatar?: string;
  moderationStatus?: 'active' | 'watchlist' | 'banned';
  moderationReason?: string;
  banReason?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  lastLoginAt?: string;
  reviewRequestStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
  reviewRequestMessage?: string;
  reviewRequestedAt?: string;
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

// types/index.ts ou types.ts

// services/api.ts - adicione/atualize a interface
export interface ReviewWithBooking {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  booking: {
    _id: string;
    serviceType: string;
    serviceName: string;
    startDate: string;
    endDate: string;
    patientName: string;
    contractedBy: {
      _id: string;
      name: string;
      avatar?: string;
    };
  };
}

export interface Review {
  _id: string;
  clientId: User;
  caregiverId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  bookingId: string;
  clientId: User;
  caregiverId: Caregiver | string;
  feedbackDate: string;
  content: string;
  patientMood?: number;
  tookMedication?: boolean;
  medicationDetails?: string;
  ate?: boolean;
  foodDetails?: string;
  hydration?: boolean;
  hygiene?: boolean;
  hygieneDetails?: string;
  sleptWell?: boolean;
  sleepDetails?: string;
  behavior?: 'excelente' | 'bom' | 'normal' | 'agitado' | 'agressivo';
  behaviorDetails?: string;
  painLevel?: number;
  symptoms?: string[];
  healthObservations?: string;
  careActivities?: string[];
  photos?: string[];
  isFinal: boolean;
  dayNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export type PlatformReportReason =
  | 'inappropriate_behavior'
  | 'delay_or_no_show'
  | 'offensive_language'
  | 'fraud_attempt'
  | 'other';

export type PlatformReportSource = 'chat' | 'service';

export interface PlatformReport {
  _id: string;
  bookingId?: Booking | string;
  conversationId?: any;
  reporterId: User;
  reportedUserId: User;
  source: PlatformReportSource;
  reason: PlatformReportReason;
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  autoAction: 'none' | 'watchlist' | 'ban';
  severityScore: number;
  moderationSnapshot?: Record<string, any>;
  adminNotes?: string;
  resolvedAction?: 'none' | 'watchlist' | 'ban' | 'dismiss' | 'unban';
  reviewedBy?: User;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export interface GrowthPoint {
  date: string;
  label: string;
  total: number;
}

export interface AdminLog {
  _id: string;
  actorId?: User;
  actorType: 'admin' | 'system' | 'user';
  action: string;
  targetType: string;
  targetId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AdminDashboardResponse {
  metrics: {
    caregivers: number;
    clients: number;
    admins: number;
    onlineUsers: number;
    banned: number;
    watchlist: number;
    inProgressServices: number;
    completedServices: number;
    recentReportRate: number;
    pendingReports: number;
    pendingReviewRequests: number;
  };
  growth: {
    users: GrowthPoint[];
    services: GrowthPoint[];
    reports: GrowthPoint[];
  };
  topReasons: Array<{
    key: PlatformReportReason | string;
    label: string;
    total: number;
  }>;
  flaggedUsers: User[];
  activeUsers: User[];
  notifications: AdminNotification[];
  logs: AdminLog[];
  refreshWindowSeconds: number;
}

export interface AdminUserListItem extends User {
  isOnlineNow: boolean;
  receivedReports: number;
  pendingReceivedReports: number;
  filedReports: number;
  activeServices: number;
  completedServices: number;
}

export interface AdminUserDetailResponse {
  user: User;
  caregiverProfile?: {
    bio?: string;
    city?: string;
    state?: string;
    experienceYears?: number;
    specialties?: string[];
    rating?: number;
    reviewCount?: number;
    certifications?: string[];
  } | null;
  reportsReceived: PlatformReport[];
  reportsFiled: PlatformReport[];
  bookings: Booking[];
  activity: Array<{
    id: string;
    kind: string;
    timestamp: string;
    title: string;
    description: string;
  }>;
}

export interface AdminReportDetailResponse {
  report: PlatformReport;
  evidence: {
    messages: Array<{
      _id: string;
      content: string;
      createdAt: string;
      senderId: User;
    }>;
    feedbacks: Feedback[];
  };
  previousReports: PlatformReport[];
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
