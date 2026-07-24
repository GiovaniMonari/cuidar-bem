'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  editProfileSchema,
  caregiverPayoutSchema,
  type EditProfileFormData,
  type CaregiverPayoutFormData,
} from '@/validations/schemas';
import { UserAvatar } from '@/components/UserAvatar';
import { Camera, Star, Trash2, ShieldCheck, Mail, Phone, Edit3, Save, Stethoscope, Loader2, CheckCircle, AlertCircle, User as UserIcon, Badge, CreditCard, LockKeyhole } from 'lucide-react';
import { maskPhone } from '@/utils/masks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function ProfilePageContent() {
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [caregiverProfile, setCaregiverProfile] = useState<any>(null);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [mercadoPagoConnecting, setMercadoPagoConnecting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileSchema) as any,
    mode: 'onBlur',
  });

  const {
    register: registerPayout,
    handleSubmit: handlePayoutSubmit,
    reset: resetPayout,
    watch: watchPayout,
    formState: { errors: payoutErrors },
  } = useForm<CaregiverPayoutFormData>({
    resolver: yupResolver(caregiverPayoutSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      payoutMethod: 'pix',
      pixKeyType: 'cpf',
      pixKey: '',
    },
  });
  const payoutMethod = watchPayout('payoutMethod');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const mercadoPagoStatus = searchParams.get('mercadopago');
    if (mercadoPagoStatus === 'connected') {
      toast.success('Mercado Pago conectado com sucesso!');
      router.replace('/perfil');
    } else if (mercadoPagoStatus === 'error') {
      toast.error('Não foi possível conectar o Mercado Pago.');
      router.replace('/perfil');
    }
  }, [router, searchParams]);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      if (data.role === 'caregiver') {
        try {
          const caregiver = await api.getMyCaregiverProfile();
          setCaregiverProfile(caregiver);
          resetPayout({
            payoutMethod: caregiver.payoutAccount?.method || 'pix',
            pixKeyType: caregiver.payoutAccount?.pixKeyType || 'cpf',
            pixKey: caregiver.payoutAccount?.pixKey || '',
          });
        } catch {
          setCaregiverProfile(null);
        }
      }
      reset({ name: data.name, phone: data.phone || '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const updated = await api.uploadAvatar(file);
      setProfile(updated);
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

    const handleRemoveAvatar = async () => {
    try {
      const updated = await api.removeAvatar();
      setProfile(updated);
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Erro ao remover avatar');
    }
  };

  const onSave = async (data: EditProfileFormData) => {
    try {
      const updated = await api.updateProfile(data);
      setProfile(updated);
      updateUser(updated);
      setEditing(false);
      toast.success('Perfil atualizado com sucesso!', {
        description: 'Suas alterações já estão visíveis para todos.',
      });
    } catch (error: any) {
      toast.error('Erro ao salvar alterações', {
        description: error.message || 'Ocorreu um problema inesperado.',
      });
    }
  };

  const onSavePayout = async (data: CaregiverPayoutFormData) => {
    if (!caregiverProfile?._id) {
      toast.error('Crie seu perfil de cuidador antes de configurar o saque.');
      return;
    }

    if (data.payoutMethod === 'pix' && (!data.pixKeyType || !data.pixKey?.trim())) {
      toast.error('Informe o tipo e a chave Pix para salvar o saque.');
      return;
    }

    setPayoutSaving(true);
    try {
      const updated = await api.updateCaregiverProfile(caregiverProfile._id, {
        payoutAccount: {
          method: data.payoutMethod,
          pixKeyType: data.payoutMethod === 'pix' ? data.pixKeyType : undefined,
          pixKey: data.payoutMethod === 'pix' ? data.pixKey?.trim() : undefined,
        },
      });
      setCaregiverProfile(updated);
      resetPayout({
        payoutMethod: updated.payoutAccount?.method || 'pix',
        pixKeyType: updated.payoutAccount?.pixKeyType || 'cpf',
        pixKey: updated.payoutAccount?.pixKey || '',
      });
      toast.success('Configuração de saque salva com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar configuração de saque', {
        description: error.message || 'Ocorreu um problema inesperado.',
      });
    } finally {
      setPayoutSaving(false);
    }
  };

  const connectMercadoPago = async () => {
    setMercadoPagoConnecting(true);
    try {
      const { url } = await api.getMercadoPagoConnectUrl();
      window.location.assign(url);
    } catch (error: any) {
      setMercadoPagoConnecting(false);
      toast.error('Não foi possível iniciar a conexão com o Mercado Pago', {
        description: error.message || 'Verifique a configuração OAuth do backend.',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    // Reset form to profile values
    reset({ name: profile?.name || '', phone: profile?.phone || '' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Card className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Configurações</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie suas informações pessoais e de conta.</p>
          </div>
          {editing && (
             <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-1 rounded-full font-bold">Modo Edição</Badge>
          )}
        </div>

        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="relative">
                  <UserAvatar
                    name={profile?.name}
                    avatar={profile?.avatar}
                    size={112}
                    className="rounded-3xl border-4 border-white shadow-xl group-hover:scale-105 transition-transform"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center backdrop-blur-[2px]">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2.5 rounded-2xl cursor-pointer hover:bg-primary-700 transition-all shadow-xl hover:scale-110 active:scale-95 border-2 border-white">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {profile?.name}
                  </h2>
                  <Badge className="bg-primary-50 text-primary-700 hover:bg-primary-50 border-none font-bold px-3">
                    {profile?.role === 'caregiver' ? 'Cuidador Verificado' : 'Cliente Premium'}
                  </Badge>
                </div>
                <p className="text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                   <Mail className="w-4 h-4" />
                   {profile?.email}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
                  {profile?.avatar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2 rounded-xl h-9"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover foto
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold gap-2 rounded-xl h-9 border-gray-200"
                  >
                     <ShieldCheck className="w-4 h-4" />
                     Conta Segura
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 sm:p-10">
            <form onSubmit={handleSubmit(onSave)} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</Label>
                  {editing ? (
                    <div className="space-y-1">
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <Input
                          type="text"
                          {...register('name')}
                          className={cn(
                            "h-14 pl-12 bg-gray-50 border-transparent focus:bg-white rounded-2xl font-medium transition-all",
                            errors.name && "border-red-500 bg-white ring-4 ring-red-50"
                          )}
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs font-bold text-red-500 ml-1">{errors.name.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 py-4 px-5 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-gray-50 transition-colors">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-bold text-gray-700">{profile?.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 opacity-60">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">E-mail de Acesso</Label>
                  <div className="flex items-center gap-4 py-4 px-5 bg-gray-50 rounded-2xl border border-gray-200/50">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="font-bold text-gray-500">{profile?.email}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 ml-1">O e-mail não pode ser alterado por segurança.</p>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</Label>
                  {editing ? (
                    <div className="space-y-1">
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <Input
                          type="tel"
                          {...register('phone', {
                            onChange: (e) => {
                              const masked = maskPhone(e.target.value);
                              setValue('phone', masked, { shouldValidate: true });
                            },
                          })}
                          placeholder="(11) 99999-0000"
                          className={cn(
                            "h-14 pl-12 bg-gray-50 border-transparent focus:bg-white rounded-2xl font-medium transition-all",
                            errors.phone && "border-red-500 bg-white ring-4 ring-red-50"
                          )}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs font-bold text-red-500 ml-1">{errors.phone.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 py-4 px-5 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-gray-50 transition-colors">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="font-bold text-gray-700">{profile?.phone || 'Não informado'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 flex items-end">
                   {editing ? (
                     <div className="flex gap-3 w-full">
                       <Button type="submit" className="flex-1 h-14 rounded-2xl font-black gap-2 shadow-lg shadow-primary-500/20">
                         <Save className="w-5 h-5" />
                         Salvar Dados
                       </Button>
                       <Button variant="outline" type="button" onClick={handleCancelEdit} className="flex-1 h-14 rounded-2xl font-bold border-gray-200">
                         Cancelar
                       </Button>
                     </div>
                   ) : (
                     <Button
                       type="button"
                       onClick={() => setEditing(true)}
                       className="w-full h-14 rounded-2xl font-black gap-2 bg-gray-900 hover:bg-black shadow-xl"
                     >
                       <Edit3 className="w-5 h-5" />
                       Editar Dados Pessoais
                     </Button>
                   )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {user?.role === 'caregiver' && (
          <div className="mt-10 space-y-6">
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
              <div className="flex flex-col sm:flex-row items-center justify-between p-8 gap-6">
                <div className="flex items-center gap-5 text-center sm:text-left">
                  <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500 shadow-inner">
                    <Star className="w-7 h-7 fill-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Minhas Avaliações</h3>
                    <p className="text-gray-500 font-medium">Veja o que seus clientes estão dizendo sobre você.</p>
                  </div>
                </div>
                <Link href="/perfil/cuidador/rating" className="w-full sm:w-auto">
                  <Button className="w-full bg-white border-2 border-gray-100 text-gray-900 hover:bg-gray-50 font-bold h-12 px-8 rounded-2xl">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-shadow bg-white border-l-8 border-l-primary-500">
              <div className="flex flex-col sm:flex-row items-center justify-between p-8 gap-6">
                <div className="flex items-center gap-5 text-center sm:text-left">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Perfil de Cuidador</h3>
                    <p className="text-gray-500 font-medium">Configure especialidades, valores e horários.</p>
                  </div>
                </div>
                <Link href="/perfil/cuidador" className="w-full sm:w-auto">
                  <Button className="w-full h-12 px-8 font-black rounded-2xl shadow-lg shadow-primary-500/20">
                    Configurar Agora
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Configuração de Saque</CardTitle>
                    <CardDescription className="text-gray-500 font-medium mt-1">Escolha como receber os valores dos seus serviços.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handlePayoutSubmit(onSavePayout)} className="space-y-6">
                  <div className="flex items-start gap-4 rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
                    <CreditCard className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                    <div>
                      <p className="font-black text-gray-900">Pix ou conta Mercado Pago</p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
                        Escolha uma conta para receber os valores liberados dos seus atendimentos.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="ml-1 text-xs font-black uppercase tracking-widest text-gray-400">Método de saque</Label>
                    <select
                      {...registerPayout('payoutMethod')}
                      className="h-14 w-full rounded-2xl border-transparent bg-gray-50 px-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="pix">Pix</option>
                      <option value="mercado_pago">Conta Mercado Pago</option>
                    </select>
                  </div>

                  {payoutErrors.payoutMethod && (
                    <p className="ml-1 text-xs font-bold text-red-500">Selecione um método de saque.</p>
                  )}

                  {payoutMethod === 'pix' && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2.5">
                      <Label className="ml-1 text-xs font-black uppercase tracking-widest text-gray-400">Tipo de chave Pix</Label>
                      <select
                        {...registerPayout('pixKeyType')}
                        className="h-14 w-full rounded-2xl border-transparent bg-gray-50 px-4 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-200"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave aleatória</option>
                      </select>
                      </div>
                      <div className="space-y-2.5">
                      <Label className="ml-1 text-xs font-black uppercase tracking-widest text-gray-400">Chave Pix</Label>
                      <Input
                        type="text"
                        {...registerPayout('pixKey')}
                        className="h-14 rounded-2xl border-transparent bg-gray-50 font-medium transition-all focus:bg-white"
                        placeholder="Informe sua chave Pix"
                      />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 border-t border-gray-100 pt-5 text-xs font-bold text-gray-400">
                    <LockKeyhole className="h-4 w-4 text-emerald-500" />
                    Os dados são usados somente para encaminhar o saque ao destino escolhido.
                  </div>

                  <Button type="submit" disabled={payoutSaving} className="h-12 w-full rounded-2xl font-black gap-2">
                    {payoutSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {payoutSaving ? 'Salvando...' : 'Salvar configuração de saque'}
                  </Button>

                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-gray-900">Conta Mercado Pago</p>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                          {caregiverProfile?.mercadoPago?.userId
                            ? 'Conta conectada e pronta para receber repasses.'
                            : 'Conecte sua conta para usar esse método de saque.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={caregiverProfile?.mercadoPago?.userId ? 'outline' : 'default'}
                        disabled={mercadoPagoConnecting}
                        onClick={connectMercadoPago}
                        className="rounded-2xl font-black gap-2"
                      >
                        {mercadoPagoConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {caregiverProfile?.mercadoPago?.userId ? 'Reconectar Mercado Pago' : 'Conectar Mercado Pago'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Card className="border-none shadow-sm rounded-3xl">
              <CardContent className="p-8 space-y-8">
                <Skeleton className="h-24 w-24 rounded-3xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}