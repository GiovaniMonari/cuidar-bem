import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClientsService } from './clients/clients.service';

async function migrateClients() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(ClientsService).migrateLegacyData();
    console.log(`Migrated ${result.migrated} client profile(s).`);
  } finally {
    await app.close();
  }
}

migrateClients().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
