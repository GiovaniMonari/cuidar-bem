import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { careReportSchema, type CareReportFormData } from '@/validations/schemas';
import { api } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseCareReportFormProps {
  bookingId: string;
  serviceKey?: string;
  onSuccess?: () => void;
}

export function useCareReportForm({ bookingId, serviceKey, onSuccess }: UseCareReportFormProps) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [careActivities, setCareActivities] = useState<string[]>([]);
  const [checklistData, setChecklistData] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<string[]>([]);

  const form = useForm<CareReportFormData>({
    resolver: yupResolver(careReportSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      content: '',
      painLevel: 0,
      patientMood: null,
      healthObservations: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => api.createFeedback(payload),
    onSuccess: () => {
      setSuccess(true);
      form.reset();
      setChecklistData({});
      setCareActivities([]);
      setPhotos([]);
      onSuccess?.();
      
      // Invalidate related queries if any (e.g., booking details)
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Erro ao enviar relatório');
    }
  });

  const updateChecklistField = (key: string, value: any) => {
    setChecklistData((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  };

  const updateChecklistDetails = (key: string, details: string) => {
    setChecklistData((prev) => ({ ...prev, [key]: { ...prev[key], details } }));
  };

  const handleAddActivity = (activity: string) => {
    if (activity.trim()) {
      setCareActivities((prev) => [...prev, activity.trim()]);
    }
  };

  const handleRemoveActivity = (index: number) => {
    setCareActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CareReportFormData) => {
    setError('');
    
    const payload: Record<string, any> = {
      bookingId,
      content: data.content,
      serviceType: serviceKey,
    };

    const DETAILS_FIELD_MAPPING: Record<string, string> = {
      tookMedication: 'medicationDetails',
      ate: 'foodDetails',
      hygiene: 'hygieneDetails',
      sleptWell: 'sleepDetails',
      behavior: 'behaviorDetails',
      bathInBed: 'bathInBedDetails',
      positionChange: 'positionChangeDetails',
      skinCondition: 'skinConditionDetails',
      diaperChange: 'diaperChangeDetails',
      cognitiveStimulation: 'cognitiveStimulationDetails',
      orientation: 'orientationDetails',
      agitation: 'agitationDetails',
      wandering: 'wanderingDetails',
      routineFollowed: 'routineFollowedDetails',
      mobility: 'mobilityDetails',
      transfers: 'transfersDetails',
      physiotherapy: 'physiotherapyDetails',
      equipmentUsed: 'equipmentUsedDetails',
      communication: 'communicationDetails',
      sensoryIssues: 'sensoryIssuesDetails',
      therapyActivities: 'therapyActivitiesDetails',
      injectables: 'injectablesDetails',
      dressings: 'dressingsDetails',
      vitalSigns: 'vitalSignsDetails',
      catheterCare: 'catheterCareDetails',
      patientCondition: 'patientConditionDetails',
      complications: 'complicationsDetails',
      appointmentAttended: 'appointmentAttendedDetails',
      prescriptionReceived: 'prescriptionReceivedDetails',
      medicalVisit: 'medicalVisitDetails',
      activityCompleted: 'activityCompletedDetails',
      incidents: 'incidentsDetails',
      bathroomVisits: 'bathroomVisitsDetails',
      hydration: 'hydrationDetails',
    };

    Object.entries(checklistData).forEach(([key, item]) => {
      if (item.value !== undefined && item.value !== null) {
        payload[key] = item.value;
        if (item.details) {
          const detailsFieldName = DETAILS_FIELD_MAPPING[key] || `${key}Details`;
          payload[detailsFieldName] = item.details;
        }
      }
    });

    if (data.painLevel && data.painLevel > 0) payload.painLevel = data.painLevel;
    if (data.patientMood) payload.patientMood = data.patientMood;
    if (data.healthObservations) payload.healthObservations = data.healthObservations;
    if (careActivities.length > 0) payload.careActivities = careActivities;
    if (photos.length > 0) payload.photos = photos;

    mutation.mutate(payload);
  };

  return {
    form,
    loading: mutation.isPending,
    error,
    success,
    careActivities,
    checklistData,
    handleAddActivity,
    handleRemoveActivity,
    updateChecklistField,
    updateChecklistDetails,
    onSubmit,
  };
}
