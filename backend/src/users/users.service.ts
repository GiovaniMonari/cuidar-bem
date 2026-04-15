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

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: createUserDto.email });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
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
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });
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
