'use client';

import Link from 'next/link';
import { Footer } from '@/components/Footer';
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
  Phone,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
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

            {/* Stats Cards */}
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

      {/* Services */}
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
            {[
              {
                icon: HeartIcon,
                title: 'Cuidado de Idosos',
                desc: 'Acompanhamento diário, auxílio em atividades e companhia para idosos.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Accessibility,
                title: 'Cuidado PcD',
                desc: 'Suporte especializado para pessoas com deficiência física ou intelectual.',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: Stethoscope,
                title: 'Enfermagem',
                desc: 'Profissionais de enfermagem para cuidados médicos domiciliares.',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: Clock,
                title: 'Acompanhamento',
                desc: 'Companhia e acompanhamento em consultas, passeios e atividades.',
                color: 'from-orange-500 to-orange-600',
              },
            ].map((service, i) => (
              <div key={i} className="card-hover p-6 text-center group">
                <div
                  className={`bg-gradient-to-br ${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                >
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
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

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
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
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}