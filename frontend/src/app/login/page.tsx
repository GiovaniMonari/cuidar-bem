'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { loginSchema, type LoginFormData } from '@/validations/schemas';
import { Heart, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const [banReason, setBanReason] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
  });

  const emailValue = watch('email');

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setBanReason('');
    setReviewStatus('');
    setLoading(true);
    try {
      const loggedUser = await login(data.email, data.password);
      toast.success(`Bem-vindo de volta, ${loggedUser.name}!`);
      router.push(loggedUser.role === 'admin' ? '/admin' : '/agenda');
    } catch (err: any) {
      const msg = err.message || 'Erro ao fazer login';
      setServerError(msg);
      if (err.code === 'ACCOUNT_BANNED') {
        setBanReason(err.banReason || '');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    setReviewStatus('');
    try {
      const response = await api.requestBanReview(emailValue || '', reviewMessage);
      setReviewStatus(response.message);
      toast.success('Solicitação de revisão enviada!');
    } catch (err: any) {
      const msg = err.message || 'Não foi possível solicitar revisão.';
      setReviewStatus(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <img 
              src="/logo_cuidadores_transparente.png" 
              alt="Logo CuidarBem" 
              className="w-24 h-24 object-contain hover:rotate-3 transition-transform"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bem-vindo</h1>
          <p className="text-gray-500 mt-2 font-medium">Sua conta CuidarBem te espera</p>
        </div>

        <Card className="border-gray-200 shadow-xl shadow-primary-500/5">
          <CardContent className="p-8">
            {serverError && (
              <Alert variant="destructive" className="mb-6 bg-red-50 text-red-900 border-red-100">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de acesso</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {banReason && (
              <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="font-bold">Conta bloqueada</AlertTitle>
                <AlertDescription className="space-y-4">
                  <p className="text-amber-800">Motivo: <span className="font-semibold">{banReason}</span></p>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    className="w-full min-h-[100px] rounded-lg border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="Explique por que sua conta deve ser revisada..."
                  />
                  <Button
                    onClick={handleReviewRequest}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Solicitar revisão
                  </Button>
                  {reviewStatus && (
                    <p className="mt-2 text-xs font-bold text-amber-700">{reviewStatus}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={cn("pl-10 h-11", errors.email && "border-red-500 focus-visible:ring-red-100")}
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/recuperar-senha"
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={cn("pl-10 h-11", errors.password && "border-red-500 focus-visible:ring-red-100")}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-bold shadow-lg shadow-primary-500/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : 'Entrar'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Não tem uma conta?{' '}
                <Link href="/registro" className="text-primary-600 font-bold hover:underline">
                  Cadastre-se grátis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
