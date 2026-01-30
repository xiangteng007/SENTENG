import { Injectable, Logger } from '@nestjs/common';

/**
 * CNS 國家標準查詢服務
 *
 * 提供營建相關 CNS 標準資料庫查詢
 *
 * 資料來源: 經濟部標準檢驗局
 */

export interface CnsStandard {
  number: string; // CNS 編號
  title: string; // 標準名稱
  titleEn?: string; // 英文名稱
  category: CnsCategory;
  status: 'active' | 'withdrawn' | 'replaced';
  publishDate: string;
  revisionDate?: string;
  replacedBy?: string;
  abstract?: string;
  keywords: string[];
}

export type CnsCategory =
  | 'concrete' // 混凝土
  | 'steel' // 鋼材
  | 'wood' // 木材
  | 'glass' // 玻璃
  | 'ceramics' // 陶瓷
  | 'paint' // 塗料
  | 'waterproofing' // 防水
  | 'insulation' // 隔熱
  | 'fire_resistance' // 防火
  | 'plumbing' // 給排水
  | 'electrical' // 電氣
  | 'hvac' // 空調
  | 'safety' // 安全
  | 'accessibility' // 無障礙
  | 'general'; // 一般

@Injectable()
export class CnsStandardsService {
  private readonly logger = new Logger(CnsStandardsService.name);

  // 常用營建 CNS 標準資料庫
  private readonly standards: CnsStandard[] = [
    // 混凝土相關
    {
      number: 'CNS 61',
      title: '卜特蘭水泥',
      category: 'concrete',
      status: 'active',
      publishDate: '1944-01-01',
      revisionDate: '2021-06-01',
      keywords: ['水泥', 'portland cement', '卜特蘭'],
      abstract: '規定卜特蘭水泥之種類、品質、試驗方法及檢驗規則',
    },
    {
      number: 'CNS 1010',
      title: '混凝土圓柱試體抗壓強度之試驗法',
      category: 'concrete',
      status: 'active',
      publishDate: '1962-12-01',
      revisionDate: '2020-03-01',
      keywords: ['混凝土', '抗壓強度', '試驗'],
    },
    {
      number: 'CNS 1240',
      title: '混凝土骨材質地之檢驗法',
      category: 'concrete',
      status: 'active',
      publishDate: '1966-03-01',
      keywords: ['骨材', '粗骨材', '細骨材'],
    },
    {
      number: 'CNS 3090',
      title: '預拌混凝土',
      category: 'concrete',
      status: 'active',
      publishDate: '1977-03-01',
      revisionDate: '2021-06-01',
      keywords: ['預拌混凝土', 'ready-mixed concrete'],
      abstract: '規定預拌混凝土之品質、供應及檢驗',
    },

    // 鋼材相關
    {
      number: 'CNS 560',
      title: '鋼筋混凝土用鋼筋',
      category: 'steel',
      status: 'active',
      publishDate: '1951-06-01',
      revisionDate: '2019-12-01',
      keywords: ['鋼筋', '竹節鋼筋', 'SD280', 'SD420'],
      abstract: '規定鋼筋混凝土用熱軋鋼筋之種類、形狀、尺度及品質',
    },
    {
      number: 'CNS 2473',
      title: '一般結構用碳鋼鋼管',
      category: 'steel',
      status: 'active',
      publishDate: '1971-03-01',
      keywords: ['鋼管', 'STK'],
    },
    {
      number: 'CNS 4435',
      title: '銲接結構用軋鋼料',
      category: 'steel',
      status: 'active',
      publishDate: '1981-03-01',
      revisionDate: '2018-06-01',
      keywords: ['H型鋼', 'SM400', 'SM490'],
    },
    {
      number: 'CNS 13812',
      title: '建築用耐震鋼結構鋼料',
      category: 'steel',
      status: 'active',
      publishDate: '2012-06-01',
      keywords: ['耐震', 'SN400', 'SN490'],
    },

    // 防水相關
    {
      number: 'CNS 8905',
      title: '改質瀝青防水卷材',
      category: 'waterproofing',
      status: 'active',
      publishDate: '1990-12-01',
      keywords: ['防水', '瀝青', '卷材'],
    },
    {
      number: 'CNS 12607',
      title: '合成高分子防水卷材',
      category: 'waterproofing',
      status: 'active',
      publishDate: '2001-03-01',
      keywords: ['PVC', 'TPO', 'EPDM', '防水卷材'],
    },

    // 防火相關
    {
      number: 'CNS 6532',
      title: '防火門',
      category: 'fire_resistance',
      status: 'active',
      publishDate: '1985-06-01',
      revisionDate: '2017-12-01',
      keywords: ['防火門', '耐火時效', '60分鐘', '120分鐘'],
    },
    {
      number: 'CNS 14705',
      title: '耐火建築構造之防火時效試驗法',
      category: 'fire_resistance',
      status: 'active',
      publishDate: '2005-12-01',
      keywords: ['防火', '耐火', '試驗'],
    },

    // 無障礙相關
    {
      number: 'CNS 12643',
      title: '建築物無障礙設施設計規範',
      category: 'accessibility',
      status: 'active',
      publishDate: '2015-06-01',
      keywords: ['無障礙', '通用設計', '坡道', '電梯'],
    },

    // 安全相關
    {
      number: 'CNS 4750',
      title: '營造安全衛生設施標準',
      category: 'safety',
      status: 'active',
      publishDate: '1981-12-01',
      keywords: ['安全', '施工', '安全網', '安全帽'],
    },

    // 玻璃相關
    {
      number: 'CNS 1222',
      title: '建築用平板玻璃',
      category: 'glass',
      status: 'active',
      publishDate: '1966-01-01',
      revisionDate: '2019-06-01',
      keywords: ['玻璃', '平板玻璃', '透明玻璃'],
    },
    {
      number: 'CNS 2281',
      title: '建築用強化玻璃',
      category: 'glass',
      status: 'active',
      publishDate: '1970-06-01',
      keywords: ['強化玻璃', '鋼化玻璃'],
    },
    {
      number: 'CNS 9285',
      title: '建築用膠合安全玻璃',
      category: 'glass',
      status: 'active',
      publishDate: '1991-12-01',
      keywords: ['膠合玻璃', '安全玻璃', 'PVB'],
    },
  ];

