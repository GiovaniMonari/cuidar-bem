import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { reviewSchema, type ReviewFormData } from '@/validations/schemas';
import { api } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseReviewFormProps {
  caregiverId: string;
  onSuccess?: (newReview: any) => void;
}

export function useReviewForm({ caregiverId, onSuccess }: UseReviewFormProps) {
  const queryClient = useQueryClient();
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: yupResolver(reviewSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      rating: 5,
      comment: '',
    }
  });

  const reviewMutation = useMutation({
    mutationFn: (data: any) => api.createReview(data),
    onSuccess: (newReview) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', caregiverId] });
      queryClient.invalidateQueries({ queryKey: ['caregiver', caregiverId] });
      queryClient.invalidateQueries({ queryKey: ['reviewStatus', caregiverId] });
      
      onSuccess?.(newReview);
      form.reset();
    },
    onError: (error: any) => {
      alert(error.message || 'Erro ao enviar avaliação');
    }
  });

  const onReviewSubmit = async (data: ReviewFormData) => {
    if (!selectedBookingForReview) {
      alert('Por favor, selecione qual atendimento você deseja avaliar.');
      return;
    }

    reviewMutation.mutate({
      caregiverId,
      bookingId: selectedBookingForReview,
      rating: data.rating,
      comment: data.comment,
    });
  };

  return {
    form,
    reviewLoading: reviewMutation.isPending,
    selectedBookingForReview,
    setSelectedBookingForReview,
    onReviewSubmit,
  };
}
