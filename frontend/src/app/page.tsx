'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { api } from '@/services/api';
import { Caregiver, SPECIALTIES } from '@/types';
import {
  Heart,
  Search,
  Star,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Accessibility,
  HeartIcon,
  MapPin,
  Award,
  Loader2,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  CalendarCheck,
  TrendingUp,
  UserCheck,
  Bell,
  Sparkles,
  BadgeCheck,
  FileText,
  MessageSquare,
  BookOpen,
  PlusCircle,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';

const SERVICES = [
  {
    icon: HeartIcon,
    title: 'Cuidado de Idosos',
    desc: 'Acompanhamento diário, auxílio em atividades e companhia para idosos.',
    color: 'from-blue-500 to-blue-600',
    specialty: 'cuidado_idosos',
  },
  {
    icon: Accessibility,
    title: 'Cuidado PcD',
    desc: 'Suporte especializado para pessoas com deficiência física ou intelectual.',
    color: 'from-purple-500 to-purple-600',
    specialty: 'cuidado_deficiencia',
  },
  {
    icon: Stethoscope,
    title: 'Enfermagem',
    desc: 'Profissionais de enfermagem para cuidados médicos domiciliares.',
    color: 'from-green-500 to-green-600',
    specialty: 'enfermagem',
  },
  {
    icon: Clock,
    title: 'Acompanhamento',
    desc: 'Companhia e acompanhamento em consultas, passeios e atividades.',
    color: 'from-orange-500 to-orange-600',
    specialty: 'companhia',
  },
];

// ─── Hero: visitante não autenticado ─────────────────────────────────────────
function HeroGuest() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-8">
            O cuidado que quem{' '}
            <br className="hidden sm:block" />
            você ama{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-400">
                merece
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5C50 2.5 150 2.5 198 8.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-accent-400/40"
                />
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 mb-12 max-w-2xl leading-relaxed font-light">
            Conectamos famílias a cuidadores qualificados e verificados.
            Encontre profissionais preparados para oferecer atenção, segurança e
            carinho — com a confiança que você precisa.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link
              href="/cuidadores"
              className="btn-accent !px-10 !py-4 flex items-center gap-3 text-lg font-semibold shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/30 transition-all hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5" />
              Encontrar Cuidador
            </Link>
            <Link
              href="/registro?role=caregiver"
              className="group bg-white/[0.06] backdrop-blur-md text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/[0.12] transition-all border border-white/[0.1] flex items-center gap-3 hover:-translate-y-0.5"
            >
              Quero Cuidar
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <HeroTrustPillars />
        </div>
      </div>

    </section>
  );
}

