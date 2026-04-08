'use client';

import { Footer } from '@/components/Footer';
import {
  Shield,
  Lock,
  CreditCard,
  Server,
  Eye,
  Key,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'Criptografia SSL/TLS',
    desc: 'Todas as comunicações entre seu navegador e nossos servidores são criptografadas com certificado SSL/TLS de 256 bits.',
  },
  {
    icon: Key,
    title: 'Autenticação JWT',
    desc: 'Utilizamos JSON Web Tokens com expiração automática para garantir que apenas você acesse sua conta.',
  },
  {
    icon: CreditCard,
    title: 'Pagamentos Seguros',
    desc: 'Dados de pagamento são processados pelo Mercado Pago, certificado PCI-DSS nível 1. Nunca armazenamos dados de cartão.',
  },
  {
    icon: Shield,
    title: 'Mediador de Transação',
    desc: 'Seu pagamento fica retido em escrow até que o serviço seja concluído, garantindo proteção para ambas as partes.',
  },
  {
    icon: Server,
    title: 'Infraestrutura Protegida',
    desc: 'Servidores hospedados em datacenters com certificação SOC 2, firewalls e monitoramento 24/7.',
  },
  {
    icon: Eye,
    title: 'Conformidade LGPD',
    desc: 'Todos os dados pessoais são tratados em conformidade com a Lei Geral de Proteção de Dados.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Segurança & Proteção
          </h1>
          <p className="text-primary-200 max-w-xl mx-auto">
            Sua segurança e a proteção dos seus dados são nossa prioridade máxima
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECURITY_FEATURES.map((feature, i) => (
            <div key={i} className="card p-6">
              <div className="bg-primary-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Fluxo de proteção de pagamento */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Como Protegemos Seu Dinheiro
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                step: '1',
                title: 'Agendamento',
                desc: 'Você agenda o serviço com o cuidador',
                color: 'bg-blue-500',
              },
              {
                step: '2',
                title: 'Pagamento',
                desc: 'Você paga e o valor é retido em escrow',
                color: 'bg-yellow-500',
              },
              {
                step: '3',
                title: 'Serviço',
                desc: 'O cuidador realiza o atendimento',
                color: 'bg-primary-500',
              },
              {
                step: '4',
                title: 'Liberação',
                desc: 'Após conclusão, o valor é liberado',
                color: 'bg-green-500',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div
                  className={`${item.color} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}
                >
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                <p className="text-gray-500 text-xs">{item.desc}</p>
                {i < 3 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 mx-auto mt-3 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Boas práticas */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Dicas para Sua Segurança
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Use senhas fortes e únicas para sua conta',
              'Nunca compartilhe sua senha com terceiros',
              'Verifique sempre o perfil e avaliações do cuidador',
              'Mantenha seus dados de contato atualizados',
              'Não realize pagamentos fora da plataforma',
              'Reporte qualquer comportamento suspeito imediatamente',
              'Ative a verificação em duas etapas quando disponível',
              'Mantenha seu navegador e sistema operacional atualizados',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-center">
          <Shield className="w-10 h-10 text-white mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Encontrou um problema de segurança?
          </h2>
          <p className="text-primary-200 mb-4">
            Nossa equipe de segurança está disponível para ajudar.
          </p>
          <a
            href="mailto:seguranca@cuidarbem.com.br"
            className="btn-accent inline-flex items-center gap-2"
          >
            Reportar Problema
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
