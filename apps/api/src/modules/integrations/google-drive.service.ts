/**
 * google-drive.service.ts
 *
 * Google Drive API 服務
 * 處理資料夾管理、檔案上傳、下載、刪除
 * 專為工地照片與專案資料夾整合設計
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { GoogleOAuthService } from './google-oauth.service';
import { Readable } from 'stream';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  createdTime?: string | null;
  modifiedTime?: string | null;
  thumbnailLink?: string | null;
  webViewLink?: string | null;
  webContentLink?: string | null;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  thumbnailLink?: string | null;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);

  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  /**
   * 取得 Drive API 客戶端
   */
  private async getDriveClient(userId: string): Promise<drive_v3.Drive> {
    const oauth2Client = await this.googleOAuthService.getOAuth2Client(userId);
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  /**
   * 確保專案的「工程照片」資料夾存在
   * 如果不存在則創建
   *
   * @param userId - 用戶 ID
   * @param projectDriveFolderId - 專案的 Drive 資料夾 ID
   * @returns 「工程照片」資料夾的 ID
   */
  async ensureProjectPhotoFolder(userId: string, projectDriveFolderId: string): Promise<string> {
    const drive = await this.getDriveClient(userId);
    const folderName = '工程照片';

    try {
      // 先查找是否已存在「工程照片」資料夾
      const existingFolder = await drive.files.list({
        q: `'${projectDriveFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (existingFolder.data.files && existingFolder.data.files.length > 0) {
        this.logger.log(`Found existing photo folder: ${existingFolder.data.files[0].id}`);
        return existingFolder.data.files[0].id!;
      }

      // 創建「工程照片」資料夾
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [projectDriveFolderId],
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      this.logger.log(`Created photo folder: ${folder.data.id}`);
      return folder.data.id!;
    } catch (error) {
      this.logger.error(`Failed to ensure photo folder: ${error.message}`, error.stack);
      throw new InternalServerErrorException('無法建立工程照片資料夾');
    }
  }

  /**
   * 上傳照片到指定資料夾
   *
   * @param userId - 用戶 ID
   * @param folderId - 目標資料夾 ID
   * @param file - 上傳的檔案
   * @param customFileName - 自訂檔名（可選）
   * @returns 上傳結果
   */
  async uploadPhoto(
    userId: string,
    folderId: string,
    file: Express.Multer.File,
    customFileName?: string
  ): Promise<UploadResult> {
    const drive = await this.getDriveClient(userId);

    try {
      // 生成檔名：日期_原始檔名 或 自訂檔名
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const originalName = file.originalname;
      const fileName = customFileName
        ? `${date}_${customFileName}${this.getExtension(originalName)}`
        : `${date}_${originalName}`;

      // 將 buffer 轉換為 stream
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: file.mimetype,
        body: bufferStream,
      };

      const uploadedFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, thumbnailLink',
      });

      this.logger.log(`Uploaded photo: ${uploadedFile.data.name} (${uploadedFile.data.id})`);

      return {
        fileId: uploadedFile.data.id!,
        fileName: uploadedFile.data.name!,
        webViewLink: uploadedFile.data.webViewLink!,
        thumbnailLink: uploadedFile.data.thumbnailLink,
      };
    } catch (error) {
      this.logger.error(`Failed to upload photo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('照片上傳失敗');
    }
  }

  /**
   * 列出資料夾內的所有照片
   *
   * @param userId - 用戶 ID
   * @param folderId - 資料夾 ID
   * @returns 照片列表
   */
  async listPhotos(userId: string, folderId: string): Promise<DriveFile[]> {
    const drive = await this.getDriveClient(userId);

    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
        fields:
          'files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webViewLink, webContentLink)',
        orderBy: 'createdTime desc',
        pageSize: 100,
      });

      return (response.data.files || []).map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        thumbnailLink: file.thumbnailLink,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
      }));
    } catch (error) {
      this.logger.error(`Failed to list photos: ${error.message}`, error.stack);
      throw new InternalServerErrorException('無法取得照片列表');
    }
  }

  /**
   * 刪除照片
   *
   * @param userId - 用戶 ID
   * @param fileId - 檔案 ID
   */
  async deletePhoto(userId: string, fileId: string): Promise<void> {
    const drive = await this.getDriveClient(userId);

    try {
      await drive.files.delete({ fileId });
      this.logger.log(`Deleted photo: ${fileId}`);
    } catch (error) {
      if (error.code === 404) {
        throw new NotFoundException('照片不存在');
      }
      this.logger.error(`Failed to delete photo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('刪除照片失敗');
    }
  }

  /**
   * 取得檔案的縮圖 URL
   *
   * @param userId - 用戶 ID
   * @param fileId - 檔案 ID
   * @returns 縮圖 URL
   */
  async getPhotoThumbnail(userId: string, fileId: string): Promise<string | null> {
    const drive = await this.getDriveClient(userId);

    try {
      const file = await drive.files.get({
        fileId,
        fields: 'thumbnailLink',
      });

      return file.data.thumbnailLink || null;
    } catch (error) {
      this.logger.error(`Failed to get thumbnail: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 取得檔案詳細資訊
   */
  async getFileInfo(userId: string, fileId: string): Promise<DriveFile> {
    const drive = await this.getDriveClient(userId);

    try {
      const file = await drive.files.get({
        fileId,
        fields:
          'id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webViewLink, webContentLink',
      });

      return {
        id: file.data.id!,
        name: file.data.name!,
        mimeType: file.data.mimeType!,
        size: file.data.size,
        createdTime: file.data.createdTime,
        modifiedTime: file.data.modifiedTime,
        thumbnailLink: file.data.thumbnailLink,
        webViewLink: file.data.webViewLink,
        webContentLink: file.data.webContentLink,
      };
    } catch (error) {
      if (error.code === 404) {
        throw new NotFoundException('檔案不存在');
      }
      this.logger.error(`Failed to get file info: ${error.message}`, error.stack);
      throw new InternalServerErrorException('無法取得檔案資訊');
    }
  }

  /**
   * 創建資料夾
   */
  async createFolder(userId: string, folderName: string, parentFolderId?: string): Promise<string> {
    const drive = await this.getDriveClient(userId);

    try {
      const folderMetadata: drive_v3.Schema$File = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId];
      }

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      this.logger.log(`Created folder: ${folderName} (${folder.data.id})`);
      return folder.data.id!;
    } catch (error) {
      this.logger.error(`Failed to create folder: ${error.message}`, error.stack);
      throw new InternalServerErrorException('無法建立資料夾');
    }
  }

  /**
   * 取得副檔名
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  }
}
