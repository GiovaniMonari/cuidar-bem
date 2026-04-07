'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { SPECIALTIES, STATES } from '@/types';
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';

const DAYS_OPTIONS = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

export default function CaregiverProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [newCert, setNewCert] = useState('');

      const [form, setForm] = useState({
    bio: '',
    specialties: [] as string[],
    experienceYears: 0,
    hourlyRate: 0,
    servicePrices: [] as { serviceKey: string; pricePerHour: number; isAvailable: boolean }[],
    city: '',
    state: '',
    availabilityCalendar: [] as { date: string; slots: string[]; isAvailable: boolean }[],
    certifications: [] as string[],
    isAvailable: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role !== 'caregiver') {
      router.push('/perfil');
      return;
    }
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const data = await api.getMyCaregiverProfile();
      setExistingId(data._id);
                  setForm({
        bio: data.bio,
        specialties: data.specialties,
        experienceYears: data.experienceYears,
        hourlyRate: data.hourlyRate,
        servicePrices: data.servicePrices || [],
        city: data.city,
        state: data.state,
        availabilityCalendar: data.availabilityCalendar || [],
        certifications: data.certifications || [],
        isAvailable: data.isAvailable,
      });
    } catch {
      // Profile doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  const addCertification = () => {
    if (newCert.trim()) {
      setForm((prev) => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()],
      }));
      setNewCert('');
    }
  };

  const removeCertification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (existingId) {
        await api.updateCaregiverProfile(existingId, form);
      } else {
        const result = await api.createCaregiverProfile(form);
        setExistingId(result._id);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {existingId ? 'Editar' : 'Criar'} Perfil de Cuidador
        </h1>
        <p className="text-gray-500 mb-8">
          Complete seu perfil para aparecer nas buscas
        </p>

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Perfil salvo com sucesso!
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sobre Você</h2>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              className="input-field"
              rows={4}
              placeholder="Descreva sua experiência, formação e abordagem de cuidado..."
              required
            />
          </div>

          {/* Location & Pricing */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Localização e Preço
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Cidade
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Estado
                </label>
                <select
                  value={form.state}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, state: e.target.value }))
                  }
                  className="input-field"
                  required
                >
                  <option value="">Selecione</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Valor/hora (R$)
                </label>
                <input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      hourlyRate: Number(e.target.value),
                    }))
                  }
                  className="input-field"
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Anos de Experiência
              </label>
              <input
                type="number"
                value={form.experienceYears}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    experienceYears: Number(e.target.value),
                  }))
                }
                className="input-field sm:!w-40"
                min={0}
                required
              />
            </div>
          </div>

          {/* Specialties */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Especialidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SPECIALTIES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSpecialty(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    form.specialties.includes(key)
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Preços por Serviço
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Defina quanto você cobra por hora em cada tipo de serviço.
            </p>

            <div className="space-y-3">
              {Object.entries(SPECIALTIES).map(([key, label]) => {
                const current = form.servicePrices.find((s) => s.serviceKey === key);

                return (
                  <div
                    key={key}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center border border-gray-100 rounded-xl p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                    </div>

                    <input
                      type="number"
                      min={0}
                      value={current?.pricePerHour || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setForm((prev) => {
                          const others = prev.servicePrices.filter((s) => s.serviceKey !== key);
                          return {
                            ...prev,
                            servicePrices: [
                              ...others,
                              {
                                serviceKey: key,
                                pricePerHour: value,
                                isAvailable: true,
                              },
                            ],
                          };
                        });
                      }}
                      className="input-field"
                      placeholder="Preço por hora"
                    />

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={current?.isAvailable ?? false}
                        onChange={(e) => {
                          setForm((prev) => {
                            const existing = prev.servicePrices.find((s) => s.serviceKey === key);
                            const others = prev.servicePrices.filter((s) => s.serviceKey !== key);

                            return {
                              ...prev,
                              servicePrices: [
                                ...others,
                                {
                                  serviceKey: key,
                                  pricePerHour: existing?.pricePerHour || prev.hourlyRate,
                                  isAvailable: e.target.checked,
                                },
                              ],
                            };
                          });
                        }}
                      />
                      Disponível neste serviço
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Calendário de Disponibilidade
            </h2>

            <AvailabilityCalendar
              selectedDates={form.availabilityCalendar}
              onChange={(dates) =>
                setForm((prev) => ({ ...prev, availabilityCalendar: dates }))
              }
            />

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isAvailable: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Disponível para novos atendimentos
                </span>
              </label>
            </div>
          </div>

          {/* Certifications */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Certificações</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                className="input-field flex-1"
                placeholder="Ex: COREN Ativo, Esp. Geriatria..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCertification();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCertification}
                className="btn-secondary !py-2 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(i)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}