  /**
   * 依關鍵字搜尋標準
   */
  search(keyword: string): CnsStandard[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.standards.filter(
      s =>
        s.title.toLowerCase().includes(lowerKeyword) ||
        s.number.toLowerCase().includes(lowerKeyword) ||
        s.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 依編號查詢標準
   */
  getByNumber(number: string): CnsStandard | null {
    return this.standards.find(s => s.number === number) || null;
  }

  /**
   * 依類別列出標準
   */
  listByCategory(category: CnsCategory): CnsStandard[] {
    return this.standards.filter(s => s.category === category);
  }

  /**
   * 取得所有類別
   */
  getCategories(): { category: CnsCategory; count: number; label: string }[] {
    const labels: Record<CnsCategory, string> = {
      concrete: '混凝土',
      steel: '鋼材',
      wood: '木材',
      glass: '玻璃',
      ceramics: '陶瓷',
      paint: '塗料',
      waterproofing: '防水',
      insulation: '隔熱',
      fire_resistance: '防火',
      plumbing: '給排水',
      electrical: '電氣',
      hvac: '空調',
      safety: '安全',
      accessibility: '無障礙',
      general: '一般',
    };

    const counts = this.standards.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<CnsCategory, number>
    );

    return Object.entries(counts).map(([category, count]) => ({
      category: category as CnsCategory,
      count,
      label: labels[category as CnsCategory],
    }));
  }

  /**
   * 取得鋼筋規格對照表
   */
  getRebarGrades(): {
    grade: string;
    fy: number;
    fu: number;
    description: string;
  }[] {
    return [
      { grade: 'SD280', fy: 280, fu: 420, description: '一般用途' },
      { grade: 'SD280W', fy: 280, fu: 420, description: '可銲接' },
      { grade: 'SD420', fy: 420, fu: 560, description: '高強度' },
      { grade: 'SD420W', fy: 420, fu: 560, description: '高強度可銲接' },
      { grade: 'SD490', fy: 490, fu: 620, description: '超高強度' },
      { grade: 'SD550', fy: 550, fu: 690, description: '特高強度' },
    ];
  }

  /**
   * 取得混凝土強度等級
   */
  getConcreteGrades(): {
    grade: string;
    fc: number;
    usage: string;
  }[] {
    return [
      { grade: '140 kgf/cm²', fc: 140, usage: '打底、填充' },
      { grade: '175 kgf/cm²', fc: 175, usage: '一般基礎' },
      { grade: '210 kgf/cm²', fc: 210, usage: '一般結構' },
      { grade: '245 kgf/cm²', fc: 245, usage: '一般樑柱' },
      { grade: '280 kgf/cm²', fc: 280, usage: '高層建築' },
      { grade: '350 kgf/cm²', fc: 350, usage: '預力構件' },
      { grade: '420 kgf/cm²', fc: 420, usage: '高性能' },
    ];
  }
}
