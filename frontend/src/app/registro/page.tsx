'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormData } from '@/validations/schemas';
import { maskPhone } from '@/utils/masks';
import { 
  User, Mail, Lock, Phone, AlertCircle, Users, 
  Stethoscope, Loader2, FileText, Shield, 
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'client';

  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: defaultRole,
      acceptedTerms: false,
    }
  });

  const role = watch('role');
  const acceptedTerms = watch('acceptedTerms');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || '',
      });
      toast.success('Conta criada com sucesso! Bem-vindo(a).');
      if (data.role === 'caregiver') {
        router.push('/perfil/cuidador');
      } else {
        router.push('/cuidadores');
      }
    } catch (err: any) {
      setServerError(err.message || 'Erro ao cadastrar');
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px]">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-2">
          <img 
            src="/logo_cuidadores_transparente.png" 
            alt="Logo CuidarBem" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Criar Conta</h1>
        <p className="text-gray-500 mt-2 font-medium">Faça parte da nossa rede de cuidado</p>
      </div>

      <Card className="border-gray-200 shadow-xl shadow-primary-500/5 overflow-hidden">
        <CardContent className="p-8">
          {serverError && (
            <Alert variant="destructive" className="mb-6 bg-red-50 text-red-900 border-red-100">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro no cadastro</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Eu sou</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue('role', 'client', { shouldValidate: true })}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 group",
                    role === 'client'
                      ? "border-primary-500 bg-primary-50/50 text-primary-700"
                      : "border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/30"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    role === 'client' ? "bg-primary-500 text-white" : "bg-white text-gray-400 border border-gray-100"
                  )}>
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold">Busco Cuidador</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'caregiver', { shouldValidate: true })}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 group",
                    role === 'caregiver'
                      ? "border-primary-500 bg-primary-50/50 text-primary-700"
                      : "border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/30"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    role === 'caregiver' ? "bg-primary-500 text-white" : "bg-white text-gray-400 border border-gray-100"
                  )}>
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold">Sou Cuidador</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    id="name"
                    {...register('name')}
                    className={cn("pl-10 h-11", errors.name && "border-red-500 focus-visible:ring-red-100")}
                    placeholder="Como podemos te chamar?"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
                )}
              </div>

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
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone', {
                      onChange: (e) => {
                        const masked = maskPhone(e.target.value);
                        setValue('phone', masked, { shouldValidate: true });
                      },
                    })}
                    className={cn("pl-10 h-11", errors.phone && "border-red-500 focus-visible:ring-red-100")}
                    placeholder="(11) 99999-0000"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs font-medium text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      className={cn("pl-10 h-11", errors.password && "border-red-500 focus-visible:ring-red-100")}
                      placeholder="••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register('confirmPassword')}
                      className={cn("pl-10 h-11", errors.confirmPassword && "border-red-500 focus-visible:ring-red-100")}
                      placeholder="••••••"
                    />
                  </div>
                </div>
                {(errors.password || errors.confirmPassword) && (
                  <p className="text-xs font-medium text-red-500 col-span-2">
                    {errors.password?.message || errors.confirmPassword?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setValue('acceptedTerms', checked as boolean, { shouldValidate: true })}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="terms" className="text-sm font-medium text-gray-600 leading-relaxed cursor-pointer">
                    Li e aceito os{' '}
                    <Link href="/termos" target="_blank" className="text-primary-600 font-bold hover:underline">Termos de Uso</Link>
                    {' '}e a{' '}
                    <Link href="/privacidade" target="_blank" className="text-primary-600 font-bold hover:underline">Política de Privacidade</Link>.
                  </label>
                  {errors.acceptedTerms && (
                    <p className="text-xs font-medium text-red-500">{errors.acceptedTerms.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    <Shield className="w-3 h-3" />
                    Seus dados estão seguros (LGPD)
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary-500/10 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Criar Minha Conta
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Já possui uma conta?{' '}
              <Link href="/login" className="text-primary-600 font-bold hover:underline">
                Faça login aqui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-gray-500 font-medium animate-pulse">Carregando formulário...</p>
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
