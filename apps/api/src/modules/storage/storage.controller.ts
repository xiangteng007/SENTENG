import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { StorageService } from "./storage.service";

/**
 * StorageController
 *
 * 檔案上傳與管理 API
 *
 * @route /api/v1/storage
 */
@ApiTags("Storage")
@ApiBearerAuth()
@Controller("storage")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 檢查 Storage 服務狀態
   * GET /storage/status
   */
  @Get("status")
  @ApiOperation({ summary: "Check storage status" })
  @RequirePermissions("storage:read")
  getStatus() {
    return {
      enabled: this.storageService.enabled,
      message: this.storageService.enabled
        ? "Storage service is enabled"
        : "Storage service is disabled. GCP_BUCKET_NAME not configured.",
    };
  }

  /**
   * 上傳檔案
   * POST /storage/upload
   *
   * @param file - 上傳的檔案 (multipart/form-data)
   * @param destination - 目標資料夾 (query param, 例如: avatars, documents)
   * @returns { url: string } - 檔案的 Signed URL
   */
  @Post("upload")
  @RequirePermissions("storage:upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, callback) => {
        // 允許的檔案類型
        const allowedMimes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/csv",
          "text/plain",
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `不支援的檔案類型: ${file.mimetype}. 支援的類型: 圖片(jpg,png,gif,webp), PDF, Word, Excel, CSV, TXT`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("destination") destination: string = "uploads",
  ) {
    if (!file) {
      throw new BadRequestException("請提供要上傳的檔案");
    }

    // 驗證 destination 路徑 (防止路徑遍歷攻擊)
    const safeDestination = destination.replace(/[^a-zA-Z0-9\-_\/]/g, "");
    if (safeDestination.includes("..")) {
      throw new BadRequestException("無效的目標資料夾路徑");
    }

    const url = await this.storageService.uploadFile(file, safeDestination);

    return {
      success: true,
      url,
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * 批量上傳檔案
   * POST /storage/upload-multiple
   *
   * 注意：此端點需要額外的 FilesInterceptor 設定
   * 目前先實作單檔上傳，批量上傳可後續擴展
   */

  /**
   * 生成 Signed URL (用於已存在的檔案)
   * POST /storage/signed-url
   *
   * @param body.fileName - GCS 中的檔案路徑
   * @param body.expiresInDays - URL 有效天數 (預設 7 天)
   * @returns { url: string } - Signed URL
   */
  @Post("signed-url")
  @RequirePermissions("storage:read")
  async generateSignedUrl(
    @Body() body: { fileName: string; expiresInDays?: number },
  ) {
    if (!body.fileName) {
      throw new BadRequestException("請提供檔案路徑 (fileName)");
    }

    const url = await this.storageService.generateSignedUrl(
      body.fileName,
      body.expiresInDays || 7,
    );

    return {
      success: true,
      url,
      expiresInDays: body.expiresInDays || 7,
    };
  }

  /**
   * 刪除檔案
   * DELETE /storage/:encodedFileName
   *
   * @param encodedFileName - Base64 編碼的檔案路徑
   */
  @Delete(":encodedFileName")
  @RequirePermissions("storage:delete")
  async deleteFile(@Param("encodedFileName") encodedFileName: string) {
    // 解碼 Base64 檔案名稱
    let fileName: string;
    try {
      fileName = Buffer.from(encodedFileName, "base64").toString("utf-8");
    } catch {
      throw new BadRequestException("無效的檔案路徑編碼");
    }

    await this.storageService.deleteFile(fileName);

    return {
      success: true,
      message: "檔案已刪除",
      fileName,
    };
  }
}
