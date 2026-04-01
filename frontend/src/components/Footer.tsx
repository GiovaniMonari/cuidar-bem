import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div>
                <img 
                  src="/logo_cuidadores_transparente.png" 
                  alt="Logo" 
                  className="w-20 h-20 object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-xl font-bold text-white">CuidarBem</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              Conectamos famílias a cuidadores qualificados e de confiança para
              idosos e pessoas com deficiência. Cuidado humanizado na sua casa.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/cuidadores" className="hover:text-white transition-colors">Buscar Cuidadores</a></li>
              <li><a href="/registro" className="hover:text-white transition-colors">Cadastrar-se</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Como Funciona</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>contato@cuidarbem.com.br</li>
              <li>(11) 99999-0000</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          © 2024 CuidarBem. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}