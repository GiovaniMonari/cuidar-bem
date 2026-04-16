import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import {
  Conversation,
  ConversationDocument,
} from '../chat/schemas/conversation.schema';
import { Message, MessageDocument } from '../chat/schemas/message.schema';
import {
  Feedback,
  FeedbackDocument,
} from '../feedback/schemas/feedback.schema';
import {
  Caregiver,
  CaregiverDocument,
} from '../caregivers/schemas/caregiver.schema';
import { CreatePlatformReportDto } from './dto/create-platform-report.dto';
import { ReviewPlatformReportDto } from './dto/review-platform-report.dto';
import { UpdateUserModerationDto } from './dto/update-user-moderation.dto';
import {
  AdminActionLog,
  AdminActionLogDocument,
} from './schemas/admin-action-log.schema';
import {
  PlatformReport,
  PlatformReportDocument,
} from './schemas/platform-report.schema';

type ModerationAction = 'none' | 'watchlist' | 'ban' | 'dismiss' | 'unban';
type UserAction = 'ban' | 'unban' | 'watchlist' | 'clear_watch';

const WATCHLIST_THRESHOLD = 2;
const BAN_THRESHOLD = 4;
const LOOKBACK_DAYS = 60;
const RECENT_ACTIVITY_DAYS = 14;
const ONLINE_WINDOW_MINUTES = 5;

const REASON_LABELS: Record<string, string> = {
  inappropriate_behavior: 'Comportamento inadequado',
  delay_or_no_show: 'Atraso ou não comparecimento',
  offensive_language: 'Linguagem ofensiva',
  fraud_attempt: 'Tentativa de fraude',
  other: 'Outro',
};

const SOURCE_LABELS: Record<string, string> = {
  chat: 'Chat em tempo real',
  service: 'Fluxo pós-serviço',
};

const REASON_WEIGHTS: Record<string, number> = {
  inappropriate_behavior: 1.2,
  delay_or_no_show: 1,
  offensive_language: 1.1,
  fraud_attempt: 1.8,
  other: 0.9,
};

