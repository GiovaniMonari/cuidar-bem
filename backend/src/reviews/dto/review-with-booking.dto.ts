// dto/review-with-booking.dto.ts
export class ReviewWithBookingDto {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  booking: {
    _id: string;
    startDate: string;
    endDate: string;
    contractedBy: {
      _id: string;
      name: string;
      avatar?: string;
    };
  };
}