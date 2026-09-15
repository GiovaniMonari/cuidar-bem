'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Save, Trash2, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Dependent, PatientProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const conditionOptions = [
  { value: 'Alzheimer / Demência', label: 'Alzheimer ou demência' },
  { value: 'TEA / Deficiência Intelectual', label: 'TEA ou deficiência intelectual' },
  { value: 'Deficiência Física', label: 'Deficiência física' },
  { value: 'Acamado', label: 'Acamado' },
  { value: 'Mobilidade reduzida', label: 'Mobilidade reduzida' },
];

type DependentForm = { name: string; age: string; conditions: string[]; notes: string };
const blankForm: DependentForm = { name: '', age: '', conditions: [], notes: '' };

function ConditionCheckboxes({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-sm font-medium text-gray-700">Condições ou transtornos</p>
      {conditionOptions.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            onChange={(event) => onChange(event.target.checked ? [...values, option.value] : values.filter((value) => value !== option.value))}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export default function DependentsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profileForm, setProfileForm] = useState<DependentForm>(blankForm);
  const [form, setForm] = useState<DependentForm>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([api.getDependents(), api.getPatientProfile()])
      .then(([savedDependents, savedProfile]) => {
        setDependents(savedDependents);
        setPatientProfile(savedProfile);
        setProfileForm({
          name: user?.name || savedProfile?.name || '',
          age: savedProfile ? String(savedProfile.age) : '',
          conditions: savedProfile?.conditions || [],
          notes: savedProfile?.notes || '',
        });
      })
      .catch((error: any) => toast.error(error.message || 'Não foi possível carregar os dependentes.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.name]);

  const updateField = (field: keyof DependentForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(blankForm);
    setEditingId(null);
  };

  const updateProfileField = (field: keyof DependentForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const profileName = user?.name?.trim() || profileForm.name.trim();
    if (!profileName || !profileForm.age || Number(profileForm.age) < 0 || Number(profileForm.age) > 130) {
      toast.error('Informe seu nome e uma idade válida.');
      return;
    }

    setProfileSaving(true);
    try {
      const saved = await api.updatePatientProfile({
        name: profileName,
        age: Number(profileForm.age),
        conditions: profileForm.conditions,
        disorder: profileForm.conditions.join(', '),
        notes: profileForm.notes.trim(),
      });
      setPatientProfile(saved);
      toast.success('Seu perfil de paciente foi salvo.');
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível salvar seu perfil de paciente.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.age || Number(form.age) < 0 || Number(form.age) > 130) {
      toast.error('Informe nome e uma idade válida.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      conditions: form.conditions,
      disorder: form.conditions.join(', '),
      notes: form.notes.trim(),
    };
    try {
      const saved = editingId
        ? await api.updateDependent(editingId, payload)
        : await api.createDependent(payload);
      setDependents((current) => editingId
        ? current.map((dependent) => dependent._id === editingId ? saved : dependent)
        : [...current, saved]);
      toast.success(editingId ? 'Dependente atualizado.' : 'Dependente adicionado.');
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível salvar o dependente.');
    } finally {
      setSaving(false);
    }
  };

  const editDependent = (dependent: Dependent) => {
    setEditingId(dependent._id);
    setForm({
      name: dependent.name,
      age: String(dependent.age),
      conditions: dependent.conditions || [],
      notes: dependent.notes || '',
    });
  };

  const removeDependent = async (dependent: Dependent) => {
    if (!window.confirm(`Remover ${dependent.name} da sua lista de dependentes?`)) return;
    try {
      await api.removeDependent(dependent._id);
      setDependents((current) => current.filter((item) => item._id !== dependent._id));
      if (editingId === dependent._id) resetForm();
      toast.success('Dependente removido.');
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível remover o dependente.');
    }
  };

  if (authLoading || loading) {
    return <main className="min-h-screen bg-gray-50 px-4 py-12"><div className="max-w-5xl mx-auto h-40 animate-pulse rounded-2xl bg-white" /></main>;
  }

  return (
    <main className="min-h-screen bg-gray-50/70 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 text-primary-700 mb-2"><Users className="w-6 h-6" /><span className="text-sm font-semibold uppercase tracking-wide">Minha família</span></div>
          <h1 className="text-3xl font-bold text-gray-900">Dependentes</h1>
          <p className="text-gray-600 mt-2">Cadastre as pessoas que recebem atendimento para agilizar suas próximas solicitações.</p>
        </header>

        <Card className="border-primary-100 shadow-sm bg-primary-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary-600" />
              Meu perfil de paciente
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure seus dados para solicitar atendimento para você com mais rapidez.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
              <div><Label htmlFor="profile-name">Nome</Label><Input id="profile-name" value={user?.name || profileForm.name} readOnly className="bg-gray-100" /><p className="mt-1 text-xs text-gray-500">Usamos o nome da sua conta para identificar seu perfil de paciente.</p></div>
              <div><Label htmlFor="profile-age">Idade</Label><Input id="profile-age" type="number" min="0" max="130" value={profileForm.age} onChange={(event) => updateProfileField('age', event.target.value)} placeholder="Sua idade" /></div>
              <ConditionCheckboxes values={profileForm.conditions} onChange={(conditions) => setProfileForm((current) => ({ ...current, conditions }))} />
              <div><Label htmlFor="profile-notes">Informações importantes</Label><Textarea id="profile-notes" rows={2} value={profileForm.notes} onChange={(event) => updateProfileField('notes', event.target.value)} placeholder="Rotina, necessidades e observações" /></div>
              <div className="md:col-span-2"><Button type="submit" disabled={profileSaving}><Save className="w-4 h-4" />{profileSaving ? 'Salvando...' : patientProfile ? 'Atualizar meu perfil' : 'Salvar meu perfil'}</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="w-5 h-5 text-primary-600" />Pessoas cadastradas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {dependents.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">Nenhum dependente cadastrado ainda.</div>
              ) : dependents.map((dependent) => (
                <div key={dependent._id} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{dependent.name}</p>
                    <p className="text-sm text-gray-600">{dependent.age} anos{(dependent.conditions?.join(', ') || dependent.disorder) ? ` • ${dependent.conditions?.join(', ') || dependent.disorder}` : ''}</p>
                    {dependent.notes && <p className="text-sm text-gray-500 mt-1">{dependent.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" title="Editar dependente" onClick={() => editDependent(dependent)}><Pencil /></Button>
                    <Button type="button" variant="ghost" size="icon" title="Remover dependente" onClick={() => removeDependent(dependent)}><Trash2 className="text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader><CardTitle>{editingId ? 'Editar dependente' : 'Adicionar dependente'}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label htmlFor="dependent-name">Nome</Label><Input id="dependent-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Nome completo" /></div>
                <div><Label htmlFor="dependent-age">Idade</Label><Input id="dependent-age" type="number" min="0" max="130" value={form.age} onChange={(event) => updateField('age', event.target.value)} placeholder="Idade" /></div>
                <ConditionCheckboxes values={form.conditions} onChange={(conditions) => setForm((current) => ({ ...current, conditions }))} />
                <div><Label htmlFor="dependent-notes">Informações importantes</Label><Textarea id="dependent-notes" rows={3} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Rotina, necessidades e observações" /></div>
                <div className="flex gap-2 pt-2"><Button type="submit" disabled={saving}><Plus className="w-4 h-4" />{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar'}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}</div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
