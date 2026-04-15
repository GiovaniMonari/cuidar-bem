'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { api } from '@/services/api';

const MIN_PASSWORD_LENGTH = 8;

function isStrongPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }

  const checks = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return checks >= 2;
}

function ResetPasswordPageFallback() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5 text-sm text-primary-700">
            Carregando redefinição de senha...
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      if (!token) {
        if (isMounted) {
          setError('Este link de redefinição é inválido ou expirou');
          setTokenValid(false);
          setValidatingToken(false);
        }
        return;
      }

      try {
        await api.validatePasswordResetToken(token);
        if (!isMounted) {
          return;
        }

        setTokenValid(true);
        setError('');
      } catch (err: any) {
        if (!isMounted) {
          return;
        }

        setTokenValid(false);
        setError(err.message || 'Este link de redefinição é inválido ou expirou');
      } finally {
        if (isMounted) {
          setValidatingToken(false);
        }
      }
    };

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!isStrongPassword(password)) {
      setError('Escolha uma senha mais segura');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.resetPassword(token, password);
      setSuccessMessage(response.message);
      setTokenValid(false);
    } catch (err: any) {
      const message =
        err.message || 'Não foi possível redefinir a senha neste momento.';
      setError(message);

      if (message.toLowerCase().includes('inválido') || message.toLowerCase().includes('expirou')) {
        setTokenValid(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showInvalidState = !validatingToken && !tokenValid && !successMessage;

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
          <h1 className="text-2xl font-bold text-gray-900">Nova senha</h1>
          <p className="text-gray-500 mt-1">
            Crie uma nova senha para voltar a acessar sua conta com segurança.
          </p>
        </div>

        <div className="card p-8">
          {validatingToken ? (
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5 text-sm text-primary-700">
              Validando o link de redefinição...
            </div>
          ) : successMessage ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Senha redefinida com sucesso!
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">{successMessage}</p>
                  </div>
                </div>
              </div>

              <Link href="/login" className="btn-primary block w-full text-center">
                Voltar para login
              </Link>
            </div>
          ) : showInvalidState ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Link inválido ou expirado
                    </p>
                    <p className="mt-1 text-sm text-red-800">
                      {error || 'Solicite um novo link para redefinir a sua senha.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/recuperar-senha"
                  className="btn-primary block w-full text-center"
                >
                  Solicitar novo link
                </Link>
                <Link
                  href="/login"
                  className="btn-secondary block w-full text-center"
                >
                  Voltar para login
                </Link>
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
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="input-field !pl-10"
                      placeholder="Digite sua nova senha"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="input-field !pl-10"
                      placeholder="Confirme sua nova senha"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Use pelo menos 8 caracteres. Misturar letras, números e símbolos deixa a senha mais segura.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Redefinindo...' : 'Redefinir senha'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
