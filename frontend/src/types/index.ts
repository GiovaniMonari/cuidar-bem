export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'client' | 'caregiver';
  phone?: string;
  avatar?: string;
}

export interface Caregiver {
  _id: string;
  userId: User;
  bio: string;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number;
  city: string;
  state: string;
  availability: string[];
  certifications: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  profileImage?: string;
}

export interface Booking {
  _id: string;
  clientId: User;
  caregiverId: Caregiver;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  totalAmount?: number;
  clientName?: string;
  clientPhone?: string;
  address?: string;
  careType?: string;
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
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];