import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private readonly safeProjection = '-password';

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

  async touchPresence(id: string) {
    await this.userModel.findByIdAndUpdate(id, {
      isOnline: true,
      lastSeenAt: new Date(),
    });
  }

  async setOffline(id: string) {
    await this.userModel.findByIdAndUpdate(id, {
      isOnline: false,
    });
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

    // Limpeza preventiva de valores nulos
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
