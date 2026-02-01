import {
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  MaxLength,
  IsBoolean,
  IsUrl,
} from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(["GOOGLE", "LINE", "EMAIL"])
  authProvider?: string = "GOOGLE";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  authUid?: string;

  @IsOptional()
  @IsIn(["super_admin", "admin", "manager", "user", "viewer"])
  role?: string = "user";
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(["super_admin", "admin", "manager", "user", "viewer"])
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(["super_admin", "admin", "manager", "user", "viewer"])
  role?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