@Injectable()
export class ModerationService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Caregiver.name)
    private readonly caregiverModel: Model<CaregiverDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(PlatformReport.name)
    private readonly platformReportModel: Model<PlatformReportDocument>,
    @InjectModel(AdminActionLog.name)
    private readonly adminActionLogModel: Model<AdminActionLogDocument>,
  ) {}

  async createReport(
    dto: CreatePlatformReportDto,
    reporterId: string,
    reporterRole: string,
  ) {
    if (!['client', 'caregiver'].includes(reporterRole)) {
      throw new ForbiddenException('Apenas clientes e cuidadores podem enviar reportagens');
    }

    const resolvedContext = await this.resolveReportContext(dto, reporterId, reporterRole);
    const reporterObjectId = new Types.ObjectId(reporterId);
    const reportedObjectId = new Types.ObjectId(resolvedContext.reportedUserId);

    const duplicateQuery: FilterQuery<PlatformReportDocument> = {
      reporterId: reporterObjectId,
      reportedUserId: reportedObjectId,
      source: dto.source,
      reason: dto.reason,
      status: { $ne: 'dismissed' },
      createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    };

    if (resolvedContext.bookingId) {
      duplicateQuery.bookingId = new Types.ObjectId(resolvedContext.bookingId);
    }

    if (resolvedContext.conversationId) {
      duplicateQuery.conversationId = new Types.ObjectId(resolvedContext.conversationId);
    }

    const duplicate = await this.platformReportModel.findOne(duplicateQuery);
    if (duplicate) {
      throw new BadRequestException(
        'Você já enviou uma reportagem semelhante recentemente para este contexto',
      );
    }

    const report = await this.platformReportModel.create({
      bookingId: resolvedContext.bookingId
        ? new Types.ObjectId(resolvedContext.bookingId)
        : undefined,
      conversationId: resolvedContext.conversationId
        ? new Types.ObjectId(resolvedContext.conversationId)
        : undefined,
      reporterId: reporterObjectId,
      reportedUserId: reportedObjectId,
      source: dto.source,
      reason: dto.reason,
      description: dto.description?.trim() || undefined,
      status: 'pending',
      autoAction: 'none',
      severityScore: 0,
      moderationSnapshot: {},
      resolvedAction: 'none',
    });

    const moderationResult = await this.evaluateAutomatedModeration(report);
    report.autoAction = moderationResult.recommendedAction;
    report.severityScore = moderationResult.score;
    report.moderationSnapshot = moderationResult.snapshot;
    await report.save();

    return this.getReportSummary(report._id.toString());
  }

  async getDashboard() {
    const now = new Date();
    const onlineThreshold = new Date(
      now.getTime() - ONLINE_WINDOW_MINUTES * 60 * 1000,
    );
    const reportsWindow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const activityWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      caregivers,
      clients,
      admins,
      banned,
      watchlist,
      onlineUsers,
      inProgressServices,
      completedServices,
      recentReports,
      recentCompletedServices,
      pendingReports,
      pendingReviewRequests,
      topReasonsRaw,
      usersGrowth,
      servicesGrowth,
      reportsGrowth,
      flaggedUsers,
      activeUsers,
      latestLogs,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: 'caregiver' }),
      this.userModel.countDocuments({ role: 'client' }),
      this.userModel.countDocuments({ role: 'admin' }),
      this.userModel.countDocuments({ moderationStatus: 'banned' }),
      this.userModel.countDocuments({ moderationStatus: 'watchlist' }),
      this.userModel.countDocuments({
        isOnline: true,
        lastSeenAt: { $gte: onlineThreshold },
      }),
      this.bookingModel.countDocuments({ status: 'in_progress' }),
      this.bookingModel.countDocuments({ status: 'completed' }),
      this.platformReportModel.countDocuments({ createdAt: { $gte: reportsWindow } }),
      this.bookingModel.countDocuments({
        status: 'completed',
        updatedAt: { $gte: reportsWindow },
      }),
      this.platformReportModel.countDocuments({ status: 'pending' }),
      this.userModel.countDocuments({ reviewRequestStatus: 'pending' }),
      this.platformReportModel.aggregate([
        { $match: { createdAt: { $gte: reportsWindow } } },
        { $group: { _id: '$reason', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      this.buildDailyGrowth(this.userModel, 'createdAt', 7),
      this.buildDailyGrowth(this.bookingModel, 'createdAt', 7),
      this.buildDailyGrowth(this.platformReportModel, 'createdAt', 7),
      this.userModel
        .find({
          moderationStatus: { $in: ['watchlist', 'banned'] },
        })
        .select('name email role moderationStatus moderationReason banReason lastModerationAt')
        .sort({ lastModerationAt: -1, updatedAt: -1 })
        .limit(6)
        .lean(),
      this.userModel
        .find({ lastSeenAt: { $gte: activityWindow } })
        .select('name role lastSeenAt moderationStatus')
        .sort({ lastSeenAt: -1 })
        .limit(8)
        .lean(),
      this.adminActionLogModel
        .find()
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const recentReportRate = recentCompletedServices
      ? Number(((recentReports / recentCompletedServices) * 100).toFixed(1))
      : recentReports > 0
      ? 100
      : 0;

    return {
      metrics: {
        caregivers,
        clients,
        admins,
        onlineUsers,
        banned,
        watchlist,
        inProgressServices,
        completedServices,
        recentReportRate,
        pendingReports,
        pendingReviewRequests,
      },
      growth: {
        users: usersGrowth,
        services: servicesGrowth,
        reports: reportsGrowth,
      },
      topReasons: topReasonsRaw.map((item) => ({
        key: item._id,
        label: REASON_LABELS[item._id] || item._id,
        total: item.total,
      })),
      flaggedUsers,
      activeUsers,
      notifications: this.buildNotifications({
        pendingReports,
        recentReports,
        recentReportRate,
        pendingReviewRequests,
        onlineUsers,
        flaggedUsersCount: watchlist + banned,
      }),
      logs: latestLogs,
      refreshWindowSeconds: 20,
    };
  }

  async listUsers(search?: string, role?: string, status?: string): Promise<any[]> {
    const query: FilterQuery<UserDocument> = {};

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    if (role && ['client', 'caregiver', 'admin'].includes(role)) {
      query.role = role;
    }

    if (status && ['active', 'watchlist', 'banned'].includes(status)) {
      query.moderationStatus = status;
    }

    const users = await this.userModel
      .find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((user) => user._id);
    const [receivedAgg, filedAgg, caregivers] = await Promise.all([
      this.platformReportModel.aggregate([
        { $match: { reportedUserId: { $in: userIds } } },
        {
          $group: {
            _id: '$reportedUserId',
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
              },
            },
          },
        },
      ]),
      this.platformReportModel.aggregate([
        { $match: { reporterId: { $in: userIds } } },
        { $group: { _id: '$reporterId', total: { $sum: 1 } } },
      ]),
      this.caregiverModel.find({ userId: { $in: userIds } }).select('userId').lean(),
    ]);

    const bookingCounts = await this.bookingModel.aggregate([
      {
        $match: {
          $or: [
            { clientId: { $in: userIds } },
            { caregiverId: { $in: caregivers.map((caregiver) => caregiver._id) } },
          ],
        },
      },
      {
        $group: {
          _id: {
            clientId: '$clientId',
            caregiverId: '$caregiverId',
            status: '$status',
          },
          total: { $sum: 1 },
        },
      },
    ]);

    const receivedMap = new Map(
      receivedAgg.map((item) => [item._id.toString(), item]),
    );
    const filedMap = new Map(filedAgg.map((item) => [item._id.toString(), item]));

    const caregiverUserMap = new Map(
      caregivers.map((caregiver) => [caregiver._id.toString(), caregiver.userId.toString()]),
    );

    const serviceTotals = new Map<
      string,
      { activeServices: number; completedServices: number }
    >();

    for (const booking of bookingCounts) {
      const statusKey = booking._id.status;
      const isActiveService = ['pending', 'confirmed', 'in_progress'].includes(statusKey);
      const clientId = booking._id.clientId?.toString?.();
      const caregiverUserId = caregiverUserMap.get(
        booking._id.caregiverId?.toString?.() || '',
      );

      if (clientId) {
        const current = serviceTotals.get(clientId) || {
          activeServices: 0,
          completedServices: 0,
        };
        if (isActiveService) current.activeServices += booking.total;
        if (statusKey === 'completed') current.completedServices += booking.total;
        serviceTotals.set(clientId, current);
      }

      if (caregiverUserId) {
        const current = serviceTotals.get(caregiverUserId) || {
          activeServices: 0,
          completedServices: 0,
        };
        if (isActiveService) current.activeServices += booking.total;
        if (statusKey === 'completed') current.completedServices += booking.total;
        serviceTotals.set(caregiverUserId, current);
      }
    }

    return users.map((user) => {
      const received = receivedMap.get(user._id.toString());
      const filed = filedMap.get(user._id.toString());
      const totals = serviceTotals.get(user._id.toString()) || {
        activeServices: 0,
        completedServices: 0,
      };

      return {
        ...user,
        isOnlineNow:
          Boolean(user.isOnline) &&
          Boolean(
            user.lastSeenAt &&
              new Date(user.lastSeenAt) >=
                new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000),
          ),
        receivedReports: received?.total || 0,
        pendingReceivedReports: received?.pending || 0,
        filedReports: filed?.total || 0,
        activeServices: totals.activeServices,
        completedServices: totals.completedServices,
      };
    });
  }

  async getUserDetail(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').lean();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const caregiverProfile =
      user.role === 'caregiver'
        ? await this.caregiverModel
            .findOne({ userId: user._id })
            .select(
              'bio city state experienceYears specialties rating reviewCount certifications',
            )
            .lean()
        : null;

    const reportsReceived = await this.platformReportModel
      .find({ reportedUserId: user._id })
      .populate('reporterId', 'name email role avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const reportsFiled = await this.platformReportModel
      .find({ reporterId: user._id })
      .populate('reportedUserId', 'name email role avatar moderationStatus')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const caregiver =
      user.role === 'caregiver'
        ? await this.caregiverModel.findOne({ userId: user._id }).lean()
        : null;

    const bookingQuery =
      user.role === 'caregiver' && caregiver
        ? { caregiverId: caregiver._id }
        : { clientId: user._id };

    const bookings = await this.bookingModel
      .find(bookingQuery)
      .populate('clientId', 'name email phone avatar role')
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const messages = await this.messageModel
      .find({ senderId: user._id })
      .populate({
        path: 'conversationId',
        populate: [
          { path: 'clientId', select: 'name email role' },
          { path: 'caregiverUserId', select: 'name email role' },
          { path: 'bookingId', select: 'serviceName status startDate endDate' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const activity = [
      ...bookings.map((booking) => ({
        id: booking._id.toString(),
        kind: 'service',
        timestamp: (booking as any).updatedAt || (booking as any).createdAt,
        title: booking.serviceName || booking.serviceType,
        description: `Status ${booking.status}`,
      })),
      ...messages.map((message) => ({
        id: message._id.toString(),
        kind: 'chat',
        timestamp: (message as any).createdAt,
        title: 'Mensagem enviada',
        description: message.content,
      })),
      ...reportsReceived.map((report) => ({
        id: report._id.toString(),
        kind: 'report_received',
        timestamp: (report as any).createdAt,
        title: REASON_LABELS[report.reason] || report.reason,
        description: `Reportagem recebida via ${SOURCE_LABELS[report.source] || report.source}`,
      })),
      ...reportsFiled.map((report) => ({
        id: report._id.toString(),
        kind: 'report_filed',
        timestamp: (report as any).createdAt,
        title: REASON_LABELS[report.reason] || report.reason,
        description: `Reportagem enviada via ${SOURCE_LABELS[report.source] || report.source}`,
      })),
    ]
      .sort(
        (left, right) =>
          new Date(right.timestamp || 0).getTime() -
          new Date(left.timestamp || 0).getTime(),
      )
      .slice(0, 24);

    return {
      user,
      caregiverProfile,
      reportsReceived,
      reportsFiled,
      bookings,
      activity,
    };
  }

  async listReports(status?: string, source?: string) {
    const query: FilterQuery<PlatformReportDocument> = {};

    if (status && ['pending', 'under_review', 'resolved', 'dismissed'].includes(status)) {
      query.status = status;
    }

    if (source && ['chat', 'service'].includes(source)) {
      query.source = source;
    }

    return this.platformReportModel
      .find(query)
      .populate('reporterId', 'name email role avatar')
      .populate('reportedUserId', 'name email role avatar moderationStatus moderationReason')
      .populate('reviewedBy', 'name email role')
      .populate('bookingId', 'serviceName status startDate endDate')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getReportDetail(reportId: string) {
    const report = await this.platformReportModel
      .findById(reportId)
      .populate('reporterId', 'name email role avatar moderationStatus')
      .populate('reportedUserId', 'name email role avatar moderationStatus moderationReason banReason')
      .populate('reviewedBy', 'name email role')
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'clientId', select: 'name email phone avatar role' },
          {
            path: 'caregiverId',
            populate: {
              path: 'userId',
              select: 'name email phone avatar role',
            },
          },
        ],
      })
      .populate({
        path: 'conversationId',
        populate: [
          { path: 'clientId', select: 'name email role avatar' },
          { path: 'caregiverUserId', select: 'name email role avatar' },
          { path: 'bookingId', select: 'serviceName status startDate endDate' },
        ],
      })
      .lean();

    if (!report) {
      throw new NotFoundException('Reportagem não encontrada');
    }

    const messages = report.conversationId
      ? await this.messageModel
          .find({ conversationId: (report.conversationId as any)._id })
          .populate('senderId', 'name email role avatar')
          .sort({ createdAt: -1 })
          .limit(40)
          .lean()
          .then((items) => items.reverse())
      : [];

    const relatedFeedbacks = report.bookingId
      ? await this.feedbackModel
          .find({ bookingId: (report.bookingId as any)._id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
      : [];

    const previousReports = await this.platformReportModel
      .find({
        reportedUserId: (report.reportedUserId as any)._id,
        _id: { $ne: report._id },
      })
      .populate('reporterId', 'name email role avatar')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return {
      report,
      evidence: {
        messages,
        feedbacks: relatedFeedbacks,
      },
      previousReports,
    };
  }

  async reviewReport(
    reportId: string,
    adminId: string,
    dto: ReviewPlatformReportDto,
  ) {
    const report = await this.platformReportModel.findById(reportId);

    if (!report) {
      throw new NotFoundException('Reportagem não encontrada');
    }

    const action = (dto.action || 'none') as ModerationAction;

    if (action === 'watchlist') {
      await this.applyUserModerationAction(
        report.reportedUserId.toString(),
        'watchlist',
        dto.notes || 'Conta colocada em observação após revisão manual',
        'admin',
        adminId,
        { reportId },
      );
    } else if (action === 'ban') {
      await this.applyUserModerationAction(
        report.reportedUserId.toString(),
        'ban',
        dto.notes || 'Conta banida após revisão manual',
        'admin',
        adminId,
        { reportId },
      );
    } else if (action === 'unban') {
      await this.applyUserModerationAction(
        report.reportedUserId.toString(),
        'unban',
        dto.notes || 'Banimento revertido após revisão manual',
        'admin',
        adminId,
        { reportId },
      );
    }

    report.reviewedBy = new Types.ObjectId(adminId);
    report.reviewedAt = new Date();
    report.adminNotes = dto.notes?.trim() || report.adminNotes;
    report.resolvedAction = action;

    if (action === 'dismiss') {
      report.status = 'dismissed';
    } else if (action !== 'none') {
      report.status = 'resolved';
    } else if (dto.status) {
      report.status = dto.status;
    } else {
      report.status = 'under_review';
    }

    await report.save();

    await this.recordAction({
      actorId: adminId,
      actorType: 'admin',
      action: 'report_reviewed',
      targetType: 'report',
      targetId: report._id.toString(),
      description: `Reportagem ${report._id.toString()} revisada manualmente`,
      metadata: {
        reportId: report._id.toString(),
        status: report.status,
        action,
      },
    });

    return this.getReportDetail(reportId);
  }

  async updateUserModeration(
    userId: string,
    adminId: string,
    dto: UpdateUserModerationDto,
  ) {
    return this.applyUserModerationAction(
      userId,
      dto.action as UserAction,
      dto.reason ||
        this.getDefaultModerationReason(
          dto.action as UserAction,
          'Ação administrativa manual',
        ),
      'admin',
      adminId,
      { userId },
    );
  }

  async getLogs(limit = 40) {
    return this.adminActionLogModel
      .find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  private async getReportSummary(reportId: string) {
    return this.platformReportModel
      .findById(reportId)
      .populate('reporterId', 'name email role avatar')
      .populate('reportedUserId', 'name email role avatar moderationStatus')
      .populate('bookingId', 'serviceName status startDate endDate')
      .lean();
  }

  private async resolveReportContext(
    dto: CreatePlatformReportDto,
    reporterId: string,
    reporterRole: string,
  ) {
    if (dto.source === 'chat') {
      if (!dto.conversationId) {
        throw new BadRequestException('Informe a conversa vinculada à reportagem');
      }

      const conversation = await this.conversationModel.findById(dto.conversationId).lean();

      if (!conversation) {
        throw new NotFoundException('Conversa não encontrada');
      }

      const isClient = conversation.clientId.toString() === reporterId;
      const isCaregiver = conversation.caregiverUserId.toString() === reporterId;

      if (!isClient && !isCaregiver) {
        throw new ForbiddenException('Você não participa desta conversa');
      }

      return {
        bookingId: conversation.bookingId?.toString?.() || dto.bookingId,
        conversationId: conversation._id.toString(),
        reportedUserId: isClient
          ? conversation.caregiverUserId.toString()
          : conversation.clientId.toString(),
      };
    }

    if (!dto.bookingId) {
      throw new BadRequestException('Informe o serviço vinculado à reportagem');
    }

    const booking = await this.bookingModel
      .findById(dto.bookingId)
      .populate('clientId', 'name email role avatar')
      .populate({
        path: 'caregiverId',
        populate: {
          path: 'userId',
          select: 'name email role avatar',
        },
      })
      .lean();

    if (!booking) {
      throw new NotFoundException('Serviço não encontrado');
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException(
        'Reportagens do serviço só podem ser feitas após a conclusão do atendimento',
      );
    }

    const clientId = (booking.clientId as any)._id.toString();
    const caregiverUserId = (booking.caregiverId as any)?.userId?._id?.toString();

    if (reporterRole === 'client') {
      if (clientId !== reporterId) {
        throw new ForbiddenException('Você não pode reportar este serviço');
      }
      if (!caregiverUserId) {
        throw new NotFoundException('Cuidador do serviço não encontrado');
      }
      return {
        bookingId: booking._id.toString(),
        conversationId: dto.conversationId,
        reportedUserId: caregiverUserId,
      };
    }

    if (reporterRole === 'caregiver') {
      if (caregiverUserId !== reporterId) {
        throw new ForbiddenException('Você não pode reportar este serviço');
      }
      return {
        bookingId: booking._id.toString(),
        conversationId: dto.conversationId,
        reportedUserId: clientId,
      };
    }

    throw new ForbiddenException('Seu perfil não pode enviar reportagens');
  }

  private async evaluateAutomatedModeration(report: PlatformReportDocument) {
    const reason = report.reason;
    const weight = REASON_WEIGHTS[reason] || 1;
    const lookbackDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const recentDate = new Date(
      Date.now() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000,
    );

    const baseQuery: FilterQuery<PlatformReportDocument> = {
      reportedUserId: report.reportedUserId,
      status: { $ne: 'dismissed' },
      createdAt: { $gte: lookbackDate },
    };

    const [sameReasonCount, recentCount, lifetimeCount, user] = await Promise.all([
      this.platformReportModel.countDocuments({
        ...baseQuery,
        reason,
      }),
      this.platformReportModel.countDocuments({
        reportedUserId: report.reportedUserId,
        status: { $ne: 'dismissed' },
        createdAt: { $gte: recentDate },
      }),
      this.platformReportModel.countDocuments({
        reportedUserId: report.reportedUserId,
        status: { $ne: 'dismissed' },
      }),
      this.userModel.findById(report.reportedUserId),
    ]);

    if (!user) {
      throw new NotFoundException('Usuário reportado não encontrado');
    }

    const historicalPenalty =
      (user.lastModerationAt ? 0.8 : 0) +
      (user.reviewRequestStatus === 'pending' ? 0.3 : 0);
    const score = Number(
      (
        sameReasonCount * weight +
        recentCount * 0.45 +
        Math.min(lifetimeCount, 10) * 0.15 +
        historicalPenalty
      ).toFixed(2),
    );

    let recommendedAction: ModerationAction = 'none';

    if (sameReasonCount >= BAN_THRESHOLD || score >= 6.2) {
      recommendedAction = 'ban';
    } else if (sameReasonCount >= WATCHLIST_THRESHOLD || score >= 3.4) {
      recommendedAction = 'watchlist';
    }

    if (recommendedAction === 'ban' && user.moderationStatus !== 'banned') {
      await this.applyUserModerationAction(
        user._id.toString(),
        'ban',
        `Banimento automático após ${sameReasonCount} reportagens recorrentes de ${REASON_LABELS[reason] || reason}`,
        'system',
        undefined,
        {
          reportId: report._id.toString(),
          sameReasonCount,
          recentCount,
          score,
          reason,
        },
      );
    } else if (
      recommendedAction === 'watchlist' &&
      user.moderationStatus === 'active'
    ) {
      await this.applyUserModerationAction(
        user._id.toString(),
        'watchlist',
        `Observação automática após ${sameReasonCount} reportagens recorrentes de ${REASON_LABELS[reason] || reason}`,
        'system',
        undefined,
        {
          reportId: report._id.toString(),
          sameReasonCount,
          recentCount,
          score,
          reason,
        },
      );
    }

    return {
      recommendedAction,
      score,
      snapshot: {
        sameReasonCount,
        recentCount,
        lifetimeCount,
        weight,
        score,
      },
    };
  }

  private async applyUserModerationAction(
    userId: string,
    action: UserAction,
    reason: string,
    actorType: 'admin' | 'system' | 'user',
    actorId?: string,
    metadata: Record<string, any> = {},
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const now = new Date();

    if (action === 'ban') {
      user.moderationStatus = 'banned';
      user.isActive = false;
      user.banReason = reason;
      user.banSource = actorType === 'system' ? 'automatic' : 'manual';
      user.bannedAt = now;
      user.lastModerationAt = now;
      user.moderationReason = reason;
      user.isOnline = false;
    } else if (action === 'unban') {
      user.moderationStatus = 'active';
      user.isActive = true;
      user.banReason = '';
      user.banSource = null;
      user.unbannedAt = now;
      user.lastModerationAt = now;
      user.moderationReason = reason;
      if (user.reviewRequestStatus === 'pending') {
        user.reviewRequestStatus = 'accepted';
      }
    } else if (action === 'watchlist') {
      user.moderationStatus = 'watchlist';
      user.isActive = true;
      user.banReason = '';
      user.banSource = null;
      user.lastModerationAt = now;
      user.moderationReason = reason;
    } else if (action === 'clear_watch') {
      user.moderationStatus = 'active';
      user.isActive = true;
      user.lastModerationAt = now;
      user.moderationReason = reason;
    }

    await user.save();

    await this.recordAction({
      actorId,
      actorType,
      action: `user_${action}`,
      targetType: 'user',
      targetId: user._id.toString(),
      description: `${this.getActorLabel(actorType)} aplicou ${action} para ${user.email}`,
      metadata: {
        ...metadata,
        reason,
        action,
        moderationStatus: user.moderationStatus,
      },
    });

    return this.userModel.findById(userId).select('-password').lean();
  }

  private getDefaultModerationReason(action: UserAction, fallback: string) {
    const defaults: Record<UserAction, string> = {
      ban: 'Conta banida manualmente pela administração',
      unban: 'Conta reabilitada pela administração',
      watchlist: 'Conta colocada em observação pela administração',
      clear_watch: 'Conta removida da observação pela administração',
    };

    return defaults[action] || fallback;
  }

  private getActorLabel(actorType: 'admin' | 'system' | 'user') {
    if (actorType === 'admin') return 'Admin';
    if (actorType === 'user') return 'Usuário';
    return 'Sistema';
  }

  private async recordAction(params: {
    actorId?: string;
    actorType: 'admin' | 'system' | 'user';
    action: string;
    targetType: string;
    targetId?: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    await this.adminActionLogModel.create({
      actorId: params.actorId ? new Types.ObjectId(params.actorId) : undefined,
      actorType: params.actorType,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      description: params.description,
      metadata: params.metadata || {},
    });
  }

  private async buildDailyGrowth(
    model: Model<any>,
    dateField: string,
    days: number,
    extraQuery: Record<string, any> = {},
  ) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const docs = await model
      .find({
        ...extraQuery,
        [dateField]: { $gte: start },
      })
      .select(dateField)
      .lean();

    const totals = new Map<string, number>();

    for (let index = 0; index < days; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const key = current.toISOString().slice(0, 10);
      totals.set(key, 0);
    }

    docs.forEach((doc) => {
      const value = doc?.[dateField];
      if (!value) return;
      const key = new Date(value).toISOString().slice(0, 10);
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    return Array.from(totals.entries()).map(([date, total]) => ({
      date,
      label: new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      total,
    }));
  }

  private buildNotifications(params: {
    pendingReports: number;
    recentReports: number;
    recentReportRate: number;
    pendingReviewRequests: number;
    onlineUsers: number;
    flaggedUsersCount: number;
  }) {
    const notifications = [];

    if (params.pendingReports > 0) {
      notifications.push({
        severity: 'high',
        title: 'Novos reports aguardando revisão',
        description: `${params.pendingReports} reportagens pendentes na fila manual`,
      });
    }

    if (params.recentReportRate >= 20) {
      notifications.push({
        severity: 'medium',
        title: 'Taxa de reportagens acima do normal',
        description: `${params.recentReportRate}% dos serviços concluídos geraram reportagens recentes`,
      });
    }

    if (params.pendingReviewRequests > 0) {
      notifications.push({
        severity: 'medium',
        title: 'Solicitações de revisão abertas',
        description: `${params.pendingReviewRequests} contas banidas pediram reavaliação`,
      });
    }

    if (params.onlineUsers >= 10) {
      notifications.push({
        severity: 'low',
        title: 'Pico de atividade na plataforma',
        description: `${params.onlineUsers} usuários estão online neste momento`,
      });
    }

    if (params.flaggedUsersCount > 0) {
      notifications.push({
        severity: 'low',
        title: 'Contas monitoradas',
        description: `${params.flaggedUsersCount} contas exigem acompanhamento contínuo`,
      });
    }

    return notifications;
  }
}
