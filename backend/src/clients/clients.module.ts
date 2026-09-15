import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Client, ClientSchema } from './schemas/client.schema';
import { ClientsService } from './clients.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
