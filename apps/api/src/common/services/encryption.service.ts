import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * 敏感資料加密服務
 *
 * 提供欄位級加密 (Field-Level Encryption) 功能
 *
 * 支援功能：
 * - AES-256-GCM 加密
 * - 密鑰輪換
 * - 雜湊 (用於查詢)
 * - 遮罩 (用於顯示)
 */

export interface EncryptionConfig {
  masterKey: string;
  algorithm: string;
  ivLength: number;
  tagLength: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly config: EncryptionConfig;
  private readonly KEY_VERSION = 1;

  constructor(private readonly configService: ConfigService) {
    const masterKey = this.configService.get<string>("ENCRYPTION_KEY");

    this.config = {
      masterKey: masterKey || this.generateDefaultKey(),
      algorithm: "aes-256-gcm",
      ivLength: 16,
      tagLength: 16,
    };

    if (!masterKey) {
      this.logger.warn(
        "ENCRYPTION_KEY not set. Using auto-generated key (NOT for production)",
      );
    }
  }

  /**
   * 加密敏感資料
   */
  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(this.config.ivLength);
    const key = this.deriveKey();

    const cipher = crypto.createCipheriv(
      this.config.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
    );

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      version: this.KEY_VERSION,
    };
  }

  /**
   * 解密敏感資料
   */
  decrypt(encrypted: EncryptedData): string {
    const key = this.deriveKey(encrypted.version);
    const iv = Buffer.from(encrypted.iv, "hex");
    const tag = Buffer.from(encrypted.tag, "hex");

    const decipher = crypto.createDecipheriv(
      this.config.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
    );

    decipher.setAuthTag(tag);

    let plaintext = decipher.update(encrypted.ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");

    return plaintext;
  }

  /**
   * 加密為字串 (便於存儲)
   */
  encryptToString(plaintext: string): string {
    const encrypted = this.encrypt(plaintext);
    return Buffer.from(JSON.stringify(encrypted)).toString("base64");
  }

  /**
   * 從字串解密
   */
  decryptFromString(encryptedString: string): string {
    const encrypted: EncryptedData = JSON.parse(
      Buffer.from(encryptedString, "base64").toString("utf8"),
    );
    return this.decrypt(encrypted);
  }

  /**
   * 產生雜湊 (用於查詢比對)
   */
  hash(value: string): string {
    return crypto
      .createHmac("sha256", this.config.masterKey)
      .update(value)
      .digest("hex");
  }

  /**
   * 遮罩敏感資料 (用於顯示)
   */
  mask(value: string, visibleChars = 4, maskChar = "*"): string {
    if (!value || value.length <= visibleChars) {
      return maskChar.repeat(value?.length || 0);
    }

    const visible = value.slice(-visibleChars);
    const masked = maskChar.repeat(value.length - visibleChars);
    return masked + visible;
  }

  /**
   * 遮罩身分證字號
   */
  maskNationalId(nationalId: string): string {
    if (!nationalId || nationalId.length < 10) {
      return "**********";
    }
    return nationalId[0] + "********" + nationalId.slice(-1);
  }

  /**
   * 遮罩電話號碼
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 6) {
      return "****";
    }
    return phone.slice(0, 4) + "****" + phone.slice(-2);
  }

  /**
   * 遮罩信用卡號
   */
  maskCreditCard(cardNumber: string): string {
    const clean = cardNumber.replace(/\D/g, "");
    if (clean.length < 12) {
      return "****";
    }
    return clean.slice(0, 4) + " **** **** " + clean.slice(-4);
  }

  /**
   * 遮罩銀行帳號
   */
  maskBankAccount(account: string): string {
    if (!account || account.length < 4) {
      return "****";
    }
    return "****" + account.slice(-4);
  }

  /**
   * 遮罩 Email
   */
  maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) {
      return "****@****.***";
    }

    const maskedLocal =
      local.length <= 2
        ? "**"
        : local[0] + "*".repeat(local.length - 2) + local.slice(-1);

    return `${maskedLocal}@${domain}`;
  }

  /**
   * 衍生加密金鑰
   */
  private deriveKey(version: number = this.KEY_VERSION): Buffer {
    return crypto.scryptSync(
      this.config.masterKey,
      `senteng-erp-v${version}`,
      32,
    );
  }

  /**
   * 產生預設金鑰 (僅開發用)
   */
  private generateDefaultKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * 驗證加密金鑰設定
   */
  validateConfig(): boolean {
    if (!this.config.masterKey || this.config.masterKey.length < 32) {
      this.logger.error("ENCRYPTION_KEY must be at least 32 characters");
      return false;
    }
    return true;
  }
}

/**
 * 加密欄位裝飾器 (TypeORM Transformer)
 */
export const encryptedTransformer = (encryptionService: EncryptionService) => ({
  to: (value: string) =>
    value ? encryptionService.encryptToString(value) : null,
  from: (value: string) =>
    value ? encryptionService.decryptFromString(value) : null,
});
