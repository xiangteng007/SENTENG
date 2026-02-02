/**
 * PII 加密工具
 * LEGAL-002: Personal Identifiable Information Encryption
 *
 * 提供 AES-256-GCM 加密以保護敏感個資
 * 符合台灣個資法與 GDPR 要求
 */

import * as crypto from "crypto";

// ============================================
// Configuration
// ============================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

// ============================================
// Types
// ============================================

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  tag: string; // Base64 encoded
  version: number;
}

export interface PIIField {
  fieldName: string;
  entityType: string;
  encrypted: boolean;
}

// PII 欄位定義
export const PII_FIELDS: PIIField[] = [
  { fieldName: "idNumber", entityType: "client", encrypted: true },
  { fieldName: "taxId", entityType: "client", encrypted: true },
  { fieldName: "phone", entityType: "client", encrypted: true },
  { fieldName: "email", entityType: "client", encrypted: true },
  { fieldName: "address", entityType: "client", encrypted: true },
  { fieldName: "bankAccount", entityType: "vendor", encrypted: true },
  { fieldName: "taxId", entityType: "vendor", encrypted: true },
  { fieldName: "contactPhone", entityType: "vendor", encrypted: true },
  { fieldName: "emergencyContact", entityType: "employee", encrypted: true },
  { fieldName: "salary", entityType: "employee", encrypted: true },
];

// ============================================
// Encryption Service
// ============================================

export class PIIEncryptionService {
  private masterKey: Buffer;
  private keyVersion: number;

  constructor() {
    // 從環境變數載入主密鑰
    const keyHex = process.env.PII_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      console.warn(
        "[PII] Warning: PII_ENCRYPTION_KEY not set or invalid. Using default key for development.",
      );
      // 開發環境使用預設密鑰（生產環境必須設置環境變數）
      this.masterKey = crypto.scryptSync("dev-secret-key", "senteng-salt", KEY_LENGTH);
    } else {
      this.masterKey = Buffer.from(keyHex, "hex");
    }
    this.keyVersion = parseInt(process.env.PII_KEY_VERSION || "1", 10);
  }

  /**
   * 加密 PII 資料
   */
  encrypt(plaintext: string): EncryptedData {
    if (!plaintext) {
      return null as unknown as EncryptedData;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "base64");
    ciphertext += cipher.final("base64");

    const tag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      version: this.keyVersion,
    };
  }

  /**
   * 解密 PII 資料
   */
  decrypt(encrypted: EncryptedData): string {
    if (!encrypted || !encrypted.ciphertext) {
      return "";
    }

    try {
      const iv = Buffer.from(encrypted.iv, "base64");
      const tag = Buffer.from(encrypted.tag, "base64");
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(tag);

      let plaintext = decipher.update(encrypted.ciphertext, "base64", "utf8");
      plaintext += decipher.final("utf8");

      return plaintext;
    } catch (error) {
      console.error("[PII] Decryption failed:", error);
      return "[DECRYPTION_ERROR]";
    }
  }

  /**
   * 加密物件中的 PII 欄位
   */
  encryptObject<T extends Record<string, any>>(obj: T, entityType: string): T {
    const result = { ...obj };
    const piiFieldNames = PII_FIELDS.filter((f) => f.entityType === entityType && f.encrypted).map(
      (f) => f.fieldName,
    );

    for (const fieldName of piiFieldNames) {
      if (result[fieldName] && typeof result[fieldName] === "string") {
        (result as any)[`${fieldName}_encrypted`] = this.encrypt(result[fieldName]);
        delete (result as any)[fieldName];
      }
    }

    return result;
  }

  /**
   * 解密物件中的 PII 欄位
   */
  decryptObject<T extends Record<string, any>>(obj: T, entityType: string): T {
    const result = { ...obj };
    const piiFieldNames = PII_FIELDS.filter((f) => f.entityType === entityType && f.encrypted).map(
      (f) => f.fieldName,
    );

    for (const fieldName of piiFieldNames) {
      const encryptedFieldName = `${fieldName}_encrypted`;
      if (result[encryptedFieldName]) {
        (result as any)[fieldName] = this.decrypt(result[encryptedFieldName]);
        delete (result as any)[encryptedFieldName];
      }
    }

    return result;
  }

  /**
   * 遮罩 PII 資料（用於記錄與顯示）
   */
  mask(value: string, type: "phone" | "email" | "id" | "account" = "id"): string {
    if (!value) return "";

    switch (type) {
      case "phone":
        // 0912-345-678 -> 0912-***-678
        return value.replace(/(\d{4})[\d-]{4,}(\d{3})$/, "$1-***-$2");
      case "email":
        // test@example.com -> t***@example.com
        const [local, domain] = value.split("@");
        if (!domain) return value;
        return `${local.charAt(0)}***@${domain}`;
      case "id":
        // A123456789 -> A1234*****
        return value.substring(0, 5) + "*".repeat(Math.max(0, value.length - 5));
      case "account":
        // 12345678901234 -> ****5678901234
        return "****" + value.substring(Math.max(0, value.length - 10));
      default:
        return "*".repeat(value.length);
    }
  }
}