// ─── Hero: cliente autenticado ────────────────────────────────────────────────
function HeroClient({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const firstName = user.name?.split(' ')[0] ?? 'você';

  return (
    <section className="relative min-h-[75vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                size={56}
                className="rounded-2xl border-2 border-white/20 shadow-xl"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 bg-accent-500/20 border border-accent-400/30 text-accent-300 px-3 py-1 rounded-full text-xs font-semibold mb-1">
                  <Sparkles className="w-3 h-3" />
                  Bem-vindo de volta
                </div>
                <p className="text-white/50 text-sm">Cliente verificado</p>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Olá, {firstName}!{' '}
            </h1>

            <p className="text-white/60 text-lg leading-relaxed mb-8 font-light">
              Pronto para encontrar o cuidado ideal hoje? Explore nossos
              profissionais verificados ou acompanhe seus agendamentos ativos.
            </p>
          </div>

        </div>
      </div>

    </section>
  );
}

// ─── Hero: cuidador autenticado ───────────────────────────────────────────────
function HeroCaregiver({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const firstName = user.name?.split(' ')[0] ?? 'você';

  const stats = [
    { icon: TrendingUp, label: 'Perfil ativo', value: 'Online' },
    { icon: BadgeCheck, label: 'Verificado', value: 'Sim' },
    { icon: Bell, label: 'Notificações por e-mail', value: 'Ativas' },
  ];

  return (
    <section className="relative min-h-[75vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                size={56}
                className="rounded-2xl border-2 border-accent-400/40 shadow-xl"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 bg-accent-500/25 border border-accent-400/40 text-accent-200 px-3 py-1 rounded-full text-xs font-semibold mb-1">
                  <Heart className="w-3 h-3 fill-current" />
                  Cuidador Profissional
                </div>
                <p className="text-white/50 text-sm">Perfil verificado ✓</p>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Pronto para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-400">
                cuidar,
              </span>
              <br />
              {firstName}?
            </h1>

            <p className="text-white/60 text-lg leading-relaxed mb-8 font-light">
              Gerencie seus atendimentos, atualize sua disponibilidade e
              fortaleça sua reputação. Seu trabalho transforma vidas.
            </p>

            <div className="flex items-center gap-4 mb-8">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2"
                >
                  <stat.icon className="w-4 h-4 text-accent-300" />
                  <div>
                    <p className="text-white text-xs font-semibold leading-none">
                      {stat.value}
                    </p>
                    <p className="text-white/40 text-[10px]">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

function HeroTrustPillars() {
  const pillars = [
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Cuidado humanizado',
      desc: 'Profissionais com empatia e preparo',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Flexibilidade total',
      desc: 'Horários que se adaptam à sua rotina',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-0 sm:divide-x sm:divide-white/[0.08] w-full max-w-3xl">
      {pillars.map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center px-6 py-2">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-400/20 flex items-center justify-center text-accent-300 mb-3">
            {item.icon}
          </div>
          <span className="text-white font-semibold text-sm mb-1">{item.title}</span>
          <span className="text-white/40 text-xs leading-relaxed">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Hero dinâmico ────────────────────────────────────────────────────────────
function DynamicHero() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <HeroGuest />;
  if (user.role === 'caregiver') return <HeroCaregiver user={user} />;
  return <HeroClient user={user} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÕES PARA VISITANTES / CLIENTES
// ══════════════════════════════════════════════════════════════════════════════

function ServicesSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Serviços Especializados
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Profissionais qualificados para diferentes necessidades de cuidado
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, i) => (
            <Link
              key={i}
              href={`/cuidadores?specialty=${service.specialty}`}
              className="card-hover p-6 text-center group cursor-pointer"
            >
              <div
                className={`bg-gradient-to-br ${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
              >
                <service.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">{service.desc}</p>
              <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold group-hover:gap-2 transition-all">
                Ver cuidadores
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Outras especialidades disponíveis:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Fisioterapia', key: 'fisioterapia' },
              { label: 'Medicação', key: 'medicacao' },
              { label: 'Higiene Pessoal', key: 'higiene_pessoal' },
              { label: 'Mobilidade', key: 'mobilidade' },
            ].map((item) => (
              <Link
                key={item.key}
                href={`/cuidadores?specialty=${item.key}`}
                className="px-4 py-2 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-full text-sm font-medium text-gray-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TopCaregiversSection({ caregivers, loading }: { caregivers: Caregiver[]; loading: boolean }) {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
              <Award className="w-4 h-4" />
              Destaque
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Cuidadores Melhores Avaliados
            </h2>
            <p className="text-gray-500 text-lg">
              Profissionais com as melhores avaliações dos nossos clientes
            </p>
          </div>
          <Link
            href="/cuidadores"
            className="btn-secondary flex items-center gap-2 self-start md:self-auto"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : caregivers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cuidador encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caregivers.map((caregiver, index) => {
              const caregiverUser = caregiver.userId;
              return (
                <Link
                  key={caregiver._id}
                  href={`/cuidadores/${caregiver._id}`}
                  className="card-hover p-6 relative group"
                >
                  {index < 3 && (
                    <div
                      className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                          : 'bg-gradient-to-br from-amber-600 to-amber-800'
                      }`}
                    >
                      {index + 1}º
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      name={caregiverUser?.name}
                      avatar={caregiverUser?.avatar}
                      size={64}
                      className="rounded-2xl border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {caregiverUser?.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {caregiver.city}, {caregiver.state}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900">
                            {caregiver.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          ({caregiver.reviewCount} avaliações)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mt-4 line-clamp-2">{caregiver.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {caregiver.specialties.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium"
                      >
                        {SPECIALTIES[spec] || spec}
                      </span>
                    ))}
                    {caregiver.specialties.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                        +{caregiver.specialties.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {caregiver.experienceYears} anos
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {caregiver.certifications?.length || 0} cert.
                      </span>
                    </div>
                    <div className="font-bold text-primary-600">
                      R$ {caregiver.hourlyRate}/h
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform scale-x-0 group-hover:scale-x-100 transition-transform rounded-b-2xl" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="pb-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Como Funciona
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Em poucos passos, encontre o cuidador ideal
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Busque',
              desc: 'Pesquise por cuidadores na sua região, filtre por especialidade, experiência e avaliações.',
              icon: Search,
            },
            {
              step: '2',
              title: 'Escolha',
              desc: 'Analise perfis, leia avaliações de outros clientes e escolha o cuidador ideal.',
              icon: Users,
            },
            {
              step: '3',
              title: 'Agende',
              desc: 'Entre em contato, agende o atendimento e tenha tranquilidade no cuidado.',
              icon: CheckCircle2,
            },
          ].map((item, i) => (
            <div key={i} className="text-center relative">
              <div className="bg-primary-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                <item.icon className="w-9 h-9 text-primary-600" />
                <div className="absolute -top-2 -right-2 bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            O que dizem nossos clientes
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Famílias que encontraram o cuidado ideal através da CuidarBem
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Maria Aparecida',
              role: 'Filha de paciente',
              text: 'Encontrei a cuidadora perfeita para minha mãe. Profissional, carinhosa e muito atenciosa. Recomendo demais!',
              rating: 5,
            },
            {
              name: 'Carlos Eduardo',
              role: 'Esposo de paciente',
              text: 'A plataforma facilitou muito a busca. Em menos de uma semana já tínhamos uma profissional qualificada cuidando da minha esposa.',
              rating: 5,
            },
            {
              name: 'Ana Paula',
              role: 'Mãe de PcD',
              text: 'Excelente serviço! O cuidador que encontramos tem experiência com autismo e meu filho se adaptou muito bem.',
              rating: 5,
            },
          ].map((testimonial, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, starIndex) => (
                  <Star key={starIndex} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuestCTASection() {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Pronto para encontrar o cuidador ideal?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Cadastre-se gratuitamente e tenha acesso a centenas de
              profissionais verificados na sua região.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/registro" className="btn-accent !px-8 text-lg">
                Começar Agora
              </Link>
              <Link
                href="/cuidadores"
                className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Ver Cuidadores
              </Link>
            </div>
            <p className="text-white/60 text-sm mt-6">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-white underline hover:text-accent-300">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÕES EXCLUSIVAS PARA CLIENTES LOGADOS
// ══════════════════════════════════════════════════════════════════════════════

function ClientServicesSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
            <Search className="w-4 h-4" />
            Para você
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            O que você precisa hoje?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Encontre profissionais qualificados para cada necessidade
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, i) => (
            <Link
              key={i}
              href={`/cuidadores?specialty=${service.specialty}`}
              className="card-hover p-6 text-center group cursor-pointer"
            >
              <div
                className={`bg-gradient-to-br ${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
              >
                <service.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">{service.desc}</p>
              <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold group-hover:gap-2 transition-all">
                Buscar agora
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientTopCaregiversSection({
  caregivers,
  loading,
}: {
  caregivers: Caregiver[];
  loading: boolean;
}) {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
              <Award className="w-4 h-4" />
              Recomendados para você
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Cuidadores Mais Bem Avaliados
            </h2>
            <p className="text-gray-500 text-lg">
              Profissionais verificados, prontos para atender
            </p>
          </div>
          <Link
            href="/cuidadores"
            className="btn-secondary flex items-center gap-2 self-start md:self-auto"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : caregivers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cuidador encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caregivers.map((caregiver, index) => {
              const caregiverUser = caregiver.userId;
              return (
                <Link
                  key={caregiver._id}
                  href={`/cuidadores/${caregiver._id}`}
                  className="card-hover p-6 relative group"
                >
                  {index < 3 && (
                    <div
                      className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                          : 'bg-gradient-to-br from-amber-600 to-amber-800'
                      }`}
                    >
                      {index + 1}º
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      name={caregiverUser?.name}
                      avatar={caregiverUser?.avatar}
                      size={64}
                      className="rounded-2xl border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {caregiverUser?.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {caregiver.city}, {caregiver.state}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900">
                            {caregiver.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          ({caregiver.reviewCount} avaliações)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mt-4 line-clamp-2">{caregiver.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {caregiver.specialties.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium"
                      >
                        {SPECIALTIES[spec] || spec}
                      </span>
                    ))}
                    {caregiver.specialties.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                        +{caregiver.specialties.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {caregiver.experienceYears} anos
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {caregiver.certifications?.length || 0} cert.
                      </span>
                    </div>
                    <div className="font-bold text-primary-600">
                      R$ {caregiver.hourlyRate}/h
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform scale-x-0 group-hover:scale-x-100 transition-transform rounded-b-2xl" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ClientHowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Como agendar um atendimento
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Simples, rápido e seguro
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Busque e filtre',
              desc: 'Use os filtros de especialidade, localização e avaliação para encontrar o profissional certo.',
              icon: Search,
            },
            {
              step: '2',
              title: 'Analise o perfil',
              desc: 'Leia avaliações reais de outros clientes, veja certificações e experiência do cuidador.',
              icon: Users,
            },
            {
              step: '3',
              title: 'Agende com segurança',
              desc: 'Entre em contato pelo app e agende. Todo histórico fica registrado no seu dashboard.',
              icon: CheckCircle2,
            },
          ].map((item, i) => (
            <div key={i} className="text-center relative">
              <div className="bg-primary-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                <item.icon className="w-9 h-9 text-primary-600" />
                <div className="absolute -top-2 -right-2 bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientCTASection({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <UserAvatar
                name={user?.name}
                avatar={user?.avatar}
                size={48}
                className="border-2 border-white/20"
              />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Continue cuidando de quem você ama
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Acesse seu painel para acompanhar agendamentos, conversar com
              cuidadores e gerenciar tudo em um só lugar.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="btn-accent !px-8 text-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Ir para Dashboard
              </Link>
              <Link
                href="/cuidadores"
                className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Buscar Cuidadores
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÕES EXCLUSIVAS PARA CUIDADORES LOGADOS
// ══════════════════════════════════════════════════════════════════════════════

function CaregiverDashboardSection() {
  const tools = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard',
      desc: 'Veja seus atendimentos, solicitações e métricas de desempenho.',
      color: 'from-primary-500 to-primary-600',
      badge: null,
    },
    {
      href: '/perfil/cuidador',
      icon: UserCheck,
      title: 'Meu Perfil',
      desc: 'Atualize bio, especialidades, fotos e disponibilidade.',
      color: 'from-purple-500 to-purple-600',
      badge: null,
    },
    {
      href: '/perfil/cuidador',
      icon: CalendarCheck,
      title: 'Minha Agenda',
      desc: 'Gerencie seus horários e confirme novos agendamentos.',
      color: 'from-green-500 to-green-600',
      badge: 'Novo',
    },
    {
      href: '/dashboard/avaliacoes',
      icon: Star,
      title: 'Avaliações',
      desc: 'Acompanhe o que os clientes estão dizendo sobre você.',
      color: 'from-yellow-500 to-orange-500',
      badge: null,
    },
    {
      href: '/dashboard',
      icon: Wallet,
      title: 'Meus Ganhos',
      desc: 'Histórico de pagamentos e relatório financeiro.',
      color: 'from-emerald-500 to-teal-600',
      badge: null,
    },
    {
      href: '/chat',
      icon: MessageSquare,
      title: 'Mensagens',
      desc: 'Converse com clientes e responda solicitações.',
      color: 'from-blue-500 to-cyan-600',
      badge: null,
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
            <LayoutDashboard className="w-4 h-4" />
            Área do Cuidador
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Suas Ferramentas
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Tudo que você precisa para gerenciar sua carreira em um só lugar
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <Link
              key={i}
              href={tool.href}
              className="card-hover p-6 group cursor-pointer relative"
            >
              {tool.badge && (
                <span className="absolute top-4 right-4 bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {tool.badge}
                </span>
              )}
              <div
                className={`bg-gradient-to-br ${tool.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <tool.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{tool.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">{tool.desc}</p>
              <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold group-hover:gap-2 transition-all">
                Acessar
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaregiverTipsSection() {
  const tips = [
    {
      icon: FileText,
      title: 'Perfil completo converte mais',
      desc: 'Cuidadores com perfil 100% preenchido recebem até 3x mais contatos. Adicione foto, bio detalhada e certificações.',
      action: { label: 'Completar perfil', href: '/perfil/cuidador' },
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600 bg-blue-100',
    },
    {
      icon: Star,
      title: 'Avaliações constroem confiança',
      desc: 'Peça avaliações após cada atendimento. Uma nota alta te coloca no topo das buscas e atrai novos clientes.',
      action: { label: 'Ver avaliações', href: '/dashboard/avaliacoes' },
      color: 'bg-yellow-50 border-yellow-100',
      iconColor: 'text-yellow-600 bg-yellow-100',
    },
    {
      icon: BookOpen,
      title: 'Atualize suas especialidades',
      desc: 'Quanto mais especialidades cadastradas, mais buscas você aparece. Mantenha suas habilidades sempre atualizadas.',
      action: { label: 'Editar perfil', href: '/perfil/cuidador' },
      color: 'bg-green-50 border-green-100',
      iconColor: 'text-green-600 bg-green-100',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
            <TrendingUp className="w-4 h-4" />
            Dicas para crescer
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Como se destacar na plataforma
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Pequenas ações que fazem grande diferença na sua carreira
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tips.map((tip, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-6 ${tip.color} flex flex-col`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tip.iconColor}`}
              >
                <tip.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{tip.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed flex-1">{tip.desc}</p>
              <Link
                href={tip.action.href}
                className="mt-4 inline-flex items-center gap-1.5 text-primary-600 text-sm font-semibold hover:gap-2.5 transition-all"
              >
                {tip.action.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaregiverStatsSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 lg:p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left max-w-lg">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                A plataforma que trabalha por você
              </h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Milhares de famílias buscam cuidadores todos os dias. Mantenha
                seu perfil atualizado e esteja sempre disponível para novas
                oportunidades.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              {[
                { value: '2.400+', label: 'Famílias cadastradas', icon: Users },
                { value: '98%', label: 'Satisfação dos clientes', icon: Star },
                { value: '150+', label: 'Cuidadores ativos', icon: UserCheck },
                { value: '4.8', label: 'Avaliação média', icon: BarChart3 },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/[0.08] border border-white/[0.1] rounded-2xl p-4 text-center"
                >
                  <stat.icon className="w-5 h-5 text-accent-300 mx-auto mb-2" />
                  <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
            <Link
              href="/dashboard"
              className="btn-accent !px-8 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ir para Dashboard
            </Link>
            <Link
              href="/perfil/cuidador"
              className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Atualizar Perfil
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUTS COMPOSTOS POR TIPO DE USUÁRIO
// ══════════════════════════════════════════════════════════════════════════════

function GuestHome({ caregivers, loading }: { caregivers: Caregiver[]; loading: boolean }) {
  return (
    <>
      <HeroGuest />
      <ServicesSection />
      <TopCaregiversSection caregivers={caregivers} loading={loading} />
      <HowItWorksSection />
      <TestimonialsSection />
      <GuestCTASection />
    </>
  );
}

function ClientHome({
  user,
  caregivers,
  loading,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  caregivers: Caregiver[];
  loading: boolean;
}) {
  return (
    <>
      <HeroClient user={user} />
      <ClientServicesSection />
      <ClientTopCaregiversSection caregivers={caregivers} loading={loading} />
      <ClientHowItWorksSection />
      <ClientCTASection user={user} />
    </>
  );
}

function CaregiverHome({
  user,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
}) {
  return (
    <>
      <HeroCaregiver user={user} />
      <CaregiverDashboardSection />
      <CaregiverTipsSection />
      <CaregiverStatsSection />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [topCaregivers, setTopCaregivers] = useState<Caregiver[]>([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(true);

  useEffect(() => {
    const fetchTopCaregivers = async () => {
      try {
        const response = await api.getCaregivers({ limit: '6', minRating: '4' });
        setTopCaregivers(response.data || []);
      } catch (error) {
        console.error('Erro ao buscar cuidadores:', error);
      } finally {
        setLoadingCaregivers(false);
      }
    };

    fetchTopCaregivers();
  }, []);

  const renderContent = () => {
    if (!isAuthenticated || !user) {
      return <GuestHome caregivers={topCaregivers} loading={loadingCaregivers} />;
    }
    if (user.role === 'caregiver') {
      return <CaregiverHome user={user} />;
    }
    return <ClientHome user={user} caregivers={topCaregivers} loading={loadingCaregivers} />;
  };

  return (
    <div>
      {renderContent()}
      <Footer />
    </div>
  );
}