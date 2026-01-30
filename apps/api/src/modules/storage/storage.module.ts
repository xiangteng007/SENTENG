import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

/**
 * StorageModule
 *
 * Google Cloud Storage 整合模組。
 * 使用 @Global() 裝飾器，使 StorageService 可在整個應用程式中注入使用。
 *
 * API 端點:
 * - GET  /storage/status       - 檢查服務狀態
 * - POST /storage/upload       - 上傳檔案
 * - POST /storage/signed-url   - 生成 Signed URL
 * - DELETE /storage/:fileName  - 刪除檔案
 *
 * @example
 * // 在 app.module.ts 中匯入
 * @Module({
 *   imports: [StorageModule],
 * })
 * export class AppModule {}
 *
 * // 在任何 Service 中使用
 * @Injectable()
 * export class UsersService {
 *   constructor(private readonly storageService: StorageService) {}
 * }
 */
@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