// ============================================
// Document Retention Policy
// LEGAL-003: 文件留存政策
// ============================================

export interface RetentionPolicy {
  documentType: string;
  retentionYears: number;
  legalBasis: string;
  description: string;
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    documentType: "contract",
    retentionYears: 15,
    legalBasis: "民法第125條 (一般消滅時效)",
    description: "工程契約書、變更設計書、附件",
  },
  {
    documentType: "invoice",
    retentionYears: 5,
    legalBasis: "商業會計法第38條",
    description: "發票、收據、統一發票",
  },
  {
    documentType: "accounting",
    retentionYears: 10,
    legalBasis: "商業會計法第38條",
    description: "會計帳簿、憑證、報表",
  },
  {
    documentType: "tax",
    retentionYears: 7,
    legalBasis: "稅捐稽徵法第21條",
    description: "稅務申報文件、扣繳憑單",
  },
  {
    documentType: "employee",
    retentionYears: 5,
    legalBasis: "勞基法第23條",
    description: "勞工名卡、薪資紀錄",
  },
  {
    documentType: "safety",
    retentionYears: 5,
    legalBasis: "職安法第37條",
    description: "職安紀錄、災害調查報告",
  },
  {
    documentType: "construction",
    retentionYears: 15,
    legalBasis: "民法第191-1條 (建築瑕疵責任)",
    description: "施工日誌、驗收紀錄、品質文件",
  },
  {
    documentType: "warranty",
    retentionYears: 15,
    legalBasis: "工程保固慣例",
    description: "保固書、維修紀錄",
  },
];

export class RetentionPolicyService {
  /**
   * 取得文件類型的留存年限
   */
  getRetentionYears(documentType: string): number {
    const policy = RETENTION_POLICIES.find((p) => p.documentType === documentType);
    return policy?.retentionYears || 5; // 預設 5 年
  }

  /**
   * 計算文件的銷毀日期
   */
  calculateDestructionDate(documentType: string, createdAt: Date): Date {
    const years = this.getRetentionYears(documentType);
    const destructionDate = new Date(createdAt);
    destructionDate.setFullYear(destructionDate.getFullYear() + years);
    return destructionDate;
  }

  /**
   * 檢查文件是否可以銷毀
   */
  canDestroy(documentType: string, createdAt: Date): boolean {
    const destructionDate = this.calculateDestructionDate(documentType, createdAt);
    return new Date() > destructionDate;
  }

  /**
   * 取得所有留存政策
   */
  getAllPolicies(): RetentionPolicy[] {
    return RETENTION_POLICIES;
  }

  /**
   * 取得即將到期的文件（用於提醒）
   */
  getExpiringDocumentsQuery(documentType: string, daysBeforeExpiry: number = 90): {
    minCreatedAt: Date;
    maxCreatedAt: Date;
  } {
    const years = this.getRetentionYears(documentType);
    const now = new Date();

    // 計算應該創建在什麼時間範圍內的文件即將到期
    const maxCreatedAt = new Date(now);
    maxCreatedAt.setFullYear(maxCreatedAt.getFullYear() - years);

    const minCreatedAt = new Date(maxCreatedAt);
    minCreatedAt.setDate(minCreatedAt.getDate() - daysBeforeExpiry);

    return { minCreatedAt, maxCreatedAt };
  }
}

// ============================================
// Singleton Exports
// ============================================

export const piiService = new PIIEncryptionService();
export const retentionService = new RetentionPolicyService();
