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
    { name: 'Cuidador Demo 1', email: 'demo.cuidador1@cuidarbem.com', password, role: 'caregiver', phone: '(11) 90000-0001' },
    { name: 'Cuidador Demo 2', email: 'demo.cuidador2@cuidarbem.com', password, role: 'caregiver', phone: '(11) 90000-0002' },
    { name: 'Cuidador Demo 3', email: 'demo.cuidador3@cuidarbem.com', password, role: 'caregiver', phone: '(21) 90000-0003' },
    { name: 'Cuidador Demo 4', email: 'demo.cuidador4@cuidarbem.com', password, role: 'caregiver', phone: '(31) 90000-0004' },
    { name: 'Cuidador Demo 5', email: 'demo.cuidador5@cuidarbem.com', password, role: 'caregiver', phone: '(41) 90000-0005' },
    { name: 'Cuidador Demo 6', email: 'demo.cuidador6@cuidarbem.com', password, role: 'caregiver', phone: '(11) 90000-0006' },
  ]);

  await userModel.create({
    name: 'Cliente Demo',
    email: 'demo.cliente@cuidarbem.com',
    password,
    role: 'client',
    phone: '(11) 90000-0007',
  });

  await userModel.create({
    name: 'Administrador Demo',
    email: 'admin@cuidarbem.com',
    password,
    role: 'admin',
    phone: '(11) 90000-0008',
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
      rating: 0,
      reviewCount: 0,
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
      rating: 0,
      reviewCount: 0,
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
      rating: 0,
      reviewCount: 0,
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
      rating: 0,
      reviewCount: 0,
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
      rating: 0,
      reviewCount: 0,
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
      rating: 0,
      reviewCount: 0,
      isAvailable: true,
    },
  ]);

  console.log('✅ Seed executado com sucesso!');
  console.log('Login teste - Cliente: demo.cliente@cuidarbem.com / 123456');
  console.log('Login teste - Cuidador: demo.cuidador1@cuidarbem.com / 123456');
  console.log('Login teste - Admin: admin@cuidarbem.com / 123456');
  await app.close();
}

seed();
