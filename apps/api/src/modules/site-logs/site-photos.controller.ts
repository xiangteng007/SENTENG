/**
 * site-photos.controller.ts
 *
 * 工地照片 API 控制器
 * 整合 Google Drive 進行照片管理
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SitePhotosService, UploadPhotoDto } from './site-photos.service';

@ApiTags('Site Photos')
@ApiBearerAuth()
@Controller('site-photos')
@UseGuards(JwtAuthGuard)
export class SitePhotosController {
  constructor(private readonly sitePhotosService: SitePhotosService) {}

  /**
   * 上傳工地照片到專案的 Google Drive 資料夾
   */
  @Post('upload')
  @ApiOperation({ summary: '上傳工地照片' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @Body('description') description?: string,
    @Body('category') category?: string,
    @Body('tags') tags?: string
  ) {
    const userId = req.user?.id || req.user?.sub;

    const dto: UploadPhotoDto = {
      projectId,
      description,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    };

    return this.sitePhotosService.uploadPhoto(userId, file, dto);
  }

  /**
   * 取得專案的所有照片
   */
  @Get('project/:projectId')
  @ApiOperation({ summary: '取得專案照片列表' })
  async getPhotosByProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('includeDeleted') includeDeleted?: string
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.sitePhotosService.getPhotosByProject(userId, projectId, includeDeleted === 'true');
  }

  /**
   * 取得單張照片詳情
   */
  @Get(':id')
  @ApiOperation({ summary: '取得照片詳情' })
  async getPhoto(@Param('id') id: string) {
    return this.sitePhotosService.getPhoto(id);
  }

  /**
   * 刪除照片
   */
  @Delete(':id')
  @ApiOperation({ summary: '刪除照片' })
  async deletePhoto(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub;
    await this.sitePhotosService.deletePhoto(userId, id);
    return { success: true, message: '照片已刪除' };
  }

  /**
   * 更新照片資訊
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新照片資訊' })
  async updatePhoto(
    @Param('id') id: string,
    @Body() body: { description?: string; category?: string; tags?: string[] }
  ) {
    return this.sitePhotosService.updatePhoto(id, body);
  }

  /**
   * 取得專案照片統計
   */
  @Get('project/:projectId/stats')
  @ApiOperation({ summary: '取得專案照片統計' })
  async getPhotoStats(@Param('projectId') projectId: string) {
    return this.sitePhotosService.getPhotoStats(projectId);
  }
}
