/**
 * StorageModule 使用範例
 *
 * 此範例展示如何在 UsersModule 中整合 StorageService 來處理用戶頭像上傳。
 */

// ============================================================================
// 1. Controller 範例 (users.controller.ts)
// ============================================================================

import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
// import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

/**
 * 使用者頭像上傳 Controller
 */
@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 上傳用戶頭像
   *
   * @route POST /users/:id/avatar
   */
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 限制檔案大小: 5MB
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // 限制檔案類型: 僅圖片
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    // 上傳到 GCS，目標路徑: avatars/{userId}/
    const avatarUrl = await this.storageService.uploadFile(file, `avatars/${userId}`);

    // TODO: 將 avatarUrl 儲存到資料庫
    // await this.usersService.updateAvatar(userId, avatarUrl);

    return {
      success: true,
      message: '頭像上傳成功',
      data: {
        avatarUrl,
      },
    };
  }

  /**
   * 刪除用戶頭像
   *
   * @route DELETE /users/:id/avatar
   */
  @Delete(':id/avatar')
  async deleteAvatar(@Param('id') userId: string) {
    // TODO: 從資料庫取得目前的頭像 URL
    // const user = await this.usersService.findOne(userId);
    // const currentAvatarUrl = user.avatarUrl;

    const currentAvatarUrl = 'avatars/user123/1704672000000-abc123.jpg'; // 範例

    if (currentAvatarUrl) {
      await this.storageService.deleteFile(currentAvatarUrl);
    }

    // TODO: 清除資料庫中的頭像 URL
    // await this.usersService.updateAvatar(userId, null);

    return {
      success: true,
      message: '頭像刪除成功',
    };
  }
}

// ============================================================================
// 2. Service 範例 (users.service.ts)
// ============================================================================

import { Injectable } from '@nestjs/common';
// import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersServiceExample {
  constructor(
    // private readonly usersRepository: Repository<User>,
    private readonly storageService: StorageService
  ) {}

  /**
   * 更新用戶頭像 - Service 層邏輯
   */
  async updateUserAvatar(userId: string, file: Express.Multer.File) {
    // 1. 查詢用戶
    // const user = await this.usersRepository.findOne({ where: { id: userId } });

    // 2. 如果有舊頭像，先刪除
    // if (user.avatarUrl) {
    //   await this.storageService.deleteFile(user.avatarUrl);
    // }

    // 3. 上傳新頭像
    const newAvatarUrl = await this.storageService.uploadFile(file, `avatars/${userId}`);

    // 4. 更新資料庫
    // user.avatarUrl = newAvatarUrl;
    // await this.usersRepository.save(user);

    return newAvatarUrl;
  }

  /**
   * 批次上傳文件範例
   */
  async uploadDocuments(userId: string, files: Express.Multer.File[]) {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await this.storageService.uploadFile(file, `documents/${userId}`);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  }
}

// ============================================================================
// 3. Module 設定範例 (users.module.ts)
// ============================================================================

/*
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
// StorageModule 已設為 @Global()，無需在此匯入

@Module({
  imports: [
    // 使用 memory storage，檔案會以 Buffer 形式存在 file.buffer
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
*/

// ============================================================================
// 4. 環境變數設定 (.env)
// ============================================================================

/*
# Google Cloud Storage 設定
GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=your-bucket-name

# 本地開發：指定服務帳戶金鑰檔案路徑
# GCP_KEY_FILE_PATH=./service-account.json

# Cloud Run 部署：不需設定 GCP_KEY_FILE_PATH
# 系統會自動使用 Application Default Credentials (ADC)
*/

// ============================================================================
// 5. 多檔案上傳 Controller 範例
// ============================================================================

/*
import { FilesInterceptor } from '@nestjs/platform-express';

@Post('documents')
@UseInterceptors(FilesInterceptor('files', 10)) // 最多 10 個檔案
async uploadDocuments(
  @UploadedFiles() files: Express.Multer.File[],
) {
  const urls = await Promise.all(
    files.map(file => this.storageService.uploadFile(file, 'documents'))
  );
  return { urls };
}
*/
