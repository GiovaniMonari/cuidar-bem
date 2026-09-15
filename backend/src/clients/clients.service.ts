import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Client, ClientDocument } from './schemas/client.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createForUser(userId: string, favoriteCaregivers: Types.ObjectId[] = []) {
    return this.clientModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, favoriteCaregivers } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  private async getOrMigrate(userId: string): Promise<ClientDocument> {
    let client = await this.clientModel.findOne({ userId });
    if (client) return client;

    const user = (await this.userModel.collection.findOne({
      _id: new Types.ObjectId(userId),
    })) as { favoriteCaregivers?: Types.ObjectId[] } | null;
    if (!user) throw new NotFoundException('Usuário não encontrado');

    client = await this.clientModel.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          favoriteCaregivers: user.favoriteCaregivers || [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await this.userModel.updateOne(
      { _id: userId },
      { $unset: { favoriteCaregivers: 1 } },
    );

    return client;
  }

  async favoriteCaregiver(userId: string, caregiverId: string) {
    const client = await this.getOrMigrate(userId);
    const caregiverObjectId = new Types.ObjectId(caregiverId);
    const isAlreadyFavorited = client.favoriteCaregivers.some(
      (id) => id.toString() === caregiverId,
    );

    if (isAlreadyFavorited) {
      client.favoriteCaregivers = client.favoriteCaregivers.filter(
        (id) => id.toString() !== caregiverId,
      );
    } else {
      client.favoriteCaregivers.push(caregiverObjectId);
    }

    await client.save();
    return { success: true, isFavorited: !isAlreadyFavorited };
  }

  async getFavoriteCaregivers(userId: string) {
    const client = await this.getOrMigrate(userId);
    await client.populate({
      path: 'favoriteCaregivers',
      populate: { path: 'userId', select: 'name avatar email phone' },
    });
    return client.favoriteCaregivers || [];
  }

  async deleteFavoriteCaregiver(userId: string, caregiverId: string) {
    const client = await this.getOrMigrate(userId);
    client.favoriteCaregivers = client.favoriteCaregivers.filter(
      (id) => id.toString() !== caregiverId,
    );
    await client.save();
    return { message: 'Favorito removido com sucesso' };
  }

  async migrateLegacyData() {
    const users = (await this.userModel.collection
      .find({ role: 'client' })
      .toArray()) as Array<{
      _id: Types.ObjectId;
      favoriteCaregivers?: Types.ObjectId[];
    }>;
    let migrated = 0;

    for (const user of users) {
      await this.clientModel.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            favoriteCaregivers: user.favoriteCaregivers || [],
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      await this.userModel.updateOne(
        { _id: user._id },
        { $unset: { favoriteCaregivers: 1 } },
      );
      migrated += 1;
    }

    return { migrated };
  }
}
