'use client';

import { Footer } from '@/components/Footer';
import { Shield, Lock, Eye, Database, Users, Bell } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-primary-200 text-sm font-medium">
              Documento Legal
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Política de Privacidade
          </h1>
          <p className="text-primary-200">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 lg:p-12 space-y-8">
          {/* Introdução */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              A <strong>CuidarBem</strong> ("nós", "nosso" ou "plataforma") está comprometida com a 
              proteção da privacidade e dos dados pessoais de seus usuários. Esta Política de 
              Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações, 
              em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
            </p>
          </section>

          {/* Seções */}
          {[
            {
              icon: Database,
              title: '1. Dados que Coletamos',
              content: (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CPF, endereço.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span><strong>Dados profissionais:</strong> especialidades, certificações, experiência (para cuidadores).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span><strong>Dados de agendamento:</strong> datas, endereços de atendimento, observações.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span><strong>Dados de pagamento:</strong> processados pelo Mercado Pago (não armazenamos dados de cartão).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span><strong>Dados de uso:</strong> endereço IP, tipo de navegador, páginas visitadas.</span>
                  </li>
                </ul>
              ),
            },
            {
              icon: Eye,
              title: '2. Como Usamos Seus Dados',
              content: (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Prestar e melhorar nossos serviços de conexão entre clientes e cuidadores.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Processar agendamentos e pagamentos de forma segura.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Enviar notificações sobre agendamentos, pagamentos e atualizações.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Garantir a segurança da plataforma e prevenir fraudes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Cumprir obrigações legais e regulatórias.</span>
                  </li>
                </ul>
              ),
            },
            {
              icon: Lock,
              title: '3. Como Protegemos Seus Dados',
              content: (
                <div className="space-y-3 text-gray-600">
                  <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      'Criptografia SSL/TLS em todas as comunicações',
                      'Tokens JWT para autenticação segura',
                      'Senhas criptografadas com bcrypt (hash unidirecional)',
                      'Dados de pagamento processados pelo Mercado Pago (nível PCI-DSS)',
                      'Acesso restrito a dados pessoais (need-to-know)',
                      'Backups criptografados e monitoramento 24/7',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-green-50 p-3 rounded-lg text-sm">
                        <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-green-800">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              icon: Users,
              title: '4. Compartilhamento de Dados',
              content: (
                <div className="text-gray-600 space-y-3">
                  <p>Não vendemos seus dados pessoais. Compartilhamos informações apenas com:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span><strong>Cuidadores/Clientes:</strong> dados necessários para o agendamento (nome, telefone, endereço do atendimento).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span><strong>Mercado Pago:</strong> dados para processamento de pagamentos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span><strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial.</span>
                    </li>
                  </ul>
                </div>
              ),
            },
            {
              icon: Database,
              title: '5. Retenção de Dados',
              content: (
                <p className="text-gray-600">
                  Mantemos seus dados pelo tempo necessário para prestar nossos serviços ou conforme 
                  exigido por lei. Você pode solicitar a exclusão da sua conta a qualquer momento, 
                  sujeito a obrigações legais de retenção (como dados fiscais e contratuais, mantidos 
                  por até 5 anos).
                </p>
              ),
            },
            {
              icon: Shield,
              title: '6. Dados Sensíveis (Saúde)',
              content: (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-gray-700">
                  <p className="font-semibold text-yellow-800 mb-2">⚠️ Atenção para dados de saúde</p>
                  <p className="text-sm">
                    Alguns dados fornecidos (como tipo de cuidado necessário) podem ser considerados 
                    dados sensíveis pela LGPD. Ao utilizá-los, coletamos apenas o mínimo necessário 
                    para conectar você ao cuidador adequado, com seu consentimento explícito.
                  </p>
                </div>
              ),
            },
            {
              icon: Bell,
              title: '7. Seus Direitos (LGPD)',
              content: (
                <div className="text-gray-600 space-y-3">
                  <p>Como titular dos dados, você tem direito a:</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      'Confirmar a existência de tratamento de dados',
                      'Acessar seus dados pessoais',
                      'Corrigir dados incompletos ou desatualizados',
                      'Solicitar a anonimização ou eliminação de dados',
                      'Revogar consentimento a qualquer momento',
                      'Solicitar a portabilidade dos dados',
                      'Opôr-se ao tratamento de dados',
                      'Ser informado sobre compartilhamento',
                    ].map((right, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full flex-shrink-0" />
                        {right}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-3">
                    Para exercer seus direitos, entre em contato pelo e-mail:{' '}
                    <strong>privacidade@cuidarbem.com.br</strong>
                  </p>
                </div>
              ),
            },
          ].map((section, i) => (
            <section key={i}>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                <section.icon className="w-5 h-5 text-primary-600" />
                {section.title}
              </h2>
              {section.content}
            </section>
          ))}

          {/* Contato */}
          <section className="bg-primary-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Dúvidas sobre privacidade?
            </h2>
            <p className="text-gray-600 text-sm">
              Entre em contato com nosso Encarregado de Proteção de Dados (DPO):<br />
              <strong>E-mail:</strong> privacidade@cuidarbem.com.br<br />
              <strong>Telefone:</strong> (11) 3000-0000<br />
              <strong>Endereço:</strong> Av. Paulista, 1000 - São Paulo/SP - CEP 01310-100
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}