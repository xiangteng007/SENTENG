import * as crypto from "crypto";

/**
 * SEC-003: PII Column Encryption Transformer
 *
 * TypeORM column transformer for encrypting Personally Identifiable Information (PII).
 * Uses AES-256-GCM for authenticated encryption.
 *
 * Usage:
 * @Column({ transformer: piiEncryptionTransformer })
 * phone: string;
 *
 * Environment Variables:
 * - PII_ENCRYPTION_KEY: 32-byte hex key for AES-256
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.PII_ENCRYPTION_KEY;

  if (!key) {
    console.warn(
      "[PII] Encryption key not set. Data will be stored unencrypted.",
    );
    return null;
  }

  // Support both hex and base64 encoded keys
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  } else if (key.length === 44) {
    return Buffer.from(key, "base64");
  }

  throw new Error(
    "PII_ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 base64 chars)",
  );
}

/**
 * Encrypt plaintext using AES-256-GCM
 */
function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  if (!key) return ciphertext;

  // Check if it's actually encrypted (has correct format)
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    // Not encrypted or legacy data
    return ciphertext;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error(
      "[PII] Decryption failed:",
      error instanceof Error ? error.message : String(error),
    );
    return ciphertext; // Return original if decryption fails
  }
}

/**
 * TypeORM Column Transformer for PII encryption
 */
export const piiEncryptionTransformer = {
  /**
   * Called when writing to database
   */
  to: (value: string | null): string | null => {
    if (value === null || value === undefined || value === "") {
      return value;
    }
    return encrypt(value);
  },

  /**
   * Called when reading from database
   */
  from: (value: string | null): string | null => {
    if (value === null || value === undefined || value === "") {
      return value;
    }
    return decrypt(value);
  },
};

/**
 * Transformer for partial encryption (only encrypt when long enough)
 * Useful for fields that may contain non-sensitive data
 */
export const optionalPiiTransformer = {
  to: (value: string | null): string | null => {
    if (!value || value.length < 4) return value;
    return encrypt(value);
  },
  from: (value: string | null): string | null => {
    if (!value || !value.includes(":")) return value;
    return decrypt(value);
  },
};

/**
 * Utility to mask PII for display
 * e.g., "0912345678" → "0912***678"
 */
export function maskPii(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars * 2) return value;

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = "*".repeat(Math.min(value.length - visibleChars * 2, 6));

  return `${start}${masked}${end}`;
}

/**
 * Utility to mask email for display
 * e.g., "john.doe@example.com" → "jo***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;

  const [local, domain] = email.split("@");
  const maskedLocal = local.length > 2 ? local.substring(0, 2) + "***" : local;

  return `${maskedLocal}@${domain}`;
}

export default piiEncryptionTransformer;
