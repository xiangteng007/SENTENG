/**
 * contact.dto.ts
 *
 * 聯絡人相關 DTOs
 */

import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * 建立聯絡人請求
 */
export class CreateContactDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/**
 * 更新聯絡人請求
 */
export class UpdateContactDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 聯絡人回應
 */
export class ContactResponseDto {
  id: string;
  fullName: string;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  title: string | null;
  department: string | null;
  note: string | null;
  tags: string[];
  isPrimary: boolean;
  isActive: boolean;
  syncStatus: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
