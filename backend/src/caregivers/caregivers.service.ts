import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Caregiver, CaregiverDocument } from './schemas/caregiver.schema';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { FilterCaregiverDto } from './dto/filter-caregiver.dto';
import {
  normalizeAvailabilityCalendar,
  getBookingSegmentsByDate,
  subtractMinuteRanges,
  serializeMinuteRanges,
  timeToMinutes,
} from 'src/common/utils/availability';

@Injectable()
export class CaregiversService {
  constructor(
    @InjectModel(Caregiver.name) private caregiverModel: Model<CaregiverDocument>,
  ) {}

  async create(userId: string, dto: CreateCaregiverDto): Promise<CaregiverDocument> {
    const existing = await this.caregiverModel.findOne({ userId });
    if (existing) {
      throw new ForbiddenException('Perfil de cuidador já existe');
    }
    const caregiver = new this.caregiverModel({
      ...dto,
      availabilityCalendar: normalizeAvailabilityCalendar(
        dto.availabilityCalendar || [],
      ),
      userId,
    });
    return (await caregiver.save()).populate('userId', 'name email phone avatar');
  }

  async findAll(filters: FilterCaregiverDto) {
    const query: any = { isAvailable: true };

    if (filters.city) {
      query.city = { $regex: filters.city, $options: 'i' };
    }
    if (filters.state) {
      query.state = filters.state.toUpperCase();
    }
    if (filters.specialty) {
      query.specialties = { $in: [filters.specialty] };
    }
    if (filters.minRate || filters.maxRate) {
      query.hourlyRate = {};
      if (filters.minRate) query.hourlyRate.$gte = filters.minRate;
      if (filters.maxRate) query.hourlyRate.$lte = filters.maxRate;
    }
    if (filters.minRating) {
      query.rating = { $gte: filters.minRating };
    }
    if (filters.minExperience) {
      query.experienceYears = { $gte: filters.minExperience };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const [caregivers, total] = await Promise.all([
      this.caregiverModel
        .find(query)
        .populate('userId', 'name email phone avatar')
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(limit),
      this.caregiverModel.countDocuments(query),
    ]);

    return {
      data: caregivers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CaregiverDocument> {
    const caregiver = await this.caregiverModel
      .findById(id)
      .populate('userId', 'name email phone avatar');
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');
    return caregiver;
  }

  async findByUserId(userId: string): Promise<CaregiverDocument> {
    const caregiver = await this.caregiverModel
      .findOne({ userId })
      .populate('userId', 'name email phone avatar');
    if (!caregiver) throw new NotFoundException('Perfil de cuidador não encontrado');
    return caregiver;
  }

  async update(id: string, userId: string, dto: Partial<CreateCaregiverDto>) {
    const caregiver = await this.caregiverModel.findById(id);
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');
    if (caregiver.userId.toString() !== userId) {
      throw new ForbiddenException('Sem permissão para editar este perfil');
    }
    const updateData = { ...dto } as Partial<CreateCaregiverDto>;

    if (dto.availabilityCalendar) {
      updateData.availabilityCalendar = normalizeAvailabilityCalendar(
        dto.availabilityCalendar,
      );
    }

    return this.caregiverModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('userId', 'name email phone avatar');
  }

  async updateRating(caregiverId: string, avgRating: number, reviewCount?: number) {
    const updateData: any = { rating: avgRating };
    
    if (reviewCount !== undefined) {
      updateData.reviewCount = reviewCount;
    }

    return this.caregiverModel.findByIdAndUpdate(
      caregiverId,
      updateData,
      { new: true }
    );
  }

  async getAvailability(id: string) {
    const caregiver = await this.caregiverModel
      .findById(id)
      .select('availabilityCalendar');
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');

    const bookingModelAny: any = this.caregiverModel.db.model('Booking');

    const activeBookings = await bookingModelAny.find({
      caregiverId: id,
      status: { $in: ['confirmed', 'in_progress'] },
    }).select('startDate endDate');

    const normalizedAvailability = normalizeAvailabilityCalendar(
      caregiver.availabilityCalendar || [],
    );

    const bookedRangesByDate = new Map<
      string,
      Array<{ start: number; end: number }>
    >();

    activeBookings.forEach((booking: any) => {
      getBookingSegmentsByDate(
        new Date(booking.startDate),
        new Date(booking.endDate),
      ).forEach((segment) => {
        const current = bookedRangesByDate.get(segment.date) || [];
        current.push({ start: segment.start, end: segment.end });
        bookedRangesByDate.set(segment.date, current);
      });
    });

    return normalizedAvailability
      .filter((item) => item.isAvailable)
      .map((item) => {
        const remainingRanges = subtractMinuteRanges(
          (item.timeRanges || []).map((range) => ({
            start: timeToMinutes(range.startTime),
            end: range.endTime === '23:59' ? 1440 : timeToMinutes(range.endTime),
          })),
          bookedRangesByDate.get(item.date) || [],
        );

        return {
          ...item,
          timeRanges: serializeMinuteRanges(remainingRanges),
        };
      })
      .filter((item) => item.timeRanges.length > 0);
  }

  async getBookedDates(id: string) {
    const caregiver = await this.caregiverModel
      .findById(id)
      .select('availabilityCalendar');
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');

    const normalizedAvailability = normalizeAvailabilityCalendar(
      caregiver.availabilityCalendar || [],
    ).filter((item) => item.isAvailable);

    const remainingAvailability = await this.getAvailability(id);
    const remainingDates = new Set(
      remainingAvailability.map((item: any) => item.date),
    );

    return normalizedAvailability
      .filter((item) => !remainingDates.has(item.date))
      .map((item) => item.date);
  }

  async getCaregiverBookings(id: string) {
    const caregiver = await this.caregiverModel.findById(id);
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');

    const bookingModelAny: any = this.caregiverModel.db.model('Booking');

    return await bookingModelAny
      .find({
        caregiverId: id,
        status: { $in: ['confirmed', 'in_progress', 'completed'] },
      })
      .select('startDate endDate status')
      .sort({ startDate: -1 })
      .exec();
  }
}
