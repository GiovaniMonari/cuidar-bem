'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Heart,
  Menu,
  X,
  User,
  Calendar,
  LogOut,
  Search,
} from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600 p-2 rounded-xl group-hover:bg-primary-700 transition-colors">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              CuidarBem
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/cuidadores"
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
              Buscar Cuidadores
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <Link
                    href="/perfil"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-sm">{user?.name?.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Entrar
                </Link>
                <Link href="/registro" className="btn-primary !py-2 !px-4 text-sm">
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link
            href="/cuidadores"
            className="block py-2 text-gray-600 hover:text-primary-600 font-medium"
            onClick={() => setMobileOpen(false)}
          >
            Buscar Cuidadores
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="block py-2 text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/perfil"
                className="block py-2 text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Meu Perfil
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="block py-2 text-red-500 font-medium"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block py-2 text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="block py-2 text-primary-600 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}