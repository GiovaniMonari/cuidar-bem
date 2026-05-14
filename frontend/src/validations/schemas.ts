import * as yup from 'yup';

// ==================== LOGIN ====================
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('O email é obrigatório')
    .email('Digite um email válido'),
  password: yup
    .string()
    .required('A senha é obrigatória'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

// ==================== REGISTRO ====================
export const registerSchema = yup.object({
  name: yup
    .string()
    .required('O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: yup
    .string()
    .required('O email é obrigatório')
    .email('Digite um email válido'),
  phone: yup
    .string()
    .optional()
    .test('phone-length', 'Telefone inválido', (value) => {
      if (!value) return true;
      const digits = value.replace(/\D/g, '');
      return digits.length === 0 || digits.length === 10 || digits.length === 11;
    }),
  password: yup
    .string()
    .required('A senha é obrigatória')
    .min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: yup
    .string()
    .required('Confirme sua senha')
    .oneOf([yup.ref('password')], 'As senhas não conferem'),
  role: yup
    .string()
    .required()
    .oneOf(['client', 'caregiver']),
  acceptedTerms: yup
    .boolean()
    .oneOf([true], 'Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.'),
});

export type RegisterFormData = yup.InferType<typeof registerSchema>;

// ==================== RECUPERAR SENHA ====================
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('O email é obrigatório')
    .email('Digite um e-mail válido'),
});

export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

// ==================== REDEFINIR SENHA ====================
export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('A nova senha é obrigatória')
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .test('is-strong', 'Use pelo menos 2 dos seguintes: letras minúsculas, maiúsculas, números ou símbolos', (value) => {
      if (!value) return false;
      const checks = [
        /[a-z]/.test(value),
        /[A-Z]/.test(value),
        /\d/.test(value),
        /[^A-Za-z0-9]/.test(value),
      ].filter(Boolean).length;
      return checks >= 2;
    }),
  confirmPassword: yup
    .string()
    .required('Confirme a nova senha')
    .oneOf([yup.ref('password')], 'As senhas não coincidem'),
});

export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

// ==================== EDITAR PERFIL ====================
export const editProfileSchema = yup.object({
  name: yup
    .string()
    .required('O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  phone: yup
    .string()
    .optional()
    .test('phone-length', 'Telefone inválido', (value) => {
      if (!value) return true;
      const digits = value.replace(/\D/g, '');
      return digits.length === 0 || digits.length === 10 || digits.length === 11;
    }),
});

export type EditProfileFormData = yup.InferType<typeof editProfileSchema>;

// ==================== PERFIL CUIDADOR ====================
export const caregiverProfileSchema = yup.object({
  bio: yup
    .string()
    .required('Descreva sua experiência e abordagem de cuidado')
    .min(20, 'A biografia deve ter pelo menos 20 caracteres'),
  city: yup
    .string()
    .required('Selecione sua cidade'),
  state: yup
    .string()
    .required('O estado é obrigatório'),
  hourlyRate: yup
    .number()
    .required('Informe seu valor por hora')
    .min(1, 'O valor por hora deve ser maior que zero')
    .typeError('Informe um valor numérico'),
  experienceYears: yup
    .number()
    .required('Informe seus anos de experiência')
    .min(0, 'Valor inválido')
    .typeError('Informe um valor numérico'),
  certifications: yup.array().of(yup.string()).optional(),
  isAvailable: yup.boolean().optional(),
  specialties: yup.array().of(yup.string()).optional(),
  servicePrices: yup
    .array()
    .of(
      yup.object({
        serviceKey: yup.string().required(),
        pricePerHour: yup.number().min(0).required(),
        isAvailable: yup.boolean().required(),
      }),
    )
    .test('at-least-one-available', 'Selecione pelo menos um serviço', (val) => {
      return val?.some((item) => item.isAvailable) ?? false;
    }),
  availabilityCalendar: yup.array().of(yup.object()).optional(),
});

export type CaregiverProfileFormData = yup.InferType<typeof caregiverProfileSchema>;

// ==================== AVALIAÇÃO ====================
export const reviewSchema = yup.object({
  rating: yup
    .number()
    .required('Selecione uma nota')
    .min(1, 'A nota mínima é 1')
    .max(5, 'A nota máxima é 5'),
  comment: yup
    .string()
    .optional(),
});

export type ReviewFormData = yup.InferType<typeof reviewSchema>;

// ==================== REPORT USUÁRIO ====================
export const reportUserSchema = yup.object({
  reason: yup
    .string()
    .required('Selecione o motivo da reportagem'),
  description: yup
    .string()
    .when('reason', {
      is: 'other',
      then: (schema) => schema.required('Descreva o motivo para continuar').min(5, 'Descreva melhor o motivo para continuar.'),
      otherwise: (schema) => schema.optional(),
    }),
});

export type ReportUserFormData = yup.InferType<typeof reportUserSchema>;

// ==================== BOOKING (campos de texto - validação parcial) ====================
export const bookingFormSchema = yup.object({
  serviceType: yup.string().required('Selecione o tipo de serviço'),
  durationKey: yup.string().required('Selecione a duração do atendimento'),
  startDate: yup.string().required('Selecione a data de início'),
  endDate: yup.string().optional(),
  startTime: yup.string().optional(),
  endTime: yup.string().optional(),
  notes: yup.string().optional(),
  cep: yup
    .string()
    .required('Informe o CEP')
    .test('cep-valid', 'CEP deve ter 8 dígitos', (value) => {
      if (!value) return false;
      return value.replace(/\D/g, '').length === 8;
    }),
  address: yup.string().required('Informe o endereço'),
  number: yup.string().optional(),
  complement: yup.string().optional(),
  fullAddress: yup.string().optional(),
  lat: yup.string().optional(),
  lon: yup.string().optional(),
  patientName: yup.string().optional(),
  patientAge: yup.string().optional(),
  patientCondition: yup.string().optional(),
});

export type BookingFormData = yup.InferType<typeof bookingFormSchema>;

// ==================== CARE REPORT ====================
export const careReportSchema = yup.object({
  content: yup
    .string()
    .required('Descreva como foi o dia')
    .min(5, 'O relatório deve ter pelo menos 5 caracteres'),
  painLevel: yup.number().min(0).max(10).optional(),
  patientMood: yup.number().min(1).max(5).nullable().optional(),
  healthObservations: yup.string().optional(),
});

export type CareReportFormData = yup.InferType<typeof careReportSchema>;
