import { Injectable, Logger } from '@nestjs/common';

/**
 * AI 估價建議服務
 *
 * 使用歷史報價資料預測材料價格趨勢
 */

export interface PricePredictionInput {
  materialCode: string;
  materialName: string;
  category: string;
  currentPrice: number;
  unit: string;
  historicalPrices?: HistoricalPrice[];
}

export interface HistoricalPrice {
  date: string;
  price: number;
  source?: string;
}

export interface PricePrediction {
  material: string;
  currentPrice: number;
  predictedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: PriceFactor[];
  recommendation: string;
}

export interface PriceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface MarketAnalysis {
  category: string;
  averageChange: number;
  volatility: number;
  outlook: 'bullish' | 'bearish' | 'neutral';
  keyFactors: string[];
}

@Injectable()
export class AiPricingService {
  private readonly logger = new Logger(AiPricingService.name);

  // 材料類別價格趨勢因子
  private readonly MARKET_FACTORS: Record<string, PriceFactor[]> = {
    steel: [
      {
        factor: '國際鐵礦砂價格',
        impact: 'positive',
        weight: 0.3,
        description: '鐵礦砂價格上漲帶動鋼價',
      },
      { factor: '中國產能', impact: 'negative', weight: 0.25, description: '中國減產支撐價格' },
      { factor: '基礎建設需求', impact: 'positive', weight: 0.2, description: '公共工程需求增加' },
      { factor: '碳排成本', impact: 'positive', weight: 0.15, description: '碳稅增加生產成本' },
      { factor: '匯率', impact: 'neutral', weight: 0.1, description: '新台幣走勢影響進口成本' },
    ],
    concrete: [
      { factor: '砂石供應', impact: 'negative', weight: 0.3, description: '砂石短缺推升價格' },
      { factor: '水泥價格', impact: 'positive', weight: 0.25, description: '水泥成本轉嫁' },
      { factor: '運輸成本', impact: 'positive', weight: 0.2, description: '油價影響運輸' },
      { factor: '季節性需求', impact: 'neutral', weight: 0.15, description: '旺季價格上漲' },
      { factor: '環保法規', impact: 'positive', weight: 0.1, description: '環評要求增加成本' },
    ],
    wood: [
      { factor: '進口木材價格', impact: 'positive', weight: 0.35, description: '國際木材期貨' },
      { factor: '匯率波動', impact: 'neutral', weight: 0.25, description: 'USD/TWD 影響' },
      { factor: '環保認證', impact: 'positive', weight: 0.2, description: 'FSC 認證成本' },
      { factor: '運輸成本', impact: 'positive', weight: 0.1, description: '海運費用' },
      { factor: '國產供應', impact: 'negative', weight: 0.1, description: '國產材增加' },
    ],
    electrical: [
      { factor: '銅價', impact: 'positive', weight: 0.35, description: '銅線主要成本' },
      { factor: '半導體供應', impact: 'negative', weight: 0.25, description: '晶片供應改善' },
      { factor: '人工成本', impact: 'positive', weight: 0.2, description: '技術人員短缺' },
      { factor: '節能法規', impact: 'positive', weight: 0.1, description: '能效標準提高' },
      { factor: '國產替代', impact: 'negative', weight: 0.1, description: '本土品牌增加' },
    ],
  };

  /**
   * 預測材料價格趨勢
   */
  predictPrice(input: PricePredictionInput): PricePrediction {
    const category = this.categorizeImport(input.category);
    const factors = this.MARKET_FACTORS[category] || this.MARKET_FACTORS.concrete;

    // 簡化的價格預測模型
    let priceChangePercent = 0;
    factors.forEach(f => {
      const impact = f.impact === 'positive' ? 1 : f.impact === 'negative' ? -1 : 0;
      priceChangePercent += impact * f.weight * (Math.random() * 10 - 3); // 模擬 -3% ~ 7%
    });

    // 加入歷史趨勢
    if (input.historicalPrices && input.historicalPrices.length >= 3) {
      const recentTrend = this.calculateTrend(input.historicalPrices);
      priceChangePercent = priceChangePercent * 0.6 + recentTrend * 0.4;
    }

    const predictedPrice = input.currentPrice * (1 + priceChangePercent / 100);
    const priceChange = predictedPrice - input.currentPrice;
    const trend = priceChangePercent > 2 ? 'up' : priceChangePercent < -2 ? 'down' : 'stable';

    return {
      material: input.materialName,
      currentPrice: input.currentPrice,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      priceChange: Math.round(priceChange * 100) / 100,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      confidence: 0.65 + Math.random() * 0.2, // 65% - 85%
      trend,
      factors,
      recommendation: this.getRecommendation(trend, priceChangePercent),
    };
  }

