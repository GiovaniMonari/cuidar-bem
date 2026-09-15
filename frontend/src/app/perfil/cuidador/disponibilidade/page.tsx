'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, CheckCircle, Info, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { AvailabilityDate } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function CaregiverAvailabilityPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caregiverId, setCaregiverId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityDate[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'caregiver') {
      router.push('/perfil');
      return;
    }

    const load = async () => {
      try {
        const profile = await api.getMyCaregiverProfile();
        setCaregiverId(profile._id);
        setAvailability(profile.availabilityCalendar || []);
        setIsAvailable(profile.isAvailable !== false);
        setBookedDates((await api.getCaregiverBookedDates(profile._id)) || []);
      } catch (error: any) {
        toast.error('Não foi possível carregar sua disponibilidade', {
          description: error.message || 'Tente novamente em instantes.',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, isAuthenticated, router, user?.role]);

  const save = async () => {
    if (!caregiverId) return;
    setSaving(true);
    try {
      await api.updateCaregiverProfile(caregiverId, {
        availabilityCalendar: availability.map((item) => ({
          date: item.date,
          slots: Array.isArray(item.slots) ? item.slots : [],
          timeRanges: Array.isArray(item.timeRanges) ? item.timeRanges : [],
          isAvailable: item.isAvailable !== false,
        })),
        isAvailable,
      });
      toast.success('Disponibilidade atualizada');
    } catch (error: any) {
      toast.error('Erro ao salvar disponibilidade', {
        description: error.message || 'Tente novamente em instantes.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-80 rounded-2xl" />
          <Skeleton className="h-[620px] w-full rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button type="button" onClick={() => router.push('/perfil')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" /> Voltar para configurações
            </button>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-primary-700">
              <CalendarDays className="h-4 w-4" /> Área do cuidador
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Minha disponibilidade</h1>
            <p className="mt-2 max-w-2xl text-lg font-medium text-gray-500">Organize seus dias e horários livres para receber novos atendimentos.</p>
          </div>
          <Button type="button" onClick={save} disabled={saving || !caregiverId} className="h-12 rounded-2xl px-6 font-black shadow-lg shadow-primary-600/20">
            {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
            {saving ? 'Salvando...' : 'Salvar disponibilidade'}
          </Button>
        </div>

        <Card className="overflow-hidden rounded-[32px] border-none shadow-xl shadow-gray-200/40">
          <CardHeader className="border-b border-gray-100/50 bg-gray-50/50 p-8 sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight text-gray-900">Dias e horários</CardTitle>
                <CardDescription className="mt-1 font-medium text-gray-500">Selecione uma data para configurar um ou mais períodos de atendimento.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 p-6 sm:p-10">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-3 sm:p-6">
              <AvailabilityCalendar selectedDates={availability} bookedDates={bookedDates} onChange={setAvailability} />
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/40 p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <p className="text-sm font-medium leading-relaxed text-primary-800">Datas com atendimentos já marcados ficam protegidas. Ajuste apenas dias futuros sem reservas.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-primary-200">
              <Checkbox checked={isAvailable} onCheckedChange={(checked) => setIsAvailable(checked === true)} className="mt-0.5 h-6 w-6 rounded-lg data-[state=checked]:border-primary-600 data-[state=checked]:bg-primary-600" />
              <span>
                <span className="block font-bold text-gray-900">Aceitar novos atendimentos</span>
                <span className="mt-1 block text-sm font-medium text-gray-500">Desative temporariamente seu perfil sem apagar os horários cadastrados.</span>
              </span>
            </label>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
