import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { CookieBanner } from '@/components/CookieBanner';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  applicationName: 'CuidarBem',
  title: 'CuidarBem - Encontre Cuidadores de Confiança',
  description:
    'Plataforma para encontrar cuidadores qualificados para idosos e pessoas com deficiência.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CuidarBem',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <PWAInstallPrompt />
          <CookieBanner />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
