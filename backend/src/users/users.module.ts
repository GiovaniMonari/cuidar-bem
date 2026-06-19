import { Module, Redirect } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { PresenceSyncService } from './presence-sync.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), RedisModule],
  controllers: [UsersController],
  providers: [UsersService, PresenceSyncService],
  exports: [UsersService],
})
export class UsersModule {}