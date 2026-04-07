import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Caregiver, CaregiverDocument } from './schemas/caregiver.schema';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { FilterCaregiverDto } from './dto/filter-caregiver.dto';

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
    const caregiver = new this.caregiverModel({ ...dto, userId });
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
    return this.caregiverModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('userId', 'name email phone avatar');
  }

  async updateRating(caregiverId: string, newRating: number) {
    const caregiver = await this.caregiverModel.findById(caregiverId);
    if (!caregiver) return;

    const totalRating = caregiver.rating * caregiver.reviewCount + newRating;
    caregiver.reviewCount += 1;
    caregiver.rating = Math.round((totalRating / caregiver.reviewCount) * 10) / 10;
    await caregiver.save();
  }

    async getAvailability(id: string) {
    const caregiver = await this.caregiverModel.findById(id).select('availabilityCalendar');
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');
    return caregiver.availabilityCalendar || [];
  }
}