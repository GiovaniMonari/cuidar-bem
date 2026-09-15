import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Caregiver, CaregiverDocument } from './schemas/caregiver.schema';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { FilterCaregiverDto } from './dto/filter-caregiver.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EmailProducer } from '../queue/email.producer';

const SERVICE_QUALIFICATIONS: Record<string, string[]> = {
  idoso: ['cuidador de idosos', 'gerontologia', 'enfermagem', 'técnico de enfermagem'],
  pcd: ['atendimento a pcd', 'mobilidade e transferência', 'fisioterapia', 'enfermagem'],
  enfermagem: ['graduação em enfermagem', 'técnico de enfermagem', 'enfermagem', 'coren'],
  acompanhamento: ['acompanhante hospitalar', 'acompanhante', 'primeiros socorros', 'enfermagem'],
};

const SERVICE_CATEGORY_BY_KEY: Record<string, string> = {
  cuidado_basico_idoso: 'idoso',
  cuidado_acamado: 'idoso',
  cuidado_alzheimer: 'idoso',
  pernoite_idoso: 'idoso',
  cuidado_pcd_fisico: 'pcd',
  cuidado_pcd_intelectual: 'pcd',
  enfermagem_domiciliar: 'enfermagem',
  pos_operatorio: 'enfermagem',
  acompanhante_consulta: 'acompanhamento',
  acompanhante_hospital: 'acompanhamento',
  acompanhante_passeio: 'acompanhamento',
};
import {
  normalizeAvailabilityCalendar,
  getBookingSegmentsByDate,
  subtractMinuteRanges,
  serializeMinuteRanges,
  timeToMinutes,
} from 'src/common/utils/availability';

@Injectable()
export class CaregiversService {
  private readonly commuteBufferMinutes = 60;

  constructor(
    @InjectModel(Caregiver.name) private caregiverModel: Model<CaregiverDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly emailProducer: EmailProducer,
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
      isAvailable: false,
      userId,
    });
    this.validateServiceQualifications(dto.servicePrices || [], dto.certifications || []);
    return (await caregiver.save()).populate('userId', 'name email phone avatar');
  }

  async findAll(filters: FilterCaregiverDto) {
    const query: any = {
      isAvailable: true,
      'professionalVerification.status': 'approved',
    };

    if (filters.city) {
      query.city = { $regex: filters.city, $options: 'i' };
    }
    if (filters.state) {
      // Suporta sigla (ex: "SP") e nomes completos legados (ex: "São Paulo")
      // usando regex case-insensitive para compatibilidade máxima
      query.state = { $regex: `^${filters.state.trim()}$`, $options: 'i' };
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
        .select('-professionalVerification.documentUrl -professionalVerification.documentPublicId')
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
      .findOne({ _id: id, isAvailable: true, 'professionalVerification.status': 'approved' })
      .select('-professionalVerification.documentUrl -professionalVerification.documentPublicId')
      .populate('userId', 'name email phone avatar');
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');
    return caregiver;
  }

  async findByUserId(userId: string): Promise<CaregiverDocument> {
    const caregivers = await this.caregiverModel.find().populate('userId', 'name email phone avatar');
    const caregiver = caregivers.find(
      (profile) => profile.userId?.toString() === userId,
    );
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

    if (dto.servicePrices || dto.certifications) {
      this.validateServiceQualifications(
        dto.servicePrices || caregiver.servicePrices || [],
        dto.certifications || caregiver.certifications || [],
      );
    }

    if (dto.servicePrices || dto.certifications) {
      updateData.isAvailable = false;
      await this.caregiverModel.findByIdAndUpdate(id, {
        'professionalVerification.status': 'pending',
        'professionalVerification.reviewedAt': undefined,
        'professionalVerification.reviewNotes': undefined,
      });
    } else if (dto.isAvailable && caregiver.professionalVerification?.status !== 'approved') {
      updateData.isAvailable = false;
    }

    return this.caregiverModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('userId', 'name email phone avatar');
  }

  private validateServiceQualifications(
    servicePrices: Array<{ serviceKey: string; isAvailable?: boolean }>,
    certifications: string[],
  ) {
    const offeredCategories = new Set(
      servicePrices
        .filter((service) => service.isAvailable !== false)
        .map((service) => SERVICE_CATEGORY_BY_KEY[service.serviceKey])
        .filter(Boolean),
    );
    const normalizedCertifications = certifications.map((certification) =>
      certification.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
    );

    for (const category of offeredCategories) {
      const matches = (SERVICE_QUALIFICATIONS[category] || []).some((qualification) =>
        normalizedCertifications.some((certification) => certification.includes(
          qualification.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
        )),
      );
      if (!matches) {
        throw new ForbiddenException(
          `Adicione uma formação compatível com os serviços de ${category} selecionados antes de publicar o perfil.`,
        );
      }
    }
  }

  async submitProfessionalVerification(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const caregiver = await this.caregiverModel.findById(id);
    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');
    if (caregiver.userId.toString() !== userId) {
      throw new ForbiddenException('Sem permissão para enviar documentos deste perfil');
    }

    const result: any = await this.cloudinaryService.uploadVerificationDocument(file);
    if (caregiver.professionalVerification?.documentPublicId) {
      await this.cloudinaryService.deleteVerificationDocument(
        caregiver.professionalVerification.documentPublicId,
      );
    }

    caregiver.professionalVerification = {
      status: 'pending',
      documentUrl: result.secure_url,
      documentPublicId: result.public_id,
      submittedAt: new Date(),
      reviewNotes: undefined,
    } as any;
    caregiver.isAvailable = false;
    return (await caregiver.save()).populate('userId', 'name email phone avatar');
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
        current.push({
          start: Math.max(0, segment.start - this.commuteBufferMinutes),
          end: Math.min(1440, segment.end + this.commuteBufferMinutes),
        });
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
