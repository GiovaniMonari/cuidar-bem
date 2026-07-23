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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cuidarbem.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'CuidarBem',
  title: {
    default: 'CuidarBem | Encontre cuidadores de confiança',
    template: '%s | CuidarBem',
  },
  description:
    'Plataforma para encontrar cuidadores qualificados, profissionais de enfermagem e apoio para idosos e pessoas com deficiência.',
  keywords: [
    'cuidador para idosos',
    'cuidadores de confiança',
    'enfermagem domiciliar',
    'cuidador para pessoa com deficiência',
    'plataforma de cuidado familiar',
  ],
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    title: 'CuidarBem | Encontre cuidadores de confiança',
    description:
      'Conectamos famílias a cuidadores qualificados para oferecer segurança, acolhimento e qualidade de vida.',
    siteName: 'CuidarBem',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CuidarBem | Encontre cuidadores de confiança',
    description:
      'Plataforma confiável para encontrar cuidadores qualificados para idosos e pessoas com deficiência.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
