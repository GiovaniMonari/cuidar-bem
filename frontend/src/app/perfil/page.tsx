'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { editProfileSchema, type EditProfileFormData } from '@/validations/schemas';
import { UserAvatar } from '@/components/UserAvatar';
import { Camera, Star, Trash2, ShieldCheck, Mail, Phone, Edit3, Save, Stethoscope, Loader2, CheckCircle, AlertCircle, User as UserIcon, Badge } from 'lucide-react';
import { maskPhone } from '@/utils/masks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
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
          </div>
        )}
      </div>
    </div>
  );
}