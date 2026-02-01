/**
 * site-photos.service.ts
 *
 * 工地照片服務
 * 整合 Google Drive 進行照片管理
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SitePhoto } from "./site-photo.entity";
import { ProjectsService } from "../projects/projects.service";
import {
  GoogleDriveService,
  DriveFile,
} from "../integrations/google/google-drive.service";

export interface UploadPhotoDto {
  projectId: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface PhotoWithDriveInfo extends SitePhoto {
  driveInfo?: DriveFile;
}

@Injectable()
export class SitePhotosService {
  private readonly logger = new Logger(SitePhotosService.name);

  constructor(
    @InjectRepository(SitePhoto)
    private readonly photoRepo: Repository<SitePhoto>,
    private readonly projectsService: ProjectsService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  /**
   * 上傳工地照片到專案的 Google Drive 資料夾
   */
  async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
    dto: UploadPhotoDto,
  ): Promise<SitePhoto> {
    // 取得專案資訊
    const project = await this.projectsService.findOne(dto.projectId);

    if (!project) {
      throw new NotFoundException("專案不存在");
    }

    if (!project.driveFolder) {
      throw new BadRequestException("此專案尚未設定 Google Drive 資料夾");
    }

    try {
      // 確保「工程照片」資料夾存在
      const photoFolderId =
        await this.googleDriveService.ensureProjectPhotoFolder(
          userId,
          project.driveFolder,
        );

      // 上傳到 Google Drive
      const uploadResult = await this.googleDriveService.uploadPhoto(
        userId,
        photoFolderId,
        file,
        dto.description,
      );

      // 儲存到資料庫
      const photo = this.photoRepo.create({
        projectId: dto.projectId,
        fileName: uploadResult.fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        fileUrl: uploadResult.webViewLink, // Use Drive URL as main file URL
        driveFileId: uploadResult.fileId,
        driveFolderId: photoFolderId,
        driveUrl: uploadResult.webViewLink,
        thumbnailUrl: uploadResult.thumbnailLink || undefined,
        description: dto.description,
        category: dto.category,
        tags: dto.tags || [],
        uploadedBy: userId,
        capturedAt: new Date(), // Set current time as capture time
      });

      const savedPhoto = await this.photoRepo.save(photo);
      this.logger.log(
        `Photo uploaded: ${savedPhoto.id} for project ${dto.projectId}`,
      );

      return savedPhoto;
    } catch (error) {
      this.logger.error(
        `Failed to upload photo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 取得專案的所有照片
   */
  async getPhotosByProject(
    userId: string,
    projectId: string,
    includeDeleted = false,
  ): Promise<PhotoWithDriveInfo[]> {
    const queryBuilder = this.photoRepo
      .createQueryBuilder("photo")
      .where("photo.projectId = :projectId", { projectId })
      .orderBy("photo.createdAt", "DESC");

    if (!includeDeleted) {
      queryBuilder.andWhere("photo.deletedAt IS NULL");
    }

    const photos = await queryBuilder.getMany();

    // 可選：從 Drive 取得最新資訊
    // 這裡為效能考量，只返回資料庫記錄
    return photos;
  }

  /**
   * 取得單張照片
   */
  async getPhoto(photoId: string): Promise<SitePhoto> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException("照片不存在");
    }

    return photo;
  }

  /**
   * 刪除照片
   */
  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.getPhoto(photoId);

    try {
      // 從 Google Drive 刪除
      if (photo.driveFileId) {
        await this.googleDriveService.deletePhoto(userId, photo.driveFileId);
      }

      // 軟刪除資料庫記錄
      await this.photoRepo.softDelete(photoId);

      this.logger.log(`Photo deleted: ${photoId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete photo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 更新照片資訊
   */
  async updatePhoto(
    photoId: string,
    updates: Partial<Pick<SitePhoto, "description" | "category" | "tags">>,
  ): Promise<SitePhoto> {
    const photo = await this.getPhoto(photoId);

    if (updates.description !== undefined) {
      photo.description = updates.description;
    }
    if (updates.category !== undefined) {
      photo.category = updates.category;
    }
    if (updates.tags !== undefined) {
      photo.tags = updates.tags;
    }

    return this.photoRepo.save(photo);
  }

  /**
   * 取得專案照片統計
   */
  async getPhotoStats(projectId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    totalSize: number;
  }> {
    const photos = await this.photoRepo.find({
      where: { projectId },
    });

    const stats = {
      total: photos.length,
      byCategory: {} as Record<string, number>,
      totalSize: 0,
    };

    for (const photo of photos) {
      stats.totalSize += photo.size || 0;
      const category = photo.category || "未分類";
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    return stats;
  }
}
