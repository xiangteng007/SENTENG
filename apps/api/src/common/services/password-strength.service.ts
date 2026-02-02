/**
 * password-strength.service.ts | 密碼強度驗證服務
 *
 * 用途：驗證密碼是否符合安全政策
 *
 * 安全政策：
 * - 最少 8 個字元
 * - 至少 1 個大寫字母
 * - 至少 1 個小寫字母
 * - 至少 1 個數字
 * - 至少 1 個特殊字元
 * - 不可包含常見弱密碼
 *
 * 更新日期：2026-02-02
 */

import { Injectable, BadRequestException } from "@nestjs/common";

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

@Injectable()
export class PasswordStrengthService {
  // 常見弱密碼清單
  private readonly commonPasswords = [
    "password",
    "123456",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "iloveyou",
    "master",
    "sunshine",
    "princess",
  ];

  /**
   * 驗證密碼強度
   */
  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 長度檢查
    if (password.length < 8) {
      errors.push("密碼長度至少需要 8 個字元");
    } else {
      score += 20;
      if (password.length >= 12) score += 10;
      if (password.length >= 16) score += 10;
    }

    // 大寫字母檢查
    if (!/[A-Z]/.test(password)) {
      errors.push("密碼需包含至少 1 個大寫字母");
      suggestions.push("加入大寫字母 (A-Z)");
    } else {
      score += 15;
    }

    // 小寫字母檢查
    if (!/[a-z]/.test(password)) {
      errors.push("密碼需包含至少 1 個小寫字母");
      suggestions.push("加入小寫字母 (a-z)");
    } else {
      score += 15;
    }

    // 數字檢查
    if (!/[0-9]/.test(password)) {
      errors.push("密碼需包含至少 1 個數字");
      suggestions.push("加入數字 (0-9)");
    } else {
      score += 15;
    }

    // 特殊字元檢查
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("密碼需包含至少 1 個特殊字元");
      suggestions.push("加入特殊字元 (!@#$%^&*)");
    } else {
      score += 15;
    }

    // 常見弱密碼檢查
    if (this.isCommonPassword(password)) {
      errors.push("密碼過於常見，請選擇更獨特的密碼");
      score = Math.min(score, 20);
    }

    // 連續字元檢查
    if (this.hasSequentialChars(password)) {
      suggestions.push("避免連續字元 (如 123, abc)");
      score -= 10;
    }

    // 重複字元檢查
    if (this.hasRepeatingChars(password)) {
      suggestions.push("避免重複字元 (如 aaa, 111)");
      score -= 10;
    }

    // 確保分數在 0-100 範圍內
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      score,
      errors,
      suggestions,
    };
  }

  /**
   * 驗證密碼並拋出例外
   */
  validateOrThrow(password: string): void {
    const result = this.validate(password);
    if (!result.isValid) {
      throw new BadRequestException({
        error: "WEAK_PASSWORD",
        message: "密碼強度不足",
        details: result.errors.map((e) => ({
          field: "password",
          reason: "VALIDATION_FAILED",
          message: e,
        })),
      });
    }
  }

  /**
   * 取得密碼強度等級
   */
  getStrengthLevel(score: number): "weak" | "fair" | "good" | "strong" {
    if (score < 40) return "weak";
    if (score < 60) return "fair";
    if (score < 80) return "good";
    return "strong";
  }

  /**
   * 檢查是否為常見弱密碼
   */
  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.commonPasswords.some((common) =>
      lowerPassword.includes(common),
    );
  }

  /**
   * 檢查連續字元 (如 123, abc)
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      "0123456789",
      "abcdefghijklmnopqrstuvwxyz",
      "qwertyuiop",
      "asdfghjkl",
      "zxcvbnm",
    ];

    const lowerPassword = password.toLowerCase();
    for (const seq of sequences) {
      for (let i = 0; i < seq.length - 2; i++) {
        if (lowerPassword.includes(seq.substring(i, i + 3))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 檢查重複字元 (如 aaa, 111)
   */
  private hasRepeatingChars(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }
}
