# DTO 驗證規範 (BE-001)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 驗證框架

使用 **class-validator** + **class-transformer** 組合。

---

## 裝飾器速查表

### 基本驗證

| 裝飾器 | 用途 | 範例 |
|:-------|:-----|:-----|
| `@IsString()` | 字串 | 名稱、描述 |
| `@IsNumber()` | 數字 | 金額、數量 |
| `@IsInt()` | 整數 | ID、序號 |
| `@IsBoolean()` | 布林 | 開關、狀態 |
| `@IsEmail()` | Email | 聯絡信箱 |
| `@IsDate()` | 日期 | 建立日期 |
| `@IsEnum(Enum)` | 列舉 | 狀態、類型 |
| `@IsUUID()` | UUID | 資源 ID |

### 字串驗證

| 裝飾器 | 用途 | 範例 |
|:-------|:-----|:-----|
| `@Length(min, max)` | 長度限制 | 密碼 8-50 |
| `@MinLength(n)` | 最小長度 | 名稱至少 2 |
| `@MaxLength(n)` | 最大長度 | 備註最多 500 |
| `@Matches(regex)` | 正則匹配 | 電話格式 |
| `@IsUrl()` | URL | 網站連結 |
| `@IsMobilePhone('zh-TW')` | 手機 | 台灣手機 |

### 數字驗證

| 裝飾器 | 用途 | 範例 |
|:-------|:-----|:-----|
| `@Min(n)` | 最小值 | 金額 >= 0 |
| `@Max(n)` | 最大值 | 數量 <= 9999 |
| `@IsPositive()` | 正數 | 價格 |
| `@IsNegative()` | 負數 | 折扣 |

### 陣列/物件

| 裝飾器 | 用途 |
|:-------|:-----|
| `@IsArray()` | 陣列 |
| `@ArrayMinSize(n)` | 最少元素 |
| `@ArrayMaxSize(n)` | 最多元素 |
| `@ValidateNested()` | 巢狀物件驗證 |
| `@Type(() => Class)` | 類型轉換 |

### 條件/可選

| 裝飾器 | 用途 |
|:-------|:-----|
| `@IsOptional()` | 可選欄位 |
| `@ValidateIf(condition)` | 條件驗證 |
| `@IsNotEmpty()` | 非空 |

---

## 標準 DTO 範本

### Create DTO

```typescript
// dto/create-project.dto.ts
import { 
  IsString, IsNumber, IsOptional, IsEnum, IsUUID,
  IsDate, Min, MaxLength, ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: '專案名稱', example: '信義區辦公室裝修' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '客戶 ID' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: '專案預算' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiProperty({ description: '狀態', enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiPropertyOptional({ description: '預計開工日' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: '項目清單' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemDto)
  items?: ProjectItemDto[];
}
```

### Update DTO

```typescript
// dto/update-project.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

### Query DTO

```typescript
// dto/find-projects.dto.ts
export class FindProjectsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
```

---

## 自訂驗證器

```typescript
// common/validators/is-taiwan-phone.validator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsTaiwanPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTaiwanPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true;
          return /^09\d{8}$/.test(value);
        },
        defaultMessage() {
          return '請輸入有效的台灣手機號碼';
        },
      },
    });
  };
}

// 使用
@IsTaiwanPhone()
phone: string;
```

---

## 錯誤訊息

### 中文化

```typescript
// dto/create-client.dto.ts
@IsString({ message: '名稱必須是字串' })
@MinLength(2, { message: '名稱至少需要 2 個字元' })
@MaxLength(50, { message: '名稱不可超過 50 個字元' })
name: string;

@IsEmail({}, { message: '請輸入有效的電子郵件' })
email: string;
```

---

## 覆蓋率檢查

```bash
# 檢查所有 Controller 是否有 DTO 驗證
grep -r "@Body\(\)" apps/api/src/modules --include="*.controller.ts" | \
  grep -v "dto" && echo "⚠️ 有 Controller 缺少 DTO"
```
