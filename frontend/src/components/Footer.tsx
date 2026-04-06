import Link from 'next/link';
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  FileText,
  Cookie,
  ChevronRight,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Segurança Banner */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Seus dados estão protegidos
                </h3>
                <p className="text-primary-200 text-sm">
                  Criptografia de ponta a ponta e conformidade com a LGPD
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-primary-200">
                <Lock className="w-4 h-4" />
                Dados criptografados
              </div>
              <div className="flex items-center gap-2 text-primary-200">
                <Shield className="w-4 h-4" />
                Pagamentos seguros
              </div>
              <div className="flex items-center gap-2 text-primary-200">
                <FileText className="w-4 h-4" />
                Conforme a LGPD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre */}
          <div>
            <div className="flex items-center">
              <div>
              <img
                src="/logo_cuidadores_transparente.png" 
                alt="Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
              <span className="text-white font-bold text-lg">CuidarBem</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Conectamos famílias a cuidadores qualificados e verificados. 
              Cuidado com amor, segurança e profissionalismo.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                contato@cuidarbem.com.br
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4" />
                (11) 3000-0000
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                São Paulo, SP - Brasil
              </div>
            </div>
          </div>

          {/* Para Clientes */}
          <div>
            <h4 className="text-white font-semibold mb-4">Para Clientes</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Buscar Cuidadores', href: '/cuidadores' },
                { label: 'Como Funciona', href: '/#como-funciona' },
                { label: 'Cuidado de Idosos', href: '/cuidadores?specialty=cuidado_idosos' },
                { label: 'Cuidado PcD', href: '/cuidadores?specialty=cuidado_deficiencia' },
                { label: 'Enfermagem', href: '/cuidadores?specialty=enfermagem' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Para Cuidadores */}
          <div>
            <h4 className="text-white font-semibold mb-4">Para Cuidadores</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Cadastrar-se', href: '/registro?role=caregiver' },
                { label: 'Meu Perfil', href: '/perfil/cuidador' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Configurar Pagamento', href: '/perfil' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Segurança e Privacidade */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-400" />
              Segurança & Privacidade
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Política de Privacidade', href: '/privacidade', icon: Lock },
                { label: 'Termos de Uso', href: '/termos', icon: FileText },
                { label: 'Política de Cookies', href: '/cookies', icon: Cookie },
                { label: 'Segurança dos Dados', href: '/seguranca', icon: Shield },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                  >
                    <link.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Certificados */}
            <div className="mt-6 flex items-center gap-3">
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                SSL
              </div>
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                LGPD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} CuidarBem. Todos os direitos reservados. CNPJ: 00.000.000/0001-00
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                Feito com amor no Brasil
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}