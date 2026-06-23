import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { FilterQuery, Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  PlatformReport,
  PlatformReportDocument,
} from '../schemas/platform-report.schema';
import {
  AdminActionLog,
  AdminActionLogDocument,
} from '../schemas/admin-action-log.schema';
import { RedisCacheService } from '../../redis/redis-cache.service';
import { CACHE_KEYS } from '../../redis/cache-keys';
import {
  EvaluateReportJobData,
  MODERATION_JOBS,
  MODERATION_QUEUE,
} from './moderation.constants';

type ModerationAction = 'none' | 'watchlist' | 'ban';
type UserAction = 'ban' | 'watchlist';

const WATCHLIST_THRESHOLD = 2;
const BAN_THRESHOLD = 4;
const LOOKBACK_DAYS = 60;
const RECENT_ACTIVITY_DAYS = 14;

const REASON_LABELS: Record<string, string> = {
  inappropriate_behavior: 'Comportamento inadequado',
  delay_or_no_show: 'Atraso ou não comparecimento',
  offensive_language: 'Linguagem ofensiva',
  fraud_attempt: 'Tentativa de fraude',
  other: 'Outro',
};

const REASON_WEIGHTS: Record<string, number> = {
  inappropriate_behavior: 1.2,
  delay_or_no_show: 1,
  offensive_language: 1.1,
  fraud_attempt: 1.8,
  other: 0.9,
};

@Processor(MODERATION_QUEUE)
export class ModerationWorker extends WorkerHost {
  private readonly logger = new Logger(ModerationWorker.name);

  constructor(
    @InjectModel(PlatformReport.name)
    private readonly platformReportModel: Model<PlatformReportDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AdminActionLog.name)
    private readonly adminActionLogModel: Model<AdminActionLogDocument>,
    private readonly cache: RedisCacheService,
  ) {
    super();
  }

  // ─── Dispatcher ─────────────────────────────────────────────────

  async process(job: Job<EvaluateReportJobData>): Promise<void> {
    this.logger.log(`⚙️  Processando job [${job.name}] id=${job.id}`);

    if (job.name === MODERATION_JOBS.EVALUATE_REPORT) {
      await this.handleEvaluateReport(job.data);
      return;
    }

    this.logger.warn(`Job desconhecido ignorado: ${job.name}`);
  }

  // ─── Handler principal ──────────────────────────────────────────

  private async handleEvaluateReport(data: EvaluateReportJobData): Promise<void> {
    const { reportId } = data;

    const report = await this.platformReportModel.findById(reportId);
    if (!report) {
      // Report deletado entre o enqueue e o processamento — não é um erro.
      this.logger.warn(`Report ${reportId} não encontrado, ignorando job`);
      return;
    }

    this.logger.log(`🔍 Avaliando report ${reportId} (razão: ${report.reason})`);

    const result = await this.evaluateAutomatedModeration(report);

    report.autoAction = result.recommendedAction;
    report.severityScore = result.score;
    report.moderationSnapshot = result.snapshot;
    await report.save();

    this.logger.log(
      `✅ Report ${reportId} avaliado — ação: ${result.recommendedAction}, score: ${result.score}`,
    );

    // Invalida o cache do dashboard pois métricas de moderação mudaram
    await this.cache.del(CACHE_KEYS.ADMIN_DASHBOARD);
  }

  // ─── Lógica de avaliação (extraída do ModerationService) ────────

  private async evaluateAutomatedModeration(report: PlatformReportDocument) {
    const reason = report.reason;
    const weight = REASON_WEIGHTS[reason] || 1;

    const lookbackDate = new Date(
      Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );
    const recentDate = new Date(
      Date.now() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000,
    );

    const baseQuery: FilterQuery<PlatformReportDocument> = {
      reportedUserId: report.reportedUserId,
      status: { $ne: 'dismissed' },
      createdAt: { $gte: lookbackDate },
    };

    const [sameReasonCount, recentCount, lifetimeCount, user] = await Promise.all([
      this.platformReportModel.countDocuments({ ...baseQuery, reason }),
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
      throw new NotFoundException(
        `Usuário reportado ${report.reportedUserId} não encontrado`,
      );
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

    // Aplicar ação automática se necessário
    if (recommendedAction === 'ban' && user.moderationStatus !== 'banned') {
      await this.applyUserModerationAction(
        user,
        'ban',
        `Banimento automático após ${sameReasonCount} reportagens recorrentes de ${REASON_LABELS[reason] || reason}`,
        { reportId: report._id.toString(), sameReasonCount, recentCount, score, reason },
      );
    } else if (
      recommendedAction === 'watchlist' &&
      user.moderationStatus === 'active'
    ) {
      await this.applyUserModerationAction(
        user,
        'watchlist',
        `Observação automática após ${sameReasonCount} reportagens recorrentes de ${REASON_LABELS[reason] || reason}`,
        { reportId: report._id.toString(), sameReasonCount, recentCount, score, reason },
      );
    }

    return {
      recommendedAction,
      score,
      snapshot: { sameReasonCount, recentCount, lifetimeCount, weight, score },
    };
  }

  // ─── Aplicar ação de moderação ──────────────────────────────────

  private async applyUserModerationAction(
    user: UserDocument,
    action: UserAction,
    reason: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    const now = new Date();

    if (action === 'ban') {
      user.moderationStatus = 'banned';
      user.isActive = false;
      user.banReason = reason;
      user.banSource = 'automatic';
      user.bannedAt = now;
      user.lastModerationAt = now;
      user.moderationReason = reason;
      user.isOnline = false;
    } else if (action === 'watchlist') {
      user.moderationStatus = 'watchlist';
      user.isActive = true;
      user.banReason = '';
      user.banSource = null;
      user.lastModerationAt = now;
      user.moderationReason = reason;
    }

    await user.save();

    await this.adminActionLogModel.create({
      actorType: 'system',
      action: `user_${action}`,
      targetType: 'user',
      targetId: user._id.toString(),
      description: `Sistema aplicou ${action} para ${user.email}`,
      metadata: { ...metadata, reason, action, moderationStatus: user.moderationStatus },
    });

    this.logger.log(
      `🔒 Ação automática [${action}] aplicada para usuário ${user.email}`,
    );
  }
}