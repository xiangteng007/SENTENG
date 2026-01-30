/**
 * CMM Seed Runner (NestJS Context)
 *
 * 執行方式: npm run seed:cmm
 *
 * 使用 NestJS bootstrap 確保正確的 DB 連接
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { seedCmmData } from './cmm.seed';

async function bootstrap() {
  console.log('🚀 Starting NestJS application for CMM seeding...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await seedCmmData(dataSource);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await app.close();
    console.log('🔌 Application closed');
  }
}

bootstrap()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
