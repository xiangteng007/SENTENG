import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Storage, Bucket } from "@google-cloud/storage";

/**
 * StorageService
 *
 * Google Cloud Storage (GCS) 檔案上傳與管理服務。
 * 支援檔案上傳、刪除，並提供 Signed URL 存取。
 *
 * 如果未設定 GCP_BUCKET_NAME，服務將以 disabled 模式運行，
 * 所有方法將拋出錯誤提示需要配置。
 *
 * @example
 * // 在 Controller 中使用
 * @Post('upload')
 * @UseInterceptors(FileInterceptor('file'))
 * async upload(@UploadedFile() file: Express.Multer.File) {
 *   const url = await this.storageService.uploadFile(file, 'avatars');
 *   return { url };
 * }
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storage: Storage | null = null;
  private readonly bucket: Bucket | null = null;
  private readonly bucketName: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>("GCP_PROJECT_ID");
    const keyFilePath = this.configService.get<string>("GCP_KEY_FILE_PATH");
    this.bucketName = this.configService.get<string>("GCP_BUCKET_NAME") || "";

    // Check if GCS is configured
    if (!this.bucketName) {
      this.isEnabled = false;
      this.logger.warn(
        "StorageService: GCP_BUCKET_NAME not set. Storage features are disabled.",
      );
      return;
    }

    this.isEnabled = true;

    // 初始化 Google Cloud Storage 客戶端
    // 在 Cloud Run 環境中，若未設定 keyFilePath，將自動使用 Application Default Credentials (ADC)
    if (keyFilePath) {
      this.storage = new Storage({
        projectId,
        keyFilename: keyFilePath,
      });
    } else {
      // Cloud Run 環境: 使用 ADC (服務帳戶自動注入)
      this.storage = new Storage({ projectId });
    }

    this.bucket = this.storage.bucket(this.bucketName);
    this.logger.log(
      `StorageService initialized with bucket: ${this.bucketName}`,
    );
  }

  /**
   * Check if storage is enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Ensure storage is configured before operations
   */
  private ensureEnabled(): void {
    if (!this.isEnabled || !this.bucket) {
      throw new InternalServerErrorException(
        "Storage not configured. Please set GCP_BUCKET_NAME environment variable.",
      );
    }
  }

  /**
   * 上傳檔案到 Google Cloud Storage
   *
   * @param file - Express Multer 檔案物件
   * @param destination - 目標資料夾路徑 (例如: 'avatars', 'documents/2026')
   * @returns 檔案的 Signed URL (預設 7 天有效)
   *
   * @throws InternalServerErrorException 當上傳失敗時
   *
   * @example
   * const url = await storageService.uploadFile(file, 'avatars');
   * // 回傳: https://storage.googleapis.com/bucket/avatars/abc123.jpg?signature=...
   */
  async uploadFile(
    file: Express.Multer.File,
    destination: string,
  ): Promise<string> {
    this.ensureEnabled();

    try {
      // 生成唯一檔名：timestamp + 隨機字串 + 原始副檔名
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const originalExt = this.getFileExtension(file.originalname);
      const fileName = `${destination}/${timestamp}-${randomSuffix}${originalExt}`;

      const blob = this.bucket!.file(fileName);

      // 上傳檔案到 GCS
      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          // 自訂 metadata
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
        // 預設不設為公開存取，使用 Signed URL
        public: false,
        resumable: false, // 對於小檔案禁用 resumable upload 以提升效能
      });

      // 生成 Signed URL (7 天有效期)
      const signedUrl = await this.generateSignedUrl(fileName);

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException("檔案上傳失敗，請稍後再試");
    }
  }

  /**
   * 從 Google Cloud Storage 刪除檔案
   *
   * @param fileUrl - 檔案的完整 URL 或 GCS 路徑
   *
   * @throws InternalServerErrorException 當刪除失敗時
   *
   * @example
   * await storageService.deleteFile('https://storage.googleapis.com/bucket/avatars/abc123.jpg');
   * // 或
   * await storageService.deleteFile('avatars/abc123.jpg');
   */
  async deleteFile(fileUrl: string): Promise<void> {
    this.ensureEnabled();

    try {
      // 從 URL 或路徑中提取檔案名稱
      const fileName = this.extractFileNameFromUrl(fileUrl);

      if (!fileName) {
        this.logger.warn(`Invalid file URL provided: ${fileUrl}`);
        return;
      }

      const file = this.bucket!.file(fileName);

      // 檢查檔案是否存在
      const [exists] = await file.exists();
      if (!exists) {
        this.logger.warn(`File does not exist: ${fileName}`);
        return;
      }

      await file.delete();
      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new InternalServerErrorException("檔案刪除失敗，請稍後再試");
    }
  }

  /**
   * 生成 Signed URL 供前端存取私有檔案
   *
   * @param fileName - GCS 中的檔案路徑
   * @param expiresInDays - URL 有效天數 (預設 7 天)
   * @returns Signed URL
   */
  async generateSignedUrl(
    fileName: string,
    expiresInDays: number = 7,
  ): Promise<string> {
    this.ensureEnabled();

    const file = this.bucket!.file(fileName);

    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    });

    return signedUrl;
  }

  /**
   * 取得檔案的公開 URL (需 Bucket 設定為公開或檔案設為公開)
   *
   * @param fileName - GCS 中的檔案路徑
   * @returns 公開 URL
   */
  getPublicUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }

  /**
   * 從檔名取得副檔名
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filename.substring(lastDot).toLowerCase();
  }

  /**
   * 從 URL 中提取 GCS 檔案路徑
   *
   * 支援格式:
   * - https://storage.googleapis.com/bucket-name/path/to/file.jpg
   * - https://storage.cloud.google.com/bucket-name/path/to/file.jpg
   * - gs://bucket-name/path/to/file.jpg
   * - path/to/file.jpg (直接路徑)
   */
  private extractFileNameFromUrl(fileUrl: string): string | null {
    if (!fileUrl) return null;

    // 移除 Signed URL 的 query parameters
    const urlWithoutQuery = fileUrl.split("?")[0];

    // Pattern 1: https://storage.googleapis.com/bucket-name/...
    const googleStoragePattern = new RegExp(
      `https?://storage\\.googleapis\\.com/${this.bucketName}/(.+)`,
    );
    const match1 = urlWithoutQuery.match(googleStoragePattern);
    if (match1) return match1[1];

    // Pattern 2: https://storage.cloud.google.com/bucket-name/...
    const cloudStoragePattern = new RegExp(
      `https?://storage\\.cloud\\.google\\.com/${this.bucketName}/(.+)`,
    );
    const match2 = urlWithoutQuery.match(cloudStoragePattern);
    if (match2) return match2[1];

    // Pattern 3: gs://bucket-name/...
    const gsPattern = new RegExp(`gs://${this.bucketName}/(.+)`);
    const match3 = urlWithoutQuery.match(gsPattern);
    if (match3) return match3[1];

    // Pattern 4: 直接是檔案路徑
    if (
      !urlWithoutQuery.startsWith("http") &&
      !urlWithoutQuery.startsWith("gs://")
    ) {
      return urlWithoutQuery;
    }

    return null;
  }
}
