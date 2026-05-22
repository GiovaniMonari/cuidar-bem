'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { caregiverProfileSchema, type CaregiverProfileFormData } from '@/validations/schemas';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { deriveSpecialtiesFromServices } from '@/utils/serviceSpecialities';
import { CityAutocomplete } from '@/components/CityAutoComplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Save, Loader2, CheckCircle, AlertCircle, 
  Plus, X, Briefcase, MapPin, DollarSign, 
  Award, Calendar as CalendarIcon, Info,
  ChevronRight, Stethoscope as StethoscopeIcon,
  Heart, Users, ShieldCheck, Edit3, GraduationCap
} from 'lucide-react';
import { AvailabilityDate, ServiceType, SPECIALTIES } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CaregiverProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [newCert, setNewCert] = useState('');

  // Fields not covered by the Yup schema (complex/array types)
  const [specialties, setSpecialties] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<CaregiverProfileFormData>({
    resolver: yupResolver(caregiverProfileSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      bio: '',
      city: '',
      state: '',
      hourlyRate: 0,
      experienceYears: 0,
      certifications: [],
      isAvailable: true,
      servicePrices: [],
      availabilityCalendar: [],
      specialties: [],
    },
  });

  const { fields: servicePriceFields, replace: replaceServicePrices, update: updateServicePrice } = useFieldArray({
    control,
    name: 'servicePrices',
  });

  const formValues = watch();
  const certifications = watch('certifications') || [];
  const isAvailable = watch('isAvailable');
  const servicePrices = watch('servicePrices') || [];
  const availabilityCalendar = (watch('availabilityCalendar') as AvailabilityDate[]) || [];

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
      fetchInitialData();
    }
  }, [authLoading, isAuthenticated, user]);

    useEffect(() => {
    const autoSpecialties = deriveSpecialtiesFromServices(servicePrices);

    setSpecialties((prev) => {
      const same =
        JSON.stringify([...prev].sort()) ===
        JSON.stringify([...autoSpecialties].sort());

      if (same) return prev;

      setValue('specialties', autoSpecialties, { shouldValidate: true });
      return autoSpecialties;
    });
  }, [servicePrices, setValue]);

  const fetchInitialData = async () => {
    try {
      const services = await api.getServiceTypes();
      setServiceTypes(services || []);

      try {
        const data = await api.getMyCaregiverProfile();
        setExistingId(data._id);

        const booked = await api.getCaregiverBookedDates(data._id);
        setBookedDates(booked || []);

        // Reset RHF fields
        reset({
          bio: data.bio,
          city: data.city,
          state: data.state,
          hourlyRate: data.hourlyRate,
          experienceYears: data.experienceYears,
          certifications: data.certifications || [],
          isAvailable: data.isAvailable,
          servicePrices: data.servicePrices || [],
          availabilityCalendar: data.availabilityCalendar || [],
          specialties: data.specialties || [],
        });

        // Set non-schema fields
        setSpecialties(data.specialties || []);
      } catch {
        // Perfil ainda não existe
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addCertification = () => {
    if (newCert.trim()) {
      setValue('certifications', [...certifications, newCert.trim()], { shouldValidate: true });
      setNewCert('');
    }
  };

  const removeCertification = (index: number) => {
    setValue('certifications', certifications.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const onSubmit = async (data: CaregiverProfileFormData) => {
    setSaving(true);

    const normalizedServicePrices = servicePrices.filter(
      (item) => item.isAvailable && item.pricePerHour > 0,
    );

    const normalizedSpecialties = deriveSpecialtiesFromServices(
      normalizedServicePrices,
    );
    const normalizedAvailability = (availabilityCalendar || [])
      .filter((item) => typeof item?.date === 'string' && item.date.trim().length > 0)
      .map((item) => ({
        date: item.date,
        slots: Array.isArray(item.slots) ? item.slots : [],
        timeRanges: Array.isArray(item.timeRanges) ? item.timeRanges : [],
        isAvailable: item.isAvailable !== false,
      }));

    try {
        const payload = {
        bio: data.bio,
        city: data.city,
        state: data.state,
        hourlyRate: data.hourlyRate,
        experienceYears: data.experienceYears,
        specialties: normalizedSpecialties,
        servicePrices: normalizedServicePrices,
        availabilityCalendar: normalizedAvailability,
        certifications: data.certifications,
        isAvailable: data.isAvailable,
      };

      if (existingId) {
        await api.updateCaregiverProfile(existingId, payload);
      } else {
        const result = await api.createCaregiverProfile(payload);
        setExistingId(result._id);
      }
      toast.success('Perfil salvo com sucesso!', {
        description: 'Seu perfil agora está visível e atualizado para os clientes.',
      });
    } catch (err: any) {
      toast.error('Erro ao salvar perfil', {
        description: err.message || 'Ocorreu um problema ao processar sua solicitação.',
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedServices = serviceTypes.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceType[]>);

  const categoryLabels: Record<string, string> = {
    idoso: 'Cuidado de Idosos',
    pcd: 'Cuidado para PcD',
    enfermagem: 'Enfermagem',
    acompanhamento: 'Acompanhamento',
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-xl" />
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-primary-600" />
              {existingId ? 'Configurações de Perfil' : 'Criar Perfil Profissional'}
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              Mostre seu melhor lado e conquiste novos clientes na plataforma.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/perfil')}
            className="rounded-2xl font-bold gap-2 border-gray-200"
          >
            Voltar ao Perfil
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Bio Section */}
          <Card className="border-none shadow-xl shadow-gray-200/40 rounded-[32px] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Sobre Você</CardTitle>
                  <CardDescription className="text-gray-500 font-medium mt-1">Sua biografia é a primeira coisa que os clientes leem.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sua Biografia Profissional</Label>
                <Textarea
                  {...register('bio')}
                  className={cn(
                    "min-h-[160px] bg-gray-50 border-transparent focus:bg-white rounded-2xl font-medium transition-all text-lg leading-relaxed resize-none",
                    errors.bio && "border-red-500 bg-white ring-4 ring-red-50"
                  )}
                  placeholder="Ex: Sou cuidadora há 10 anos, especializada em idosos com Alzheimer. Amo o que faço e busco sempre o bem-estar dos meus pacientes..."
                />
                {errors.bio && (
                  <p className="text-xs font-bold text-red-500 ml-1">{errors.bio.message}</p>
                )}
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100 mt-4">
                   <Info className="w-5 h-5 flex-shrink-0" />
                   <p className="text-xs font-bold leading-relaxed">
                     Dica: Cuidadores com bios detalhadas e empáticas recebem até <span className="underline">3x mais agendamentos</span>.
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Pricing Section */}
          <Card className="border-none shadow-xl shadow-gray-200/40 rounded-[32px] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Localização e Preço Base</CardTitle>
                  <CardDescription className="text-gray-500 font-medium mt-1">Defina onde você atende e sua taxa base por hora.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cidade de Atendimento</Label>
                  <CityAutocomplete
                    value={formValues.city || ''}
                    onChange={({ city, state }) => {
                      setValue('city', city, { shouldValidate: true });
                      setValue('state', state, { shouldValidate: true });
                    }}
                  />
                  {errors.city && (
                    <p className="text-xs font-bold text-red-500 ml-1">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2.5 opacity-60">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Estado (UF)</Label>
                  <Input
                    type="text"
                    value={formValues.state || ''}
                    readOnly
                    className="h-14 bg-gray-100 border-transparent rounded-2xl font-bold cursor-not-allowed"
                    placeholder="Automático"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Valor Base (R$ / hora)</Label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />
                    <Input
                      type="number"
                      {...register('hourlyRate')}
                      className={cn(
                        "h-14 pl-12 bg-gray-50 border-transparent focus:bg-white rounded-2xl font-black transition-all",
                        errors.hourlyRate && "border-red-500 bg-white ring-4 ring-red-50"
                      )}
                      min={0}
                    />
                  </div>
                  {errors.hourlyRate && (
                    <p className="text-xs font-bold text-red-500 ml-1">{errors.hourlyRate.message}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Anos de Experiência</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    <Input
                      type="number"
                      {...register('experienceYears')}
                      className={cn(
                        "h-14 pl-12 bg-gray-50 border-transparent focus:bg-white rounded-2xl font-bold transition-all",
                        errors.experienceYears && "border-red-500 bg-white ring-4 ring-red-50"
                      )}
                      min={0}
                    />
                  </div>
                  {errors.experienceYears && (
                    <p className="text-xs font-bold text-red-500 ml-1">{errors.experienceYears.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card className="border-none shadow-xl shadow-gray-200/40 rounded-[32px] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                  <StethoscopeIcon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Serviços e Especialidades</CardTitle>
                  <CardDescription className="text-gray-500 font-medium mt-1">Marque os serviços que você oferece e defina seus preços.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-12">
               {/* Specialties Auto-Display */}
               <div className="space-y-4">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Suas Especialidades (Gerado Automaticamente)</Label>
                  {specialties.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">Selecione ao menos um serviço abaixo para identificar suas especialidades.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {specialties.map((spec) => (
                        <Badge
                          key={spec}
                          variant="secondary"
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-5 py-2.5 rounded-2xl text-sm font-black border-none transition-colors"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          {SPECIALTIES[spec] || spec}
                        </Badge>
                      ))}
                    </div>
                  )}
               </div>

               {/* Services Listing */}
               <div className="space-y-10">
                  {Object.entries(groupedServices).map(([category, services]) => (
                    <div key={category} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-0.5 flex-1 bg-gray-100" />
                        <h3 className="text-xs font-black text-primary-600 uppercase tracking-[0.2em] whitespace-nowrap">
                          {categoryLabels[category] || category}
                        </h3>
                        <div className="h-0.5 flex-1 bg-gray-100" />
                      </div>

                      <div className="grid gap-4">
                        {services.map((service) => {
                          const fieldIndex = servicePrices.findIndex(
                            (s) => s.serviceKey === service.key,
                          );
                          const current = fieldIndex !== -1 ? servicePrices[fieldIndex] : null;
                          const isSelected = current?.isAvailable ?? false;

                          return (
                            <div
                              key={service.key}
                              className={cn(
                                "group border-2 rounded-3xl p-6 transition-all duration-300",
                                isSelected 
                                  ? "border-primary-200 bg-primary-50/20 shadow-lg shadow-primary-500/5" 
                                  : "border-gray-100 bg-white hover:border-gray-200"
                              )}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                                <div className="flex-1 flex items-start gap-5">
                                  <Checkbox
                                    id={service.key}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (fieldIndex === -1) {
                                        setValue('servicePrices', [
                                          ...servicePrices,
                                          {
                                            serviceKey: service.key,
                                            pricePerHour: service.suggestedPrice,
                                            isAvailable: !!checked,
                                          },
                                        ]);
                                      } else {
                                        const newPrices = [...servicePrices];
                                        newPrices[fieldIndex] = {
                                          ...newPrices[fieldIndex],
                                          isAvailable: !!checked,
                                        };
                                        setValue('servicePrices', newPrices, { shouldValidate: true });
                                      }
                                    }}
                                    className="h-7 w-7 rounded-lg border-gray-200 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 mt-1"
                                  />

                                  <div className="space-y-2">
                                    <Label htmlFor={service.key} className="text-lg font-black text-gray-900 cursor-pointer block">
                                      {service.name}
                                    </Label>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                      {service.description}
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                         Sugestão: R$ {service.suggestedPrice}/h
                                       </span>
                                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                                         Faixa: R$ {service.basePriceMin} - {service.basePriceMax}/h
                                       </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-full lg:w-56 space-y-2.5">
                                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço do Serviço</Label>
                                  <div className="relative">
                                    <DollarSign className={cn(
                                      "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                                      isSelected ? "text-emerald-500" : "text-gray-300"
                                    )} />
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      disabled={!isSelected}
                                      value={current?.pricePerHour ?? ''}
                                      onChange={(e) => {
                                        const value = Number(e.target.value);
                                        if (fieldIndex !== -1) {
                                          updateServicePrice(fieldIndex, {
                                            ...servicePrices[fieldIndex],
                                            pricePerHour: value,
                                          });
                                        }
                                      }}
                                      className={cn(
                                        "h-12 pl-12 rounded-xl font-black transition-all",
                                        isSelected ? "bg-white border-primary-200" : "bg-gray-50 border-transparent opacity-50"
                                      )}
                                      placeholder={service.suggestedPrice.toString()}
                                    />
                                  </div>
                                </div>
                              </div>

                              {service.requirements?.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requisitos:</span>
                                  {service.requirements.map((req, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-200 bg-amber-50 rounded-lg">
                                      {req}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {errors.servicePrices && (
                    <Alert variant="destructive" className="rounded-3xl bg-red-50 text-red-700 border-red-200 p-6">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="font-black text-lg">Erro na Seleção</AlertTitle>
                      <AlertDescription className="font-bold">
                        {errors.servicePrices.message}
                      </AlertDescription>
                    </Alert>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* Availability Section */}
          <Card className="border-none shadow-xl shadow-gray-200/40 rounded-[32px] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Agenda e Disponibilidade</CardTitle>
                  <CardDescription className="text-gray-500 font-medium mt-1">Defina quais dias você está livre para receber novos atendimentos.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-8">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <AvailabilityCalendar
                  selectedDates={availabilityCalendar}
                  bookedDates={bookedDates}
                  onChange={(dates) =>
                    setValue('availabilityCalendar', dates, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-3 p-6 bg-primary-50/30 rounded-2xl border border-primary-100">
                <Checkbox
                  id="isAvailable"
                  checked={isAvailable}
                  onCheckedChange={(checked) => setValue('isAvailable', !!checked, { shouldValidate: true })}
                  className="h-6 w-6 rounded-lg data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="isAvailable"
                    className="text-base font-bold text-gray-900 cursor-pointer"
                  >
                    Ativar meu perfil para novos atendimentos
                  </Label>
                  <p className="text-xs text-primary-600 font-medium">
                    Se desativado, você não aparecerá nos resultados de busca, mas poderá finalizar agendamentos em curso.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications Section */}
          <Card className="border-none shadow-xl shadow-gray-200/40 rounded-[32px] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Formação e Certificações</CardTitle>
                  <CardDescription className="text-gray-500 font-medium mt-1">Adicione seus cursos, especializações e números de registro profissional.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  <Input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    className="h-14 pl-12 bg-gray-50 border-transparent focus:bg-white rounded-2xl font-medium transition-all"
                    placeholder="Ex: COREN Ativo, Pós em Geriatria..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCertification();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addCertification}
                  className="h-14 px-8 rounded-2xl font-bold bg-gray-900 hover:bg-black gap-2 shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar
                </Button>
              </div>

              {certifications.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {certifications.map((cert, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm font-bold border-none transition-colors group flex items-center gap-2"
                    >
                      {cert}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertification(i)}
                        className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-500 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-20 text-xl font-black rounded-3xl gap-3 shadow-2xl shadow-primary-500/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center gap-3">
                {saving ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />
                )}
                {saving ? 'Salvando Alterações...' : 'Salvar Perfil Profissional'}
              </div>
            </Button>
            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Seus dados estão protegidos por criptografia de ponta a ponta.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
