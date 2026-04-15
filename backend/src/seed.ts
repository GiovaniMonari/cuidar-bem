import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';

const WEEKDAY_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildUpcomingAvailability(
  weekdays: string[],
  startTime = '08:00',
  endTime = '18:00',
  daysAhead = 30,
) {
  const acceptedWeekdays = new Set(
    weekdays
      .map((weekday) => WEEKDAY_MAP[weekday])
      .filter((weekday) => weekday !== undefined),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: daysAhead })
    .map((_, index) => {
      const current = new Date(today);
      current.setDate(today.getDate() + index);
      return current;
    })
    .filter((date) => acceptedWeekdays.has(date.getDay()))
    .map((date) => ({
      date: formatDate(date),
      timeRanges: [{ startTime, endTime }],
      isAvailable: true,
    }));
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get(getModelToken('User'));
  const caregiverModel = app.get(getModelToken('Caregiver'));

  await userModel.deleteMany({});
  await caregiverModel.deleteMany({});

  const password = await bcrypt.hash('123456', 12);

  const caregiverUsers = await userModel.insertMany([
    { name: 'Maria Silva', email: 'maria@email.com', password, role: 'caregiver', phone: '(11) 99999-0001' },
    { name: 'João Santos', email: 'joao@email.com', password, role: 'caregiver', phone: '(11) 99999-0002' },
    { name: 'Ana Oliveira', email: 'ana@email.com', password, role: 'caregiver', phone: '(21) 99999-0003' },
    { name: 'Carlos Lima', email: 'carlos@email.com', password, role: 'caregiver', phone: '(31) 99999-0004' },
    { name: 'Fernanda Costa', email: 'fernanda@email.com', password, role: 'caregiver', phone: '(41) 99999-0005' },
    { name: 'Roberto Almeida', email: 'roberto@email.com', password, role: 'caregiver', phone: '(11) 99999-0006' },
  ]);

  await userModel.create({
    name: 'Cliente Teste',
    email: 'cliente@email.com',
    password,
    role: 'client',
    phone: '(11) 98888-0001',
  });

  await userModel.create({
    name: 'Admin CuidarBem',
    email: 'admin@cuidarbem.com',
    password,
    role: 'admin',
    phone: '(11) 97777-0001',
    moderationStatus: 'active',
    isOnline: false,
  });

  await caregiverModel.insertMany([
    {
      userId: caregiverUsers[0]._id,
      bio: 'Enfermeira com 10 anos de experiência em cuidados geriátricos. Especializada em Alzheimer e demências.',
      specialties: ['cuidado_idosos', 'enfermagem', 'medicacao'],
      experienceYears: 10,
      hourlyRate: 65,
      city: 'São Paulo',
      state: 'SP',
      availabilityCalendar: buildUpcomingAvailability(
        ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
        '08:00',
        '18:00',
      ),
      certifications: ['COREN Ativo', 'Esp. Geriatria'],
      rating: 4.8,
      reviewCount: 24,
      isAvailable: true,
    },
    {
      userId: caregiverUsers[1]._id,
      bio: 'Fisioterapeuta especializado em reabilitação motora e cuidados com pessoas com deficiência física.',
      specialties: ['cuidado_deficiencia', 'fisioterapia', 'mobilidade'],
      experienceYears: 7,
      hourlyRate: 80,
      city: 'São Paulo',
      state: 'SP',
      availabilityCalendar: buildUpcomingAvailability(
        ['segunda', 'quarta', 'sexta'],
        '09:00',
        '17:00',
      ),
      certifications: ['CREFITO Ativo', 'Esp. Neurologia'],
      rating: 4.9,
      reviewCount: 18,
      isAvailable: true,
    },
    {
      userId: caregiverUsers[2]._id,
      bio: 'Cuidadora dedicada com formação em enfermagem. Experiência com idosos acamados e pós-operatório.',
      specialties: ['cuidado_idosos', 'higiene_pessoal', 'medicacao', 'companhia'],
      experienceYears: 5,
      hourlyRate: 50,
      city: 'Rio de Janeiro',
      state: 'RJ',
      availabilityCalendar: buildUpcomingAvailability(
        ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
        '07:00',
        '19:00',
      ),
      certifications: ['Técnica em Enfermagem'],
      rating: 4.7,
      reviewCount: 32,
      isAvailable: true,
    },
    {
      userId: caregiverUsers[3]._id,
      bio: 'Profissional com experiência em cuidados de pessoas com deficiência intelectual e autismo.',
      specialties: ['cuidado_deficiencia', 'companhia', 'mobilidade'],
      experienceYears: 8,
      hourlyRate: 55,
      city: 'Belo Horizonte',
      state: 'MG',
      availabilityCalendar: buildUpcomingAvailability(
        ['segunda', 'terca', 'quinta', 'sexta'],
        '08:00',
        '16:00',
      ),
      certifications: ['Psicologia - CRP Ativo'],
      rating: 4.6,
      reviewCount: 15,
      isAvailable: true,
    },
    {
      userId: caregiverUsers[4]._id,
      bio: 'Enfermeira com especialização em home care e cuidados paliativos. Atendimento humanizado.',
      specialties: ['cuidado_idosos', 'enfermagem', 'medicacao', 'higiene_pessoal'],
      experienceYears: 12,
      hourlyRate: 75,
      city: 'Curitiba',
      state: 'PR',
      availabilityCalendar: buildUpcomingAvailability(
        ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
        '08:00',
        '20:00',
      ),
      certifications: ['COREN Ativo', 'Esp. Cuidados Paliativos'],
      rating: 5.0,
      reviewCount: 41,
      isAvailable: true,
    },
    {
      userId: caregiverUsers[5]._id,
      bio: 'Técnico em enfermagem com experiência em cuidados domiciliares para idosos e acompanhamento hospitalar.',
      specialties: ['cuidado_idosos', 'companhia', 'medicacao'],
      experienceYears: 4,
      hourlyRate: 45,
      city: 'São Paulo',
      state: 'SP',
      availabilityCalendar: buildUpcomingAvailability(
        ['sabado', 'domingo'],
        '09:00',
        '21:00',
      ),
      certifications: ['Técnico em Enfermagem'],
      rating: 4.3,
      reviewCount: 8,
      isAvailable: true,
    },
  ]);

  console.log('✅ Seed executado com sucesso!');
  console.log('Login teste - Cliente: cliente@email.com / 123456');
  console.log('Login teste - Cuidador: maria@email.com / 123456');
  console.log('Login teste - Admin: admin@cuidarbem.com / 123456');
  await app.close();
}

seed();
