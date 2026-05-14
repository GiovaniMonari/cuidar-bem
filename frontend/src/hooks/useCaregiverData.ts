import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Caregiver, Review, AvailabilityDate } from '@/types';

interface UseCaregiverDataOptions {
  loadAvailability?: boolean;
}

export function useCaregiverData(
  caregiverId: string,
  user: any,
  isAuthenticated: boolean,
  options: UseCaregiverDataOptions = {},
) {
  const { loadAvailability = false } = options;
  const queryClient = useQueryClient();

  // Queries
  const caregiverQuery = useQuery({
    queryKey: ['caregiver', caregiverId],
    queryFn: () => api.getCaregiver(caregiverId),
    enabled: !!caregiverId,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', caregiverId],
    queryFn: () => api.getReviews(caregiverId),
    enabled: !!caregiverId,
  });

  const availabilityQuery = useQuery({
    queryKey: ['availability', caregiverId],
    queryFn: () => api.getCaregiverAvailability(caregiverId),
    enabled: !!caregiverId && loadAvailability,
  });

  const bookedDatesQuery = useQuery({
    queryKey: ['bookedDates', caregiverId],
    queryFn: () => api.getCaregiverBookedDates(caregiverId),
    enabled: !!caregiverId && loadAvailability,
  });

  const reviewStatusQuery = useQuery({
    queryKey: ['reviewStatus', caregiverId, user?._id],
    queryFn: () => api.canReviewCaregiver(caregiverId),
    enabled: !!caregiverId && isAuthenticated && user?.role === 'client',
  });

  const chatStatusQuery = useQuery({
    queryKey: ['chatStatus', caregiverId, user?._id],
    queryFn: async () => {
      const bookings = await api.getMyBookings();
      const relatedBooking = bookings.find((booking: any) => {
        const cId = typeof booking.caregiverId === 'string' 
          ? booking.caregiverId 
          : booking.caregiverId?._id;
        
        const isActiveStatus = ['pending', 'confirmed', 'in_progress'].includes(booking.status);
        return String(cId) === String(caregiverId) && isActiveStatus;
      });
      return relatedBooking || null;
    },
    enabled: !!caregiverId && isAuthenticated && user?.role === 'client',
  });

  // Helper methods to update cache manually (equivalent to previous setters)
  const setCaregiver = (data: Caregiver) => {
    queryClient.setQueryData(['caregiver', caregiverId], data);
  };

  const setReviews = (updater: (prev: Review[]) => Review[]) => {
    queryClient.setQueryData(['reviews', caregiverId], updater);
  };

  const setCanReview = (can: boolean) => {
    queryClient.setQueryData(['reviewStatus', caregiverId, user?._id], (prev: any) => ({ ...prev, canReview: can }));
  };

  const setReviewableBookings = (bookings: any[]) => {
    queryClient.setQueryData(['reviewStatus', caregiverId, user?._id], (prev: any) => ({ ...prev, bookings }));
  };

  const availabilityLoading =
    loadAvailability &&
    (availabilityQuery.isLoading || bookedDatesQuery.isLoading);

  return {
    caregiver: caregiverQuery.data as Caregiver | null,
    setCaregiver,
    reviews: (reviewsQuery.data || []) as Review[],
    reviewsLoading: reviewsQuery.isLoading,
    setReviews,
    availableDates: (availabilityQuery.data || []) as AvailabilityDate[],
    bookedDates: (bookedDatesQuery.data || []) as string[],
    availabilityLoading,
    loading: caregiverQuery.isLoading,
    canReview: !!reviewStatusQuery.data?.canReview,
    setCanReview,
    reviewableBookings: (reviewStatusQuery.data?.bookings || []) as any[],
    setReviewableBookings,
    canChat: !!chatStatusQuery.data,
    chatBookingId: chatStatusQuery.data?._id || null,
    refreshAvailability: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', caregiverId] });
      queryClient.invalidateQueries({ queryKey: ['bookedDates', caregiverId] });
    },
    refetchReviewStatus: () => queryClient.invalidateQueries({ queryKey: ['reviewStatus', caregiverId, user?._id] }),
  };
}
