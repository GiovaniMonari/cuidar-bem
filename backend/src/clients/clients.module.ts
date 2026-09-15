import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Client, ClientSchema } from './schemas/client.schema';
import { ClientsService } from './clients.service';
import { Caregiver, CaregiverSchema } from '../caregivers/schemas/caregiver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
      { name: Caregiver.name, schema: CaregiverSchema },
    ]),
  ],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
