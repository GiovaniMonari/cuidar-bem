import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class PresenceSyncService {
  private readonly logger = new Logger(PresenceSyncService.name);

  constructor(private readonly usersService: UsersService) {}

  // Executa a cada 30 segundos (0.1.6)
  @Cron('*/30 * * * * *')
  async handlePresenceSync() {
    await this.usersService.syncPresenceToMongo();
  }
}
