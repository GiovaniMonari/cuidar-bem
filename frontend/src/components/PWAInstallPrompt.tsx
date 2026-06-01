'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<BeforeInstallPromptChoice>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'cuidarbem_pwa_install_dismissed';

function isRunningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|chrome|android/.test(userAgent);

  return isIos && isSafari;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });

    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  useEffect(() => {
    const shouldHide =
      localStorage.getItem(DISMISSED_KEY) === 'true' || isRunningStandalone();

    setDismissed(shouldHide);

    if (shouldHide) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    setShowIosTip(isIosSafari());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
    setInstallPrompt(null);
    setShowIosTip(false);
  };

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    dismissPrompt();
  };

  if (dismissed || (!installPrompt && !showIosTip)) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-2xl border border-primary-100 bg-white p-4 shadow-2xl shadow-primary-900/15 md:hidden">
      <p className="text-sm font-bold text-gray-900">Instale o CuidarBem</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">
        {installPrompt
          ? 'Acesse mais rápido pelo ícone na tela inicial do celular.'
          : 'No iPhone, toque em compartilhar e depois em “Adicionar à Tela de Início”.'}
      </p>
      <div className="mt-3 flex gap-2">
        {installPrompt ? (
          <Button className="flex-1 bg-primary-600 hover:bg-primary-700" onClick={installApp}>
            Instalar app
          </Button>
        ) : null}
        <Button
          className={installPrompt ? undefined : 'flex-1'}
          variant="outline"
          onClick={dismissPrompt}
        >
          {installPrompt ? 'Agora não' : 'Entendi'}
        </Button>
      </div>
    </div>
  );
}
