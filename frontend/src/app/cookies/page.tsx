'use client';

import { Footer } from '@/components/Footer';
import { Cookie, Settings, BarChart3, Shield, ToggleLeft } from 'lucide-react';

const COOKIE_TYPES = [
  {
    icon: Shield,
    name: 'Cookies Essenciais',
    description: 'Necessários para o funcionamento básico da plataforma. Não podem ser desativados.',
    examples: 'Token de autenticação (JWT), preferências de consentimento, sessão do usuário.',
    required: true,
  },
  {
    icon: Settings,
    name: 'Cookies Funcionais',
    description: 'Permitem lembrar suas preferências e personalizar sua experiência.',
    examples: 'Filtros de busca salvos, idioma preferido, configurações de região.',
    required: false,
  },
  {
    icon: BarChart3,
    name: 'Cookies de Desempenho',
    description: 'Nos ajudam a entender como os visitantes interagem com a plataforma.',
    examples: 'Google Analytics, tempo de permanência, páginas mais visitadas.',
    required: false,
  },
  {
    icon: Cookie,
    name: 'Cookies de Marketing',
    description: 'Usados para exibir anúncios relevantes e rastrear campanhas.',
    examples: 'Facebook Pixel, Google Ads, remarketing.',
    required: false,
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <span className="text-primary-200 text-sm font-medium">Documento Legal</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Política de Cookies</h1>
          <p className="text-primary-200">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 lg:p-12 space-y-8">
          <section>
            <p className="text-gray-600 leading-relaxed">
              Esta Política de Cookies explica o que são cookies, como utilizamos e como você pode 
              gerenciar suas preferências. Ao continuar usando a CuidarBem, você concorda com o uso 
              de cookies conforme descrito abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">O que são Cookies?</h2>
            <p className="text-gray-600 leading-relaxed">
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você 
              visita um site. Eles ajudam a lembrar suas preferências, melhorar sua experiência e 
              fornecer informações aos proprietários do site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tipos de Cookies que Usamos</h2>
            <div className="space-y-4">
              {COOKIE_TYPES.map((type, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <type.icon className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    </div>
                    {type.required ? (
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                        Obrigatório
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <ToggleLeft className="w-3 h-3" />
                        Configurável
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{type.description}</p>
                  <p className="text-gray-400 text-xs">
                    <strong>Exemplos:</strong> {type.examples}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Como Gerenciar Cookies</h2>
            <div className="space-y-3 text-gray-600">
              <p>Você pode gerenciar suas preferências de cookies de diferentes formas:</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-primary-50 p-4 rounded-xl text-center">
                  <p className="font-semibold text-primary-700 text-sm mb-1">Banner de Cookies</p>
                  <p className="text-xs text-gray-500">Ao usar a plataforma pela primeira vez</p>
                </div>
                <div className="bg-primary-50 p-4 rounded-xl text-center">
                  <p className="font-semibold text-primary-700 text-sm mb-1">Configurações do Navegador</p>
                  <p className="text-xs text-gray-500">Bloquear ou excluir cookies nas configurações</p>
                </div>
                <div className="bg-primary-50 p-4 rounded-xl text-center">
                  <p className="font-semibold text-primary-700 text-sm mb-1">Fale Conosco</p>
                  <p className="text-xs text-gray-500">privacidade@cuidarbem.com.br</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                ⚠️ Desativar cookies essenciais pode afetar o funcionamento da plataforma, 
                impedindo login e uso de funcionalidades básicas.
              </div>
            </div>
          </section>

          <section className="bg-primary-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Dúvidas sobre cookies?</h2>
            <p className="text-gray-600 text-sm">
              Entre em contato:<br />
              <strong>E-mail:</strong> privacidade@cuidarbem.com.br<br />
              <strong>Telefone:</strong> (11) 3000-0000
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}