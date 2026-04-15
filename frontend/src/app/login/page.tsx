'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Heart, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [banReason, setBanReason] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanReason('');
    setReviewStatus('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      router.push(loggedUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      if (err.code === 'ACCOUNT_BANNED') {
        setBanReason(err.banReason || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    setReviewStatus('');
    try {
      const response = await api.requestBanReview(email, reviewMessage);
      setReviewStatus(response.message);
    } catch (err: any) {
      setReviewStatus(err.message || 'Não foi possível solicitar revisão.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <div className="flex items-center justify-center mb-1">
              <img 
                src="/logo_cuidadores_transparente.png" 
                alt="Logo CuidarBem" 
                className="w-32 h-32 object-contain hover:scale-105 transition-transform"
              />
            </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="text-gray-500 mt-1">Entre na sua conta CuidarBem</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {banReason && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Conta bloqueada</p>
              <p className="mt-1 text-sm text-amber-800">
                Motivo informado: {banReason}
              </p>
              <textarea
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                className="mt-3 min-h-[88px] w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                placeholder="Se desejar, explique por que a conta deve ser revisada."
              />
              <button
                type="button"
                onClick={handleReviewRequest}
                className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Solicitar revisão
              </button>
              {reviewStatus && (
                <p className="mt-2 text-xs font-medium text-amber-900">{reviewStatus}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-10"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-10"
                  placeholder="••••••"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <Link
                  href="/recuperar-senha"
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem conta?{' '}
            <Link href="/registro" className="text-primary-600 font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
