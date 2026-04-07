'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { UserAvatar } from '@/components/UserAvatar';
import { Camera, Trash2 } from 'lucide-react';
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  Stethoscope,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { maskPhone } from '@/utils/masks';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

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
      setForm({ name: data.name, phone: data.phone || '' });
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

  const handleSave = async () => {
    try {
      const updated = await api.getProfile(); // Use PUT endpoint
      setProfile({ ...profile, ...form });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

        {saved && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Perfil atualizado com sucesso!
          </div>
        )}

        <div className="card p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <UserAvatar
                name={profile?.name}
                avatar={profile?.avatar}
                size={80}
              />
              <label className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.name}
              </h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              <span className="inline-block mt-1 bg-primary-100 text-primary-700 text-xs px-3 py-1 rounded-full font-medium">
                {profile?.role === 'caregiver' ? 'Cuidador' : 'Cliente'}
              </span>
              {uploading && (
                <p className="text-xs text-primary-600 mt-2">Enviando foto...</p>
              )}
            </div>
          </div>
              <div className="flex gap-2 mt-3">
                <label className="text-xs text-primary-600 font-medium cursor-pointer hover:underline">
                  Trocar foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>

                {profile?.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                )}
              </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome
              </label>
              {editing ? (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input-field !pl-10"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-700 py-3 px-4 bg-gray-50 rounded-xl">
                  <User className="w-4 h-4 text-gray-400" />
                  {profile?.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 text-gray-700 py-3 px-4 bg-gray-50 rounded-xl">
                <Mail className="w-4 h-4 text-gray-400" />
                {profile?.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefone
              </label>
              {editing ? (
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))
                    }
                    className="input-field !pl-10"
                    placeholder="(11) 99999-0000"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-700 py-3 px-4 bg-gray-50 rounded-xl">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {profile?.phone || 'Não informado'}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              {editing ? (
                <>
                  <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>

        {user?.role === 'caregiver' && (
          <div className="card p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Perfil de Cuidador
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure suas especialidades e disponibilidade
                  </p>
                </div>
              </div>
              <Link href="/perfil/cuidador" className="btn-primary !py-2 text-sm">
                Configurar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}