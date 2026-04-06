'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Shield } from 'lucide-react';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cuidarbem_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cuidarbem_cookie_consent', 'all');
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cuidarbem_cookie_consent', 'essential');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 relative">
        <button
          onClick={acceptEssential}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="bg-primary-100 p-3 rounded-xl flex-shrink-0">
            <Cookie className="w-6 h-6 text-primary-600" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              Sua privacidade é importante para nós
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e 
              analisar o tráfego. Você pode aceitar todos os cookies ou apenas os essenciais.{' '}
              <Link href="/cookies" className="text-primary-600 font-medium hover:underline">
                Saiba mais sobre nossa política de cookies
              </Link>
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={acceptAll}
                className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                Aceitar todos os cookies
              </button>
              <button
                onClick={acceptEssential}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Apenas essenciais
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}