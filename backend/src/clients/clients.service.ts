import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Client, ClientDocument, SavedAddress } from './schemas/client.schema';

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
    const user = (await this.userModel.collection.findOne(
      { _id: new Types.ObjectId(userId) },
      { projection: { favoriteCaregivers: 1, dependents: 1 } },
    )) as { favoriteCaregivers?: Types.ObjectId[]; dependents?: Record<string, unknown>[] } | null;
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (client) {
      if (user.dependents?.length && !client.savedPatients?.length) {
        client.savedPatients = user.dependents as any;
        await client.save();
        await this.userModel.updateOne({ _id: userId }, { $unset: { dependents: 1 } });
      }
      return client;
    }

    client = await this.clientModel.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          favoriteCaregivers: user.favoriteCaregivers || [],
          savedPatients: user.dependents || [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await this.userModel.updateOne(
      { _id: userId },
      { $unset: { favoriteCaregivers: 1, dependents: 1 } },
    );

    return client;
  }

  private validateDependent(data: { name: string; age: number }) {
    if (!data.name?.trim()) throw new BadRequestException('Informe o nome do dependente');
    if (!Number.isInteger(Number(data.age)) || Number(data.age) < 0 || Number(data.age) > 130) {
      throw new BadRequestException('Informe uma idade válida');
    }
  }

  async getDependents(userId: string) {
    const client = await this.getOrMigrate(userId);
    return client.savedPatients || [];
  }

  private normalizeSavedAddress(data: Partial<SavedAddress>) {
    const address = data.address?.trim() || '';
    if (!address) throw new BadRequestException('Informe o endereço completo');
    return {
      label: data.label?.trim() || 'Endereço salvo',
      address,
      baseAddress: data.baseAddress?.trim() || address,
      number: data.number?.trim() || '',
      complement: data.complement?.trim() || '',
      cep: data.cep?.trim() || '',
      lat: data.lat?.trim() || '',
      lon: data.lon?.trim() || '',
    };
  }

  async getSavedAddresses(userId: string) {
    const client = await this.getOrMigrate(userId);
    return client.savedAddresses || [];
  }

  async addSavedAddress(userId: string, data: Partial<SavedAddress>) {
    const address = this.normalizeSavedAddress(data);
    const client = await this.getOrMigrate(userId);
    const duplicate = client.savedAddresses.some(
      (item) => item.address.trim().toLowerCase() === address.address.toLowerCase(),
    );
    if (duplicate) {
      return client.savedAddresses.find(
        (item) => item.address.trim().toLowerCase() === address.address.toLowerCase(),
      );
    }
    client.savedAddresses.unshift(address as SavedAddress);
    await client.save();
    return client.savedAddresses[0];
  }

  async updateSavedAddress(userId: string, addressId: string, data: Partial<SavedAddress>) {
    const address = this.normalizeSavedAddress(data);
    const client = await this.getOrMigrate(userId);
    const savedAddress = client.savedAddresses.find((item) => (item as any)._id.toString() === addressId);
    if (!savedAddress) throw new NotFoundException('Endereço não encontrado');
    const duplicate = client.savedAddresses.some(
      (item) => (item as any)._id.toString() !== addressId && item.address.toLowerCase() === address.address.toLowerCase(),
    );
    if (duplicate) throw new BadRequestException('Este endereço já está salvo');
    Object.assign(savedAddress, address);
    await client.save();
    return savedAddress;
  }

  async removeSavedAddress(userId: string, addressId: string) {
    const client = await this.getOrMigrate(userId);
    const initialLength = client.savedAddresses.length;
    client.savedAddresses = client.savedAddresses.filter(
      (item) => (item as any)._id.toString() !== addressId,
    );
    if (client.savedAddresses.length === initialLength) throw new NotFoundException('Endereço não encontrado');
    await client.save();
    return { success: true };
  }

  async getPatientProfile(userId: string) {
    const client = await this.getOrMigrate(userId);
    return client.patientProfile || null;
  }

  async updatePatientProfile(userId: string, data: { name: string; age: number; disorder?: string; conditions?: string[]; notes?: string }) {
    this.validateDependent(data);
    const user = await this.userModel.findById(userId).select('name');
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const client = await this.getOrMigrate(userId);
    client.patientProfile = {
      name: user.name,
      age: Number(data.age),
      conditions: data.conditions || [],
      disorder: data.disorder?.trim() || data.conditions?.join(', ') || '',
      notes: data.notes?.trim() || '',
    } as any;
    await client.save();
    return client.patientProfile;
  }

  async addDependent(userId: string, data: { name: string; age: number; disorder?: string; conditions?: string[]; notes?: string }) {
    this.validateDependent(data);
    const client = await this.getOrMigrate(userId);
    client.savedPatients.push({
      name: data.name.trim(),
      age: Number(data.age),
      conditions: data.conditions || [],
      disorder: data.disorder?.trim() || data.conditions?.join(', ') || '',
      notes: data.notes?.trim() || '',
    } as any);
    await client.save();
    return client.savedPatients[client.savedPatients.length - 1];
  }

  async updateDependent(userId: string, dependentId: string, data: { name: string; age: number; disorder?: string; conditions?: string[]; notes?: string }) {
    this.validateDependent(data);
    const client = await this.getOrMigrate(userId);
    const dependent = client.savedPatients.find((item) => (item as any)._id.toString() === dependentId);
    if (!dependent) throw new NotFoundException('Dependente não encontrado');
    dependent.name = data.name.trim();
    dependent.age = Number(data.age);
    dependent.conditions = data.conditions || [];
    dependent.disorder = data.disorder?.trim() || data.conditions?.join(', ') || '';
    dependent.notes = data.notes?.trim() || '';
    await client.save();
    return dependent;
  }

  async removeDependent(userId: string, dependentId: string) {
    const client = await this.getOrMigrate(userId);
    const initialLength = client.savedPatients.length;
    client.savedPatients = client.savedPatients.filter((item) => (item as any)._id.toString() !== dependentId);
    if (client.savedPatients.length === initialLength) throw new NotFoundException('Dependente não encontrado');
    await client.save();
    return { success: true };
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
