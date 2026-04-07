'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { api } from '@/services/api';
import { Caregiver, SPECIALTIES } from '@/types';
import {
  Heart,
  Shield,
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

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm mb-6">
                <Heart className="w-4 h-4" />
                Cuidado com amor e profissionalismo
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Encontre o{' '}
                <span className="text-accent-300">cuidador ideal</span>{' '}
                para quem você ama
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
                Conectamos famílias a cuidadores qualificados e verificados para
                idosos e pessoas com deficiência. Segurança, confiança e
                cuidado humanizado.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/cuidadores" className="btn-accent !px-8 flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5" />
                  Buscar Cuidadores
                </Link>
                <Link
                  href="/registro?role=caregiver"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                >
                  Sou Cuidador
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:pl-8">
              {[
                { icon: Users, label: 'Cuidadores Cadastrados', value: '500+' },
                { icon: Star, label: 'Avaliação Média', value: '4.8' },
                { icon: CheckCircle2, label: 'Atendimentos', value: '2.000+' },
                { icon: Shield, label: 'Verificados', value: '100%' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
                >
                  <stat.icon className="w-8 h-8 text-accent-300 mb-3" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">
                  {service.desc}
                </p>
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

          {loadingCaregivers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : topCaregivers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum cuidador encontrado</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCaregivers.map((caregiver, index) => {
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

                    <p className="text-gray-600 text-sm mt-4 line-clamp-2">
                      {caregiver.bio}
                    </p>

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

          <div className="text-center mt-10">
            <Link
              href="/cuidadores"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Explorar todos os cuidadores
            </Link>
          </div>
        </div>
      </section>

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
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

            <div className="relative z-10">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <UserAvatar
                      name={user?.name}
                      avatar={user?.avatar}
                      size={48}
                      className="border-2 border-white/20"
                    />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                    Olá, {user?.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                    {user?.role === 'caregiver'
                      ? 'Gerencie seus atendimentos e acompanhe suas avaliações no dashboard.'
                      : 'Continue explorando cuidadores ou acompanhe seus agendamentos.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      href="/dashboard"
                      className="btn-accent !px-8 text-lg flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Ir para Dashboard
                    </Link>
                    {user?.role === 'client' && (
                      <Link
                        href="/cuidadores"
                        className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                      >
                        <Search className="w-5 h-5" />
                        Buscar Cuidadores
                      </Link>
                    )}
                    {user?.role === 'caregiver' && (
                      <Link
                        href="/perfil/cuidador"
                        className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                      >
                        <Users className="w-5 h-5" />
                        Meu Perfil
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}