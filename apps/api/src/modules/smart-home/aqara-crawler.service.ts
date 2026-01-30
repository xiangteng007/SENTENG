import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

export interface AqaraProduct {
  productId: string;
  name: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  detailUrl?: string;
  protocols?: string[];
  specs?: Record<string, string>;
}

@Injectable()
export class AqaraCrawlerService {
  private readonly logger = new Logger(AqaraCrawlerService.name);
  private readonly baseUrl = 'https://aqara.cn';

  // Category mapping from Chinese to English
  private readonly categoryMapping: Record<string, string> = {
    智能门锁: 'smart_lock',
    开关插座: 'switch',
    智能窗帘: 'curtain',
    智能网关: 'gateway',
    传感监测: 'sensor',
    人体监测: 'motion_sensor',
    门窗监测: 'door_sensor',
    温湿监测: 'climate_sensor',
    水浸监测: 'water_sensor',
    烟雾监测: 'smoke_sensor',
    空气监测: 'air_sensor',
    摄像监控: 'camera',
    生活电器: 'appliance',
  };

  async crawlProducts(): Promise<AqaraProduct[]> {
    this.logger.log('Starting Aqara product crawl...');
    const products: AqaraProduct[] = [];
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Navigate to product center
      await page.goto(`${this.baseUrl}/prodCenter`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for sidebar to load
      await page.waitForSelector('.sidebar', { timeout: 10000 }).catch(() => {
        this.logger.warn('Sidebar not found, trying alternative selector');
      });

      // Get all category links
      const categories = await this.extractCategories(page);
      this.logger.log(`Found ${categories.length} categories`);

      for (const category of categories) {
        try {
          // Click on category
          await page.click(`text=${category.name}`);
          await page.waitForTimeout(2000);

          // Extract products from current category
          const categoryProducts = await this.extractProductsFromCategory(page, category.name);
          products.push(...categoryProducts);

          this.logger.log(`Extracted ${categoryProducts.length} products from ${category.name}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error extracting category ${category.name}: ${errorMessage}`);
        }
      }

      await browser.close();
      this.logger.log(`Crawl completed. Total products: ${products.length}`);

      return products;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Crawl failed: ${errorMessage}`);
      if (browser) await browser.close();
      throw error;
    }
  }

  private async extractCategories(page: Page): Promise<{ name: string; selector: string }[]> {
    const categories: { name: string; selector: string }[] = [];

    try {
      // Get sidebar category items
      const categoryElements = await page.$$('.sidebar li, .category-item, [class*="category"]');

      for (const el of categoryElements) {
        const text = await el.textContent();
        if (text && text.trim()) {
          categories.push({
            name: text.trim(),
            selector: `text=${text.trim()}`,
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error extracting categories: ${errorMessage}`);
    }

    // Fallback: known categories
    if (categories.length === 0) {
      const knownCategories = [
        '智能门锁',
        '开关插座',
        '智能窗帘',
        '智能网关',
        '传感监测',
        '摄像监控',
        '生活电器',
      ];
      return knownCategories.map(name => ({ name, selector: `text=${name}` }));
    }

    return categories;
  }

  private async extractProductsFromCategory(
    page: Page,
    categoryName: string
  ): Promise<AqaraProduct[]> {
    const products: AqaraProduct[] = [];

    try {
      // Wait for product list to load
      await page
        .waitForSelector('li, .product-item, [class*="product"]', { timeout: 5000 })
        .catch(() => {});

      // Get all product elements
      const productElements = await page.$$(
        '.product-list li, .product-item, [class*="product-card"]'
      );

      for (const el of productElements) {
        try {
          const nameEl = await el.$('h3, .product-name, .title, p');
          const imgEl = await el.$('img');
          const linkEl = await el.$('a');

          const name = nameEl ? await nameEl.textContent() : null;
          const imageUrl = imgEl ? await imgEl.getAttribute('src') : null;
          const href = linkEl ? await linkEl.getAttribute('href') : null;

          if (name && name.trim()) {
            const productId = href ? href.split('/').pop()?.replace('_overview', '') || '' : '';

            products.push({
              productId:
                productId || `aqara-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: name.trim(),
              category: categoryName,
              subcategory: this.categoryMapping[categoryName] || categoryName,
              imageUrl: imageUrl
                ? imageUrl.startsWith('http')
                  ? imageUrl
                  : `${this.baseUrl}${imageUrl}`
                : undefined,
              detailUrl: href
                ? href.startsWith('http')
                  ? href
                  : `${this.baseUrl}${href}`
                : undefined,
            });
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Error extracting product: ${errorMessage}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in extractProductsFromCategory: ${errorMessage}`);
    }

    return products;
  }

  async getProductSpecs(productUrl: string): Promise<Record<string, string>> {
    const specs: Record<string, string> = {};
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      // Navigate to spec page
      const specUrl = productUrl.replace('_overview', '_spec');
      await page.goto(specUrl, { waitUntil: 'networkidle', timeout: 15000 });

      // Extract spec table
      const rows = await page.$$('table tr, .spec-item, [class*="spec"]');

      for (const row of rows) {
        const cells = await row.$$('td, th, .label, .value');
        if (cells.length >= 2) {
          const key = await cells[0].textContent();
          const value = await cells[1].textContent();
          if (key && value) {
            specs[key.trim()] = value.trim();
          }
        }
      }

      await browser.close();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting specs from ${productUrl}: ${errorMessage}`);
      if (browser) await browser.close();
    }

    return specs;
  }
}
