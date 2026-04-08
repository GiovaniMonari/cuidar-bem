'use client';

import { Footer } from '@/components/Footer';
import { FileText, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-primary-200 text-sm font-medium">Documento Legal</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Termos de Uso</h1>
          <p className="text-primary-200">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 lg:p-12 space-y-8">
          <section>
            <p className="text-gray-600 leading-relaxed">
              Bem-vindo à <strong>CuidarBem</strong>. Ao acessar e utilizar nossa plataforma, 
              você concorda com estes Termos de Uso. Leia-os atentamente antes de utilizar nossos serviços.
            </p>
          </section>

          {[
            {
              title: '1. Descrição do Serviço',
              content: (
                <p className="text-gray-600">
                  A CuidarBem é uma plataforma digital que conecta clientes que necessitam de 
                  cuidados domiciliares (idosos, PcD, pós-operatório) a cuidadores e profissionais 
                  de saúde autônomos. A plataforma atua como intermediária, facilitando a busca, 
                  agendamento e pagamento seguro entre as partes.
                </p>
              ),
            },
            {
              title: '2. Cadastro e Conta',
              content: (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>É necessário ter 18 anos ou mais para criar uma conta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Você é responsável por fornecer informações verdadeiras e manter seus dados atualizados.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>É de sua responsabilidade manter a confidencialidade de sua senha.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Cada pessoa deve ter apenas uma conta, com seu tipo de perfil (cliente ou cuidador) claramente definido.</span>
                  </li>
                </ul>
              ),
            },
            {
              title: '3. Responsabilidades do Cuidador',
              content: (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Manter suas certificações e informações profissionais atualizadas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Prestar o serviço com diligência, ética e profissionalismo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Respeitar a privacidade e dignidade do cliente e de sua família.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Comunicar imediatamente qualquer incidente ou situação de risco.</span>
                  </li>
                </ul>
              ),
            },
            {
              title: '4. Responsabilidades do Cliente',
              content: (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Fornecer informações precisas sobre as necessidades do paciente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Garantir um ambiente seguro para a prestação do serviço.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Realizar o pagamento pontualmente pelos serviços contratados.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Tratar o cuidador com respeito e dignidade.</span>
                  </li>
                </ul>
              ),
            },
            {
              title: '5. Pagamentos e Mediador de Transação',
              content: (
                <div className="space-y-3 text-gray-600">
                  <p>
                    Os pagamentos são processados através do <strong>Mercado Pago</strong>. 
                    A CuidarBem atua como mediador de transação:
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                      <span>O cliente realiza o pagamento após a confirmação do agendamento.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                      <span>O valor fica retido na plataforma (escrow) até a conclusão do serviço.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                      <span>Após a conclusão, o valor é liberado ao cuidador, descontada a taxa da plataforma.</span>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>Taxa da plataforma:</strong> 10% sobre o valor do serviço, deduzida do valor repassado ao cuidador.
                  </p>
                  <p className="text-sm">
                    <strong>Cancelamentos:</strong> Em caso de cancelamento, o valor integral será devolvido ao cliente.
                  </p>
                </div>
              ),
            },
            {
              title: '6. Cancelamento e Reembolso',
              content: (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Cancelamentos antes da confirmação: sem cobrança.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Cancelamentos após pagamento: reembolso integral em até 5 dias úteis, quando aplicável.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Cancelamentos após o início do serviço: reembolso proporcional avaliado caso a caso.</span>
                  </li>
                </ul>
              ),
            },
            {
              title: '7. Limitação de Responsabilidade',
              icon: AlertTriangle,
              content: (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-gray-700 space-y-2">
                  <p className="font-semibold text-yellow-800">⚠️ Importante</p>
                  <p className="text-sm">
                    A CuidarBem atua como plataforma de conexão e mediadora de pagamentos. 
                    <strong> Não é empregadora</strong> dos cuidadores e não se responsabiliza por:
                  </p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Atos ou omissões dos cuidadores durante o atendimento;</li>
                    <li>• Acidentes ou incidentes ocorridos durante a prestação do serviço;</li>
                    <li>• Qualquer dano direto, indireto ou consequencial decorrente do uso da plataforma.</li>
                  </ul>
                </div>
              ),
            },
            {
              title: '8. Modificações nos Termos',
              content: (
                <p className="text-gray-600">
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. 
                  As alterações serão comunicadas por e-mail ou notificação na plataforma. 
                  O uso continuado após a notificação constitui aceitação dos novos termos.
                </p>
              ),
            },
          ].map((section, i) => (
            <section key={i}>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                {section.icon ? (
                  <section.icon className="w-5 h-5 text-primary-600" />
                ) : (
                  <FileText className="w-5 h-5 text-primary-600" />
                )}
                {section.title}
              </h2>
              {section.content}
            </section>
          ))}

          <section className="bg-primary-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Dúvidas?</h2>
            <p className="text-gray-600 text-sm">
              Entre em contato conosco:<br />
              <strong>E-mail:</strong> legal@cuidarbem.com.br<br />
              <strong>Telefone:</strong> (11) 3000-0000
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
