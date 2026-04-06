'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { ServiceType, ServiceDuration, CaregiverServicePrice } from '@/types';
import {
  Heart,
  Accessibility,
  Stethoscope,
  Clock,
  Car,
  Moon,
  Building,
  Brain,
  Bed,
  Syringe,
  Users,
  Check,
  Loader2,
  Tag,
  Percent,
  Timer,
  Calendar,
  CalendarDays,
} from 'lucide-react';

const SERVICE_ICONS: Record<string, any> = {
  heart: Heart,
  accessibility: Accessibility,
  stethoscope: Stethoscope,
  clock: Clock,
  car: Car,
  moon: Moon,
  hospital: Building,
  brain: Brain,
  bed: Bed,
  syringe: Syringe,
  'heart-handshake': Users,
};

const DURATION_ICONS: Record<string, any> = {
  '1h': Timer,
  '2h': Timer,
  'turno': Clock,
  'diaria': Calendar,
  'noite': Moon,
  '24h': Calendar,
  'semanal': CalendarDays,
  'semanal_noite': CalendarDays,
  'mensal': CalendarDays,
  'mensal_noite': CalendarDays,
};

interface ServiceSelectorProps {
  caregiverPrices?: CaregiverServicePrice[];
  defaultPrice?: number;
  onSelect: (data: {
    serviceType: string;
    serviceName: string;
    durationKey: string;
    durationLabel: string;
    durationHours: number;
    pricePerHour: number;
    totalAmount: number;
    discount: number;
  }) => void;
}

export function ServiceSelector({ caregiverPrices = [], defaultPrice = 50, onSelect }: ServiceSelectorProps) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<any | null>(null);
  const [calculation, setCalculation] = useState<any | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.getServiceTypes();
        setServices(data);
      } catch (error) {
        console.error('Erro ao carregar serviços:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getCaregiverPrice = (serviceKey: string) => {
    const price = caregiverPrices?.find((p) => p.serviceKey === serviceKey);
    return price?.isAvailable !== false ? price?.pricePerHour : null;
  };

  const handleSelectService = (service: ServiceType) => {
    setSelectedService(service);
    setSelectedDuration(null);
    setCalculation(null);
  };

  const handleSelectDuration = async (duration: any) => {
    if (!selectedService) return;

    setSelectedDuration(duration);
    setCalculating(true);

    try {
      const pricePerHour = getCaregiverPrice(selectedService.key) || defaultPrice;
      const result = await api.calculateServicePrice(
        selectedService.key,
        duration.key,
        pricePerHour,
      );
      setCalculation(result);

      onSelect({
        serviceType: selectedService.key,
        serviceName: selectedService.name,
        durationKey: duration.key,
        durationLabel: duration.label,
        durationHours: result.hours,
        pricePerHour: result.pricePerHour,
        totalAmount: result.totalAmount,
        discount: result.discount,
      });
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Agrupar por categoria
  const grouped = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceType[]>);

  const categoryLabels: Record<string, { label: string; icon: any }> = {
    idoso: { label: 'Cuidado de Idosos', icon: Heart },
    pcd: { label: 'Cuidado para PcD', icon: Accessibility },
    enfermagem: { label: 'Enfermagem', icon: Stethoscope },
    acompanhamento: { label: 'Acompanhamento', icon: Car },
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Selecionar Serviço */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
            1
          </span>
          Tipo de Serviço
        </h3>

        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryServices]) => {
            const catInfo = categoryLabels[category] || { label: category, icon: Heart };
            const CatIcon = catInfo.icon;
            
            return (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <CatIcon className="w-4 h-4" />
                  {catInfo.label}
                </h4>
                <div className="grid gap-2">
                  {categoryServices.map((service) => {
                    const Icon = SERVICE_ICONS[service.icon] || Heart;
                    const price = getCaregiverPrice(service.key) || service.suggestedPrice;
                    const isSelected = selectedService?.key === service.key;

                    return (
                      <button
                        key={service.key}
                        onClick={() => handleSelectService(service)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              isSelected ? 'bg-primary-100' : 'bg-gray-100'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected ? 'text-primary-600' : 'text-gray-500'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-semibold text-gray-900 text-sm">
                                {service.name}
                              </h5>
                              <span className="text-primary-600 font-bold text-sm flex-shrink-0">
                                R$ {price}/h
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Selecionar Duração */}
      {selectedService && (
        <div className="animate-fade-in">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            Duração do Atendimento
          </h3>

          {/* Serviço selecionado */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-primary-600" />
              <span className="font-semibold text-gray-900 text-sm">
                {selectedService.name}
              </span>
            </div>
            
            {selectedService.includes.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">O que está incluído:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedService.includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opções de duração */}
          <div className="grid gap-2">
            {selectedService.durations.map((duration: any) => {
              const pricePerHour = getCaregiverPrice(selectedService.key) || defaultPrice;
              const baseTotal = pricePerHour * duration.hours;
              const discountAmount = baseTotal * (1 - duration.multiplier);
              const finalPrice = baseTotal - discountAmount;
              const discountPercent = Math.round((1 - duration.multiplier) * 100);
              const isSelected = selectedDuration?.key === duration.key;
              const DurationIcon = DURATION_ICONS[duration.key] || Clock;

              return (
                <button
                  key={duration.key}
                  onClick={() => handleSelectDuration(duration)}
                  disabled={calculating}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                  } ${calculating ? 'opacity-50' : ''}`}
                >
                  {/* Badge de desconto */}
                  {discountPercent > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      <Percent className="w-3 h-3" />
                      {discountPercent}% OFF
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isSelected ? 'bg-primary-100' : 'bg-gray-100'
                      }`}
                    >
                      <DurationIcon
                        className={`w-5 h-5 ${
                          isSelected ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {duration.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({duration.hours}h)
                        </span>
                      </div>
                      {duration.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {duration.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {discountPercent > 0 && (
                        <span className="text-xs text-gray-400 line-through block">
                          R$ {baseTotal.toFixed(0)}
                        </span>
                      )}
                      <span className="text-primary-600 font-bold">
                        R$ {finalPrice.toFixed(0)}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Resumo */}
      {calculation && (
        <div className="animate-fade-in bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-5 border border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
              ✓
            </span>
            Resumo do Serviço
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Serviço</span>
              <span className="font-medium text-gray-900">{calculation.service.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duração</span>
              <span className="font-medium text-gray-900">
                {calculation.duration.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Horas totais</span>
              <span className="font-medium text-gray-900">{calculation.hours}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor/hora</span>
              <span className="font-medium text-gray-900">
                R$ {calculation.pricePerHour.toFixed(2)}
              </span>
            </div>
            
            {calculation.discount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-500">
                    R$ {calculation.baseTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Desconto ({calculation.discountPercent}%)
                  </span>
                  <span className="font-medium">- R$ {calculation.discount.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="border-t border-primary-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-bold text-2xl text-primary-600">
                  R$ {calculation.totalAmount.toFixed(2)}
                </span>
              </div>
              {calculation.discount > 0 && (
                <p className="text-xs text-green-600 text-right mt-1">
                  Você economiza R$ {calculation.discount.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}