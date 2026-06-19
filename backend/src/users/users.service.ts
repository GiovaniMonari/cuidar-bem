import { Injectable, ConflictException, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis'; // 👈 Importação do ioredis
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { REDIS_CLIENT } from '../redis/redis.constants'; // 👈 Importação do Token

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly safeProjection = '-password';
  private readonly PRESENCE_PREFIX = 'cuidarbem:presence:';

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // 📦 CORREÇÃO 1: Injeção do cliente Redis unificado no construtor
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: createUserDto.email });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      lastLoginAt: new Date(),
      lastSeenAt: new Date(),
      isOnline: true,
    });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }
  async findRawById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select(this.safeProjection);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select(this.safeProjection);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });
  }

  async savePasswordResetToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $set: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
        passwordResetRequestedAt: new Date(),
      },
    });
  }

  async findByValidPasswordResetToken(
    tokenHash: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });
  }

  async resetPasswordWithToken(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userModel.findByIdAndUpdate(id, {
      $set: {
        password: hashedPassword,
      },
      $unset: {
        passwordResetTokenHash: '',
        passwordResetExpiresAt: '',
        passwordResetRequestedAt: '',
      },
    });
  }

  async touchPresence(userId: string): Promise<void> {
    const redisKey = `${this.PRESENCE_PREFIX}${userId}`;
    const timestamp = Date.now().toString();

    // Salva no Redis e define 5 minutos de TTL (300 segundos)
    await this.redis.set(redisKey, timestamp, 'EX', 300);
  }

  async setOffline(userId: string): Promise<void> {
    const redisKey = `${this.PRESENCE_PREFIX}${userId}`;
    
    // Apaga a chave de presença atômica do Redis
    await this.redis.del(redisKey);
    
    // Atualiza o MongoDB na mesma hora apenas para saídas manuais (Logout)
    await this.userModel.updateOne({ _id: userId }, { $set: { isOnline: false } });
  }

  // 🔄 CORREÇÃO 2: Método adicionador do Sincronizador em lote (Bulk Sinker)
  async syncPresenceToMongo(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.PRESENCE_PREFIX}*`);
      const now = new Date();
      const userIdsOnline: string[] = [];

      for (const key of keys) {
        const userId = key.replace(this.PRESENCE_PREFIX, '');
        userIdsOnline.push(userId);
      }

      if (userIdsOnline.length > 0) {
        // Atualiza todos os usuários ativamente pingados de uma vez só
        await this.userModel.updateMany(
          { _id: { $in: userIdsOnline } },
          { $set: { isOnline: true, lastSeenAt: now } }
        );
      }

      // Coloca offline quem não disparou pings no Redis nos últimos 5 minutos
      await this.userModel.updateMany(
        { _id: { $not: { $in: userIdsOnline } }, isOnline: true },
        { $set: { isOnline: false } }
      );
    } catch (error: any) {
      this.logger.error(`Erro ao rodar lote de presenças no Mongo: ${error.message}`);
    }
  }

  async registerSuccessfulLogin(id: string) {
    await this.userModel.findByIdAndUpdate(id, {
      isOnline: true,
      lastLoginAt: new Date(),
      lastSeenAt: new Date(),
    });
  }

  async requestBanReview(email: string, message?: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('Nenhuma conta encontrada com este email');
    }

    if (user.moderationStatus !== 'banned' || user.isActive) {
      throw new ConflictException(
        'Somente contas banidas podem solicitar revisão no momento',
      );
    }

    user.reviewRequestStatus = 'pending';
    user.reviewRequestMessage = message?.trim() || '';
    user.reviewRequestedAt = new Date();
    await user.save();

    return {
      success: true,
      message: 'Solicitação de revisão enviada com sucesso',
    };
  }

  async favoriteCaregiver(userId: string, caregiverId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    user.favoriteCaregivers = user.favoriteCaregivers.filter(
      (id): id is Types.ObjectId => id != null && Types.ObjectId.isValid(id.toString())
    );

    const isAlreadyFavorited = user.favoriteCaregivers.some(
      (id) => id.toString() === caregiverId
    );

    if (isAlreadyFavorited) {
      user.favoriteCaregivers = user.favoriteCaregivers.filter(
        (id) => id.toString() !== caregiverId
      );
    } else {
      user.favoriteCaregivers.push(new Types.ObjectId(caregiverId));
    }

    await user.save();
    return { 
      success: true, 
      isFavorited: !isAlreadyFavorited 
    };
  }

  async getFavoriteCaregivers(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'favoriteCaregivers',
        populate: {
          path: 'userId',
          select: 'name avatar email phone',
        },
      })
      .exec();

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user.favoriteCaregivers || [];
  }

  async deleteFavoriteCaregiver(userId: string, caregiverId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    user.favoriteCaregivers = user.favoriteCaregivers
      .filter((id): id is Types.ObjectId => id != null && Types.ObjectId.isValid(id.toString()))
      .filter((id) => id.toString() !== caregiverId);

    await user.save();
    return { message: 'Favorito removido com sucesso' };
  }
}
