import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { bookingFormSchema, type BookingFormData } from '@/validations/schemas';
import { 
  getAvailableStartTimes, 
  getComputedEndDateTime, 
  isHourlyDuration, 
  isMultiDayDuration,
  combineDateAndTime
} from '@/utils/booking';
import { getDatesInRange } from '@/utils/dateRange';
import { api } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseBookingFormProps {
  caregiverId: string;
  availableDates: any[];
  user: any;
  onSuccess?: () => void;
}

export function useBookingForm({ caregiverId, availableDates, user, onSuccess }: UseBookingFormProps) {
  const queryClient = useQueryClient();
  const [bookingError, setBookingError] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');
  const [isRangeAvailable, setIsRangeAvailable] = useState(true);
  const [isAddressValidated, setIsAddressValidated] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    serviceType: '',
    serviceName: '',
    durationKey: '',
    durationLabel: '',
    durationHours: 0,
    pricePerHour: 0,
    totalAmount: 0,
    discount: 0,
  });

  const form = useForm<BookingFormData>({
    resolver: yupResolver(bookingFormSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      notes: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      fullAddress: '',
      lat: '',
      lon: '',
      patientName: '',
      patientAge: '',
      patientCondition: '',
      serviceType: '',
      durationKey: '',
    },
  });

  const { watch, setValue, reset } = form;
  const values = watch();

  // Mutation
  const bookingMutation = useMutation({
    mutationFn: (payload: any) => api.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookedDates', caregiverId] });
      queryClient.invalidateQueries({ queryKey: ['availability', caregiverId] });
      queryClient.invalidateQueries({ queryKey: ['chatStatus', caregiverId] });
      
      onSuccess?.();
      reset();
      setBookingData({
        serviceType: '',
        serviceName: '',
        durationKey: '',
        durationLabel: '',
        durationHours: 0,
        pricePerHour: 0,
        totalAmount: 0,
        discount: 0,
      });
      setIsAddressValidated(false);
    },
    onError: (error: any) => {
      setBookingError(error.message || 'Erro ao criar agendamento');
    }
  });

  // Memos for hourly booking
  const hourlyDateOptions = useMemo(
    () =>
      availableDates
        .filter((item) => item.isAvailable)
        .filter(
          (item) =>
            getAvailableStartTimes(
              availableDates,
              item.date,
              bookingData.durationHours,
            ).length > 0,
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [availableDates, bookingData.durationHours],
  );

  const availableStartTimes = useMemo(
    () =>
      values.startDate
        ? getAvailableStartTimes(
            availableDates,
            values.startDate,
            bookingData.durationHours,
          )
        : [],
    [availableDates, bookingData.durationHours, values.startDate],
  );

  const availableStartTimesOnHour = useMemo(
    () => availableStartTimes.filter((time) => time.endsWith(':00')),
    [availableStartTimes],
  );

  const computedHourlyEnd = useMemo(
    () =>
      getComputedEndDateTime(
        values.startDate,
        values.startTime!,
        bookingData.durationHours,
      ),
    [bookingData.durationHours, values.startDate, values.startTime],
  );

  // Validation logic
  const validateDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      setDateRangeError('');
      setIsRangeAvailable(true);
      return true;
    }

    const allDates = getDatesInRange(startDate, endDate);
    const availableDateStrings = availableDates
      .filter((item) => item.isAvailable)
      .map((item) => item.date);

    const unavailableDates = allDates.filter((date) => !availableDateStrings.includes(date));

    if (unavailableDates.length > 0) {
      const formatted = unavailableDates
        .slice(0, 5)
        .map((date) => new Date(date + 'T00:00:00').toLocaleDateString('pt-BR'))
        .join(', ');

      setDateRangeError(
        `O cuidador não possui disponibilidade em todo o período. Datas indisponíveis: ${formatted}${unavailableDates.length > 5 ? '...' : ''}`,
      );
      setIsRangeAvailable(false);
      return false;
    }

    setDateRangeError('');
    setIsRangeAvailable(true);
    return true;
  };

  // Sync end time for hourly
  useEffect(() => {
    if (!isHourlyDuration(bookingData.durationKey)) return;

    if (!values.startDate) {
      if (values.startTime || values.endTime) {
        setValue('startTime', '');
        setValue('endTime', '');
      }
      return;
    }

    if (values.startTime && !availableStartTimesOnHour.includes(values.startTime)) {
      setValue('startTime', '');
      setValue('endTime', '');
      return;
    }

    const nextEndTime = computedHourlyEnd?.endTime ?? '';
    const nextEndDate = computedHourlyEnd?.endDate ?? '';

    if (
      values.startTime &&
      (values.endTime !== nextEndTime || values.endDate !== nextEndDate)
    ) {
      setValue('endTime', nextEndTime);
      setValue('endDate', nextEndDate);
    }
  }, [availableStartTimesOnHour, bookingData.durationKey, values.startDate, values.startTime, computedHourlyEnd]);

  // Handle service change
  useEffect(() => {
    const serviceType = bookingData.serviceType;
    if (serviceType === 'cuidado_pcd_intelectual') {
      setValue('patientCondition', 'TEA / Deficiência Intelectual');
    } else if (serviceType === 'cuidado_pcd_fisico') {
      setValue('patientCondition', 'Deficiência Física');
    } else if (serviceType === 'cuidado_alzheimer') {
      setValue('patientCondition', 'Alzheimer / Demência');
    } else if (serviceType === 'cuidado_acamado') {
      setValue('patientCondition', 'Acamado');
    } else if (serviceType === 'cuidado_basico_idoso') {
      setValue('patientCondition', '');
    }
  }, [bookingData.serviceType, setValue]);

  const handleBookingSubmit = async (data: BookingFormData) => {
    setBookingError('');
    if (bookingMutation.isPending) return;

    if (!user?.phone) {
      setBookingError('Por favor, complete seu telefone no perfil antes de solicitar atendimento.');
      return;
    }

    if (!isAddressValidated) {
      setBookingError('Clique em "Validar endereço" antes de solicitar o atendimento.');
      return;
    }

    let finalStartDate = '';
    let finalEndDate = '';

    if (isHourlyDuration(bookingData.durationKey)) {
      if (!data.startDate || !data.startTime || !computedHourlyEnd) {
        setBookingError('Selecione a data e o horário de início.');
        return;
      }
      finalStartDate = combineDateAndTime(data.startDate, data.startTime);
      finalEndDate = combineDateAndTime(computedHourlyEnd.endDate, computedHourlyEnd.endTime);
    } else {
      if (!data.startDate || !data.endDate) {
        setBookingError('Selecione a data de início e a data de término.');
        return;
      }
      finalStartDate = `${data.startDate}T08:00:00`;
      finalEndDate = `${data.endDate}T23:59:59`;
    }

    bookingMutation.mutate({
      caregiverId,
      serviceType: data.serviceType,
      serviceName: bookingData.serviceName,
      durationKey: data.durationKey,
      durationLabel: bookingData.durationLabel,
      durationHours: bookingData.durationHours,
      pricePerHour: bookingData.pricePerHour,
      totalAmount: bookingData.totalAmount,
      discount: bookingData.discount,
      startDate: finalStartDate,
      endDate: finalEndDate,
      notes: data.notes,
      clientName: user?.name,
      clientPhone: user?.phone,
      address: data.fullAddress || data.address,
      addressLat: Number(data.lat),
      addressLon: Number(data.lon),
      patientName: data.patientName,
      patientAge: data.patientAge ? Number(data.patientAge) : undefined,
      patientCondition: data.patientCondition,
    });
  };

  return {
    form,
    bookingData,
    setBookingData,
    bookingLoading: bookingMutation.isPending,
    bookingError,
    setBookingError,
    dateRangeError,
    isRangeAvailable,
    isAddressValidated,
    setIsAddressValidated,
    hourlyDateOptions,
    availableStartTimesOnHour,
    computedHourlyEnd,
    validateDateRange,
    handleBookingSubmit,
  };
}