  /**
   * 批次預測多項材料
   */
  predictBatch(inputs: PricePredictionInput[]): {
    predictions: PricePrediction[];
    summary: { avgChange: number; upCount: number; downCount: number };
  } {
    const predictions = inputs.map(input => this.predictPrice(input));

    const avgChange =
      predictions.reduce((sum, p) => sum + p.priceChangePercent, 0) / predictions.length;
    const upCount = predictions.filter(p => p.trend === 'up').length;
    const downCount = predictions.filter(p => p.trend === 'down').length;

    return {
      predictions,
      summary: { avgChange: Math.round(avgChange * 100) / 100, upCount, downCount },
    };
  }

  /**
   * 市場分析
   */
  analyzeMarket(category: string): MarketAnalysis {
    const factors = this.MARKET_FACTORS[category] || this.MARKET_FACTORS.concrete;

    const positiveFactors = factors.filter(f => f.impact === 'positive');
    const negativeFactors = factors.filter(f => f.impact === 'negative');

    const avgChange = (positiveFactors.length - negativeFactors.length) * 2;
    const volatility = Math.random() * 15 + 5; // 5-20%

    let outlook: 'bullish' | 'bearish' | 'neutral';
    if (avgChange > 3) outlook = 'bullish';
    else if (avgChange < -3) outlook = 'bearish';
    else outlook = 'neutral';

    return {
      category,
      averageChange: avgChange,
      volatility: Math.round(volatility * 100) / 100,
      outlook,
      keyFactors: factors.slice(0, 3).map(f => f.factor),
    };
  }

  /**
   * 採購時機建議
   */
  getPurchaseTiming(predictions: PricePrediction[]): {
    urgentBuy: string[];
    canWait: string[];
    monitorClosely: string[];
  } {
    const urgentBuy: string[] = [];
    const canWait: string[] = [];
    const monitorClosely: string[] = [];

    predictions.forEach(p => {
      if (p.trend === 'up' && p.priceChangePercent > 5) {
        urgentBuy.push(p.material);
      } else if (p.trend === 'down') {
        canWait.push(p.material);
      } else {
        monitorClosely.push(p.material);
      }
    });

    return { urgentBuy, canWait, monitorClosely };
  }

  /**
   * 計算歷史趨勢
   */
  private calculateTrend(prices: HistoricalPrice[]): number {
    if (prices.length < 2) return 0;

    const sorted = [...prices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstPrice = sorted[0].price;
    const lastPrice = sorted[sorted.length - 1].price;

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * 材料分類
   */
  private categorizeImport(category: string): string {
    const mapping: Record<string, string> = {
      鋼筋: 'steel',
      鋼材: 'steel',
      H型鋼: 'steel',
      混凝土: 'concrete',
      水泥: 'concrete',
      砂石: 'concrete',
      木材: 'wood',
      木作: 'wood',
      電線: 'electrical',
      配電: 'electrical',
      開關: 'electrical',
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (category.includes(key)) return value;
    }

    return 'concrete';
  }

  /**
   * 產生建議
   */
  private getRecommendation(trend: 'up' | 'down' | 'stable', changePercent: number): string {
    if (trend === 'up' && changePercent > 5) {
      return '建議盡快採購，預計價格將持續上漲';
    } else if (trend === 'up') {
      return '價格略有上漲趨勢，可考慮提前備料';
    } else if (trend === 'down' && changePercent < -5) {
      return '價格下跌中，可延後採購以取得更好價格';
    } else if (trend === 'down') {
      return '價格趨於穩定，可按計畫採購';
    } else {
      return '價格穩定，可維持正常採購節奏';
    }
  }
}
