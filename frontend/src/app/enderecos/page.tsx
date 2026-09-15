'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SavedAddress } from '@/utils/savedAddresses';

type AddressRecord = SavedAddress & { _id: string };
const emptyAddress: SavedAddress = { label: '', address: '', baseAddress: '', number: '', complement: '', cep: '', lat: '', lon: '' };

export default function AddressesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [form, setForm] = useState<SavedAddress>(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getSavedAddresses()
      .then(setAddresses)
      .catch((error: any) => toast.error(error.message || 'Não foi possível carregar seus endereços.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const resetForm = () => {
    setForm(emptyAddress);
    setEditingId(null);
    setValidated(false);
  };

  const updateAddress = (data: Partial<SavedAddress>) => {
    setForm((current) => ({ ...current, ...data }));
    setValidated(false);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validated || !form.lat || !form.lon) {
      toast.error('Valide o endereço antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const saved = editingId
        ? await api.updateSavedAddress(editingId, form)
        : await api.createSavedAddress({ ...form, label: form.label.trim() || 'Endereço salvo' });
      setAddresses((current) => editingId
        ? current.map((address) => address._id === editingId ? saved : address)
        : [saved, ...current.filter((address) => address.address !== saved.address)]);
      toast.success(editingId ? 'Endereço atualizado.' : 'Endereço salvo.');
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (address: AddressRecord) => {
    setEditingId(address._id);
    setForm(address);
    setValidated(Boolean(address.lat && address.lon));
  };

  const removeAddress = async (address: AddressRecord) => {
    if (!window.confirm(`Excluir ${address.label || 'este endereço'}?`)) return;
    try {
      await api.removeSavedAddress(address._id);
      setAddresses((current) => current.filter((item) => item._id !== address._id));
      if (editingId === address._id) resetForm();
      toast.success('Endereço excluído.');
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível excluir o endereço.');
    }
  };

  const useAddress = (address: AddressRecord) => {
    sessionStorage.setItem('cuidarbem_selected_address', JSON.stringify(address));
    const returnTo = searchParams.get('returnTo');
    router.push(returnTo || '/cuidadores');
  };

  if (authLoading || loading) return <main className="min-h-screen bg-gray-50 px-4 py-12"><div className="max-w-5xl mx-auto h-40 animate-pulse rounded-2xl bg-white" /></main>;

  return (
    <main className="min-h-screen bg-gray-50/70 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header><div className="flex items-center gap-3 text-primary-700 mb-2"><MapPin className="w-6 h-6" /><span className="text-sm font-semibold uppercase tracking-wide">Perfil do cliente</span></div><h1 className="text-3xl font-bold text-gray-900">Meus endereços</h1><p className="text-gray-600 mt-2">Salve endereços validados para agilizar seus próximos pedidos.</p></header>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          <Card className="border-gray-200 shadow-sm"><CardHeader><CardTitle>Endereços salvos</CardTitle></CardHeader><CardContent className="space-y-3">
            {addresses.length === 0 ? <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">Nenhum endereço salvo ainda.</div> : addresses.map((address) => <div key={address._id} className="rounded-xl border border-gray-200 p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-900">{address.label}</p><p className="text-sm text-gray-600">{address.address}</p>{address.cep && <p className="text-xs text-gray-500 mt-1">CEP {address.cep}</p>}</div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" title="Editar endereço" onClick={() => editAddress(address)}><Pencil /></Button><Button type="button" variant="ghost" size="icon" title="Excluir endereço" onClick={() => removeAddress(address)}><Trash2 className="text-red-500" /></Button></div></div><Button type="button" variant="outline" className="w-full" onClick={() => useAddress(address)}>Usar neste pedido</Button></div>)}
          </CardContent></Card>
          <Card className="border-gray-200 shadow-sm"><CardHeader><CardTitle>{editingId ? 'Editar endereço' : 'Adicionar endereço'}</CardTitle></CardHeader><CardContent><form onSubmit={handleSave} className="space-y-4"><div><Label htmlFor="address-label">Identificação</Label><Input id="address-label" value={form.label} onChange={(event) => updateAddress({ label: event.target.value })} placeholder="Ex.: Casa, trabalho" /></div><AddressAutocomplete value={form.baseAddress || form.address} cep={form.cep || ''} number={form.number || ''} complement={form.complement || ''} lat={form.lat || ''} lon={form.lon || ''} isValidated={validated} onChange={updateAddress} onValidationChange={setValidated} /><div><Label htmlFor="address-notes">Observações</Label><Textarea id="address-notes" value={form.complement || ''} onChange={(event) => updateAddress({ complement: event.target.value })} placeholder="Complemento ou referência" rows={2} /></div><div className="flex gap-2"><Button type="submit" disabled={saving || !validated}><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar endereço'}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}><Plus className="w-4 h-4" />Novo</Button>}</div></form></CardContent></Card>
        </div>
      </div>
    </main>
  );
}