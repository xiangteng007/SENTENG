import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { SmartHomeProduct } from './entities/smart-home-product.entity';
import { AqaraCrawlerService } from './aqara-crawler.service';
import { SyncResultDto, SmartHomeQueryDto } from './dto/smart-home.dto';
import { ExportSmartHomeItemDto, ExportSmartHomeResponseDto } from './dto/export-smart-home.dto';
import { GoogleSheetsService } from '../integrations/google-sheets.service';

@Injectable()
export class SmartHomeService {
  private readonly logger = new Logger(SmartHomeService.name);
  private isSyncing = false;

  constructor(
    @InjectRepository(SmartHomeProduct)
    private readonly productRepo: Repository<SmartHomeProduct>,
    private readonly crawlerService: AqaraCrawlerService,
    private readonly googleSheetsService: GoogleSheetsService
  ) {}

  // Run every Sunday at 3:00 AM
  @Cron('0 3 * * 0')
  async scheduledSync(): Promise<void> {
    this.logger.log('Starting scheduled weekly sync...');
    try {
      await this.syncProducts();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scheduled sync failed: ${errorMessage}`);
    }
  }

  async syncProducts(): Promise<SyncResultDto> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedAt: new Date(),
        totalProducts: 0,
        newProducts: 0,
        updatedProducts: 0,
        errors: ['Sync already in progress'],
      };
    }

    this.isSyncing = true;
    const result: SyncResultDto = {
      success: true,
      syncedAt: new Date(),
      totalProducts: 0,
      newProducts: 0,
      updatedProducts: 0,
      errors: [],
    };

    try {
      this.logger.log('Starting product sync from Aqara...');

      const products = await this.crawlerService.crawlProducts();
      result.totalProducts = products.length;

      for (const product of products) {
        try {
          const existing = await this.productRepo.findOne({
            where: { productId: product.productId },
          });

          if (existing) {
            // Update existing product
            await this.productRepo.update(existing.id, {
              name: product.name,
              category: product.category,
              subcategory: product.subcategory,
              imageUrl: product.imageUrl,
              detailUrl: product.detailUrl,
              protocols: product.protocols,
              specs: product.specs,
              lastSyncedAt: new Date(),
            });
            result.updatedProducts++;
          } else {
            // Create new product
            const newProduct = this.productRepo.create({
              productId: product.productId,
              name: product.name,
              category: product.category,
              subcategory: product.subcategory,
              imageUrl: product.imageUrl,
              detailUrl: product.detailUrl,
              protocols: product.protocols,
              specs: product.specs,
              source: 'aqara',
              lastSyncedAt: new Date(),
            });
            await this.productRepo.save(newProduct);
            result.newProducts++;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors = result.errors || [];
          result.errors.push(`Error processing ${product.productId}: ${errorMessage}`);
        }
      }

      this.logger.log(
        `Sync completed: ${result.newProducts} new, ${result.updatedProducts} updated`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.success = false;
      result.errors = result.errors || [];
      result.errors.push(errorMessage);
      this.logger.error(`Sync failed: ${errorMessage}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  async findAll(query: SmartHomeQueryDto): Promise<SmartHomeProduct[]> {
    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.subcategory) {
      where.subcategory = query.subcategory;
    }

    if (query.activeOnly !== false) {
      where.isActive = true;
    }

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    return this.productRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SmartHomeProduct | null> {
    return this.productRepo.findOne({ where: { id } });
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    const result = await this.productRepo
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('p.isActive = true')
      .groupBy('p.category')
      .orderBy('p.category', 'ASC')
      .getRawMany();

    return result;
  }

  async getSubcategories(category: string): Promise<{ subcategory: string; count: number }[]> {
    const result = await this.productRepo
      .createQueryBuilder('p')
      .select('p.subcategory', 'subcategory')
      .addSelect('COUNT(*)', 'count')
      .where('p.category = :category', { category })
      .andWhere('p.isActive = true')
      .groupBy('p.subcategory')
      .orderBy('p.subcategory', 'ASC')
      .getRawMany();

    return result;
  }

  async getSyncStatus(): Promise<{ isSyncing: boolean; lastSync: Date | null }> {
    const lastProduct = await this.productRepo.findOne({
      where: { lastSyncedAt: Not(null) } as any,
      order: { lastSyncedAt: 'DESC' },
    });

    return {
      isSyncing: this.isSyncing,
      lastSync: lastProduct?.lastSyncedAt || null,
    };
  }

  async exportToGoogleSheets(
    userId: string,
    items: ExportSmartHomeItemDto[],
    options?: { title?: string; projectName?: string }
  ): Promise<ExportSmartHomeResponseDto> {
    this.logger.log(
      `Exporting ${items.length} smart home items to Google Sheets for user ${userId}`
    );

    const estimateLines = items.map(item => ({
      id: item.productId,
      categoryL1: 'smart_home',
      categoryL2: item.subcategory || '智慧家居',
      name: item.name,
      spec: item.spec || '',
      unit: '組',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    return this.googleSheetsService.exportEstimate(userId, {
      estimateLines,
      options: {
        title: options?.title || '智慧家居報價清單',
        projectName: options?.projectName,
        includeMetadata: true,
      },
    });
  }
}
