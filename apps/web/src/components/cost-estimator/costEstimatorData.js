/**
 * CostEstimator constants and data
 */
import { Paintbrush, Hammer, Layers, Wrench, GlassWater, Package } from 'lucide-react';

// 預設物料資料（離線時使用）
export const DEFAULT_MATERIALS = {
    '油漆': [
        { id: 1, name: '乳膠漆', spec: '5加侖桶', unit: '加侖', price: 1200, note: '每坪用量約0.5加侖' },
        { id: 2, name: '防水漆', spec: '5加侖桶', unit: '加侖', price: 1800, note: '浴室/屋頂用' },
        { id: 3, name: '油性漆', spec: '加侖', unit: '加侖', price: 600, note: '金屬/木作' },
    ],
    '木作': [
        { id: 4, name: '木芯板', spec: '4x8呎', unit: '片', price: 800, note: '36才/片' },
        { id: 5, name: '夾板', spec: '4x8呎', unit: '片', price: 450, note: '18mm厚' },
        { id: 6, name: '角材', spec: '1.2x1.2寸', unit: '支', price: 35, note: '12尺長' },
        { id: 7, name: '系統櫃', spec: '含五金', unit: '尺', price: 3500, note: '連工帶料' },
    ],
    '泥作': [
        { id: 8, name: '水泥', spec: '50kg/包', unit: '包', price: 180, note: '台泥' },
        { id: 9, name: '砂', spec: '立方', unit: '立方', price: 1200, note: '河砂' },
        { id: 10, name: '磁磚', spec: '60x60cm', unit: '坪', price: 2500, note: '含工資' },
        { id: 11, name: '拋光石英磚', spec: '80x80cm', unit: '坪', price: 4500, note: '含工資' },
    ],
    '水電': [
        { id: 12, name: '電線', spec: '2.0mm', unit: '尺', price: 8, note: '單芯線' },
        { id: 13, name: 'PVC管', spec: '3/4吋', unit: '支', price: 45, note: '4米長' },
        { id: 14, name: '開關插座', spec: '國際牌', unit: '組', price: 150, note: '含安裝' },
        { id: 15, name: '馬桶', spec: '二段式', unit: '組', price: 8000, note: '含安裝' },
    ],
    '玻璃': [
        { id: 16, name: '清玻璃', spec: '5mm', unit: '才', price: 35, note: '一般隔間' },
        { id: 17, name: '強化玻璃', spec: '10mm', unit: '才', price: 85, note: '淋浴間' },
        { id: 18, name: '膠合玻璃', spec: '5+5mm', unit: '才', price: 120, note: '安全玻璃' },
    ],
    '地板': [
        { id: 19, name: '超耐磨地板', spec: '卡扣式', unit: '坪', price: 3500, note: '含安裝' },
        { id: 20, name: 'SPC地板', spec: '卡扣式', unit: '坪', price: 2800, note: '防水' },
        { id: 21, name: '實木地板', spec: '海島型', unit: '坪', price: 6500, note: '含安裝' },
    ],
};

// 類別圖示映射
export const CATEGORY_ICONS = {
    '油漆': Paintbrush,
    '木作': Hammer,
    '泥作': Layers,
    '水電': Wrench,
    '玻璃': GlassWater,
    '地板': Package,
};

// 格式化金額
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};
