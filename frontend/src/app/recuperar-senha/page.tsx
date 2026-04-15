'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { api } from '@/services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Digite um e-mail válido');
      return;
    }

    setLoading(true);

    try {
      const response = await api.requestPasswordReset(normalizedEmail);
      setSuccessMessage(response.message);
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar o link agora.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Esqueceu sua senha?</h1>
          <p className="text-gray-500 mt-1">
            Digite seu e-mail cadastrado para receber um link de redefinição de senha.
          </p>
        </div>

        <div className="card p-8">
          {successMessage ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Link enviado
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">{successMessage}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/login" className="btn-primary block w-full text-center">
                  Voltar para login
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage('');
                    setEmail('');
                  }}
                  className="btn-secondary w-full"
                >
                  Enviar outro link
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="input-field !pl-10"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
