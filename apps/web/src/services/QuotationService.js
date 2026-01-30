/**
 * 估價單系統服務層 (QuotationService)
 * 處理估價單的 CRUD、版本管理、審批流程
 * 
 * ⚠️ 已整合 Backend API - 資料儲存於 PostgreSQL
 */

import { quotationsApi } from './api';
import { GoogleService } from './GoogleService';

// ============================================
// 常數定義
// ============================================

// 估價單狀態
export const QUOTATION_STATUS = {
    DRAFT: 'DRAFT',           // 草稿
    PENDING: 'PENDING',       // 待審
    REJECTED: 'REJECTED',     // 退回
    APPROVED: 'APPROVED',     // 已核准
    SENT: 'SENT',             // 已送客
    ACCEPTED: 'ACCEPTED',     // 客戶接受
    DECLINED: 'DECLINED',     // 客戶拒絕
    CONVERTED: 'CONVERTED',   // 已轉換
    VOIDED: 'VOIDED',         // 作廢
};

export const QUOTATION_STATUS_LABELS = {
    DRAFT: '草稿',
    PENDING: '待審核',
    REJECTED: '退回修正',
    APPROVED: '已核准',
    SENT: '已送客戶',
    ACCEPTED: '客戶接受',
    DECLINED: '客戶拒絕',
    CONVERTED: '已轉合約',
    VOIDED: '作廢',
};

export const QUOTATION_STATUS_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700',
    APPROVED: 'bg-green-100 text-green-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    DECLINED: 'bg-orange-100 text-orange-700',
    CONVERTED: 'bg-purple-100 text-purple-700',
    VOIDED: 'bg-gray-200 text-gray-500',
};

// 工項類型
export const ITEM_TYPES = {
    CHAPTER: 'CHAPTER',   // 章 (第一層)
    SECTION: 'SECTION',   // 節 (第二層)
    ITEM: 'ITEM',         // 項 (第三層/明細)
    SUBTOTAL: 'SUBTOTAL', // 小計行
};

// 供料方式
export const SUPPLY_TYPES = {
    CONTRACTOR: 'CONTRACTOR', // 乙供 (包商提供)
    OWNER: 'OWNER',           // 甲供 (業主提供)
};

// 稅別
export const TAX_TYPES = {
    INCLUSIVE: 'INCLUSIVE', // 含稅
    EXCLUSIVE: 'EXCLUSIVE', // 未稅
};

// 預設設定
export const DEFAULT_SETTINGS = {
    taxRate: 5,           // 營業稅率 5%
    managementFee: 10,    // 管理費 10%
    profitRate: 15,       // 利潤率 15%
    validDays: 30,        // 報價有效期 30天
    currency: 'TWD',
};

// ============================================
// 工項庫分類
// ============================================

export const CATALOG_CATEGORIES = [
    // 裝修工程類
    { id: 'demolition', name: '拆除工程', icon: '🔨' },
    { id: 'masonry', name: '泥作工程', icon: '🧱' },
    { id: 'plumbing', name: '水電工程', icon: '🔧' },
    { id: 'woodwork', name: '木作工程', icon: '🪵' },
    { id: 'painting', name: '油漆工程', icon: '🎨' },
    { id: 'flooring', name: '地板工程', icon: '🏠' },
    { id: 'ceiling', name: '天花板工程', icon: '💡' },
    { id: 'doors', name: '門窗工程', icon: '🚪' },
    { id: 'kitchen', name: '廚具工程', icon: '🍳' },
    { id: 'bathroom', name: '衛浴工程', icon: '🚿' },
    { id: 'aircon', name: '空調工程', icon: '❄️' },
    { id: 'furniture', name: '系統櫃/傢俱', icon: '🛋️' },
    { id: 'cleaning', name: '清潔工程', icon: '🧹' },
    // 營建工程類
    { id: 'temporary', name: '假設工程', icon: '🚧' },
    { id: 'foundation', name: '基礎工程', icon: '🏗️' },
    { id: 'structure', name: '結構工程', icon: '🏛️' },
    { id: 'steel', name: '鋼構工程', icon: '⚙️' },
    { id: 'reinforcement', name: '結構補強', icon: '🔩' },
    { id: 'waterproof', name: '防水工程', icon: '💧' },
    { id: 'exterior', name: '外牆工程', icon: '🧊' },
    { id: 'roof', name: '屋頂工程', icon: '🏚️' },
    { id: 'fire', name: '消防工程', icon: '🔥' },
    { id: 'environment', name: '環境工程', icon: '🌿' },
    { id: 'other', name: '其他', icon: '📦' },
];

// ============================================
// 常用工項庫 (預設)
// ============================================

export const DEFAULT_CATALOG_ITEMS = [
    // 拆除工程
    { id: 'demo-001', category: 'demolition', name: '地板拆除', unit: '坪', refPrice: 1500, costPrice: 1200 },
    { id: 'demo-002', category: 'demolition', name: '牆面拆除', unit: '坪', refPrice: 2000, costPrice: 1600 },
    { id: 'demo-003', category: 'demolition', name: '天花板拆除', unit: '坪', refPrice: 800, costPrice: 600 },
    { id: 'demo-004', category: 'demolition', name: '廢料清運', unit: '車', refPrice: 8000, costPrice: 6000 },
    { id: 'demo-005', category: 'demolition', name: '建築物拆除', unit: '坪', refPrice: 3500, costPrice: 2800 },
    { id: 'demo-006', category: 'demolition', name: '結構體拆除', unit: 'm³', refPrice: 4500, costPrice: 3600 },
    // 泥作工程
    { id: 'mason-001', category: 'masonry', name: '地坪粉光', unit: '坪', refPrice: 2500, costPrice: 2000 },
    { id: 'mason-002', category: 'masonry', name: '牆面粉刷', unit: '坪', refPrice: 1800, costPrice: 1400 },
    { id: 'mason-003', category: 'masonry', name: '磁磚鋪設 (30x60)', unit: '坪', refPrice: 4500, costPrice: 3600 },
    { id: 'mason-004', category: 'masonry', name: '防水工程', unit: '坪', refPrice: 3000, costPrice: 2400 },
    { id: 'mason-005', category: 'masonry', name: '砌磚牆 (1B)', unit: '㎡', refPrice: 2800, costPrice: 2200 },
    { id: 'mason-006', category: 'masonry', name: '砌磚牆 (1/2B)', unit: '㎡', refPrice: 2000, costPrice: 1600 },
    // 水電工程
    { id: 'plumb-001', category: 'plumbing', name: '冷熱水管配置', unit: '點', refPrice: 3500, costPrice: 2800 },
    { id: 'plumb-002', category: 'plumbing', name: '排水管配置', unit: '點', refPrice: 3000, costPrice: 2400 },
    { id: 'plumb-003', category: 'plumbing', name: '電路配線', unit: '迴路', refPrice: 4500, costPrice: 3600 },
    { id: 'plumb-004', category: 'plumbing', name: '開關插座安裝', unit: '組', refPrice: 800, costPrice: 600 },
    { id: 'plumb-005', category: 'plumbing', name: '配電盤更新', unit: '式', refPrice: 45000, costPrice: 36000 },
    { id: 'plumb-006', category: 'plumbing', name: '弱電配管', unit: '式', refPrice: 25000, costPrice: 20000 },
    // 木作工程
    { id: 'wood-001', category: 'woodwork', name: '木作天花板 (平釘)', unit: '坪', refPrice: 3500, costPrice: 2800 },
    { id: 'wood-002', category: 'woodwork', name: '木作天花板 (造型)', unit: '坪', refPrice: 5500, costPrice: 4400 },
    { id: 'wood-003', category: 'woodwork', name: '木作隔間牆', unit: '坪', refPrice: 4000, costPrice: 3200 },
    { id: 'wood-004', category: 'woodwork', name: '木作門框', unit: '樘', refPrice: 8000, costPrice: 6400 },
    // 油漆工程
    { id: 'paint-001', category: 'painting', name: '乳膠漆 (牆面)', unit: '坪', refPrice: 1200, costPrice: 900 },
    { id: 'paint-002', category: 'painting', name: '乳膠漆 (天花)', unit: '坪', refPrice: 1000, costPrice: 750 },
    { id: 'paint-003', category: 'painting', name: '批土整平', unit: '坪', refPrice: 800, costPrice: 600 },
    { id: 'paint-004', category: 'painting', name: '外牆防水漆', unit: '㎡', refPrice: 450, costPrice: 360 },
    // 假設工程
    { id: 'temp-001', category: 'temporary', name: '施工圍籬', unit: 'm', refPrice: 1200, costPrice: 900 },
    { id: 'temp-002', category: 'temporary', name: '臨時水電', unit: '式', refPrice: 35000, costPrice: 28000 },
    { id: 'temp-003', category: 'temporary', name: '工地辦公室', unit: '月', refPrice: 25000, costPrice: 20000 },
    { id: 'temp-004', category: 'temporary', name: '鷹架搭設', unit: '㎡', refPrice: 180, costPrice: 140 },
    { id: 'temp-005', category: 'temporary', name: '安全設施', unit: '式', refPrice: 50000, costPrice: 40000 },
    // 基礎工程
    { id: 'found-001', category: 'foundation', name: '地質鑽探', unit: '孔', refPrice: 18000, costPrice: 14000 },
    { id: 'found-002', category: 'foundation', name: '基礎開挖', unit: 'm³', refPrice: 450, costPrice: 350 },
    { id: 'found-003', category: 'foundation', name: 'PC層澆置', unit: '㎡', refPrice: 650, costPrice: 520 },
    { id: 'found-004', category: 'foundation', name: '筏式基礎', unit: 'm³', refPrice: 8500, costPrice: 6800 },
    { id: 'found-005', category: 'foundation', name: '地樑施作', unit: 'm³', refPrice: 9000, costPrice: 7200 },
    { id: 'found-006', category: 'foundation', name: '基礎回填', unit: 'm³', refPrice: 350, costPrice: 280 },
    // 結構工程
    { id: 'struct-001', category: 'structure', name: 'RC柱施作', unit: 'm³', refPrice: 12000, costPrice: 9600 },
    { id: 'struct-002', category: 'structure', name: 'RC樑施作', unit: 'm³', refPrice: 11000, costPrice: 8800 },
    { id: 'struct-003', category: 'structure', name: 'RC樓板施作', unit: '㎡', refPrice: 3200, costPrice: 2560 },
    { id: 'struct-004', category: 'structure', name: 'RC牆施作', unit: '㎡', refPrice: 4500, costPrice: 3600 },
    { id: 'struct-005', category: 'structure', name: '混凝土澆置', unit: 'm³', refPrice: 3800, costPrice: 3000 },
    { id: 'struct-006', category: 'structure', name: '鋼筋組立', unit: 't', refPrice: 32000, costPrice: 26000 },
    { id: 'struct-007', category: 'structure', name: '模板組立', unit: '㎡', refPrice: 850, costPrice: 680 },
    // 鋼構工程
    { id: 'steel-001', category: 'steel', name: 'H型鋼構架', unit: 't', refPrice: 85000, costPrice: 68000 },
    { id: 'steel-002', category: 'steel', name: 'C型鋼檁條', unit: 'm', refPrice: 450, costPrice: 360 },
    { id: 'steel-003', category: 'steel', name: '屋面鋼浪板', unit: '㎡', refPrice: 850, costPrice: 680 },
    { id: 'steel-004', category: 'steel', name: '鋼構噴漆', unit: '㎡', refPrice: 280, costPrice: 220 },
    // 結構補強
    { id: 'reinf-001', category: 'reinforcement', name: '碳纖維貼片', unit: '㎡', refPrice: 8500, costPrice: 6800 },
    { id: 'reinf-002', category: 'reinforcement', name: '植筋補強', unit: '支', refPrice: 350, costPrice: 280 },
    { id: 'reinf-003', category: 'reinforcement', name: '裂縫灌注', unit: 'm', refPrice: 1200, costPrice: 960 },
    { id: 'reinf-004', category: 'reinforcement', name: '柱外包補強', unit: '支', refPrice: 65000, costPrice: 52000 },
    { id: 'reinf-005', category: 'reinforcement', name: '鋼板補強', unit: '㎡', refPrice: 12000, costPrice: 9600 },
    // 防水工程
    { id: 'water-001', category: 'waterproof', name: '屋頂防水層', unit: '㎡', refPrice: 850, costPrice: 680 },
    { id: 'water-002', category: 'waterproof', name: '外牆防水', unit: '㎡', refPrice: 650, costPrice: 520 },
    { id: 'water-003', category: 'waterproof', name: '浴室防水', unit: '間', refPrice: 18000, costPrice: 14400 },
    { id: 'water-004', category: 'waterproof', name: '地下室防水', unit: '㎡', refPrice: 1200, costPrice: 960 },
    // 外牆工程
    { id: 'ext-001', category: 'exterior', name: '外牆磁磚', unit: '㎡', refPrice: 2800, costPrice: 2240 },
    { id: 'ext-002', category: 'exterior', name: '外牆塗料', unit: '㎡', refPrice: 550, costPrice: 440 },
    { id: 'ext-003', category: 'exterior', name: '外牆石材', unit: '㎡', refPrice: 8500, costPrice: 6800 },
    { id: 'ext-004', category: 'exterior', name: '金屬帷幕牆', unit: '㎡', refPrice: 12000, costPrice: 9600 },
    // 屋頂工程
    { id: 'roof-001', category: 'roof', name: '斜屋頂瓦片', unit: '㎡', refPrice: 2200, costPrice: 1760 },
    { id: 'roof-002', category: 'roof', name: '隔熱磚', unit: '㎡', refPrice: 650, costPrice: 520 },
    { id: 'roof-003', category: 'roof', name: '女兒牆泥作', unit: 'm', refPrice: 2500, costPrice: 2000 },
    // 消防工程
    { id: 'fire-001', category: 'fire', name: '消防灑水系統', unit: '式', refPrice: 180000, costPrice: 144000 },
    { id: 'fire-002', category: 'fire', name: '消防警報系統', unit: '式', refPrice: 85000, costPrice: 68000 },
    { id: 'fire-003', category: 'fire', name: '滅火器設置', unit: '支', refPrice: 2500, costPrice: 2000 },
    { id: 'fire-004', category: 'fire', name: '緊急照明設備', unit: '組', refPrice: 3500, costPrice: 2800 },
    // 環境工程
    { id: 'env-001', category: 'environment', name: '排水溝施作', unit: 'm', refPrice: 2800, costPrice: 2240 },
    { id: 'env-002', category: 'environment', name: '化糞池', unit: '座', refPrice: 85000, costPrice: 68000 },
    { id: 'env-003', category: 'environment', name: '污水處理設施', unit: '式', refPrice: 250000, costPrice: 200000 },
    { id: 'env-004', category: 'environment', name: '景觀綠化', unit: '㎡', refPrice: 1500, costPrice: 1200 },
    // 清潔工程
    { id: 'clean-001', category: 'cleaning', name: '細部清潔', unit: '式', refPrice: 15000, costPrice: 12000 },
    { id: 'clean-002', category: 'cleaning', name: '粗清', unit: '式', refPrice: 25000, costPrice: 20000 },
    { id: 'clean-003', category: 'cleaning', name: '開荒清潔', unit: '坪', refPrice: 800, costPrice: 640 },
];

// ============================================
// 估價單模板
// ============================================

export const QUOTATION_TEMPLATES = [
    // ===========================================
    // 裝修類模板
    // ===========================================
    {
        id: 'tpl-residential',
        name: '住宅裝修標準版',
        projectType: 'RESIDENTIAL',
        description: '適用於一般住宅裝修，包含基本工項',
        items: [
            {
                type: 'CHAPTER', name: '一、拆除工程', children: [
                    { type: 'ITEM', name: '地板拆除', unit: '坪', unitPrice: 1500 },
                    { type: 'ITEM', name: '牆面拆除', unit: '坪', unitPrice: 2000 },
                    { type: 'ITEM', name: '廢料清運', unit: '車', unitPrice: 8000 },
                ]
            },
            {
                type: 'CHAPTER', name: '二、水電工程', children: [
                    { type: 'ITEM', name: '冷熱水管配置', unit: '點', unitPrice: 3500 },
                    { type: 'ITEM', name: '電路配線', unit: '迴路', unitPrice: 4500 },
                ]
            },
            {
                type: 'CHAPTER', name: '三、泥作工程', children: [
                    { type: 'ITEM', name: '地坪粉光', unit: '坪', unitPrice: 2500 },
                    { type: 'ITEM', name: '防水工程', unit: '坪', unitPrice: 3000 },
                    { type: 'ITEM', name: '磁磚鋪設', unit: '坪', unitPrice: 4500 },
                ]
            },
            {
                type: 'CHAPTER', name: '四、木作工程', children: [
                    { type: 'ITEM', name: '木作天花板', unit: '坪', unitPrice: 3500 },
                    { type: 'ITEM', name: '木作隔間', unit: '坪', unitPrice: 4000 },
                ]
            },
            {
                type: 'CHAPTER', name: '五、油漆工程', children: [
                    { type: 'ITEM', name: '批土整平', unit: '坪', unitPrice: 800 },
                    { type: 'ITEM', name: '乳膠漆', unit: '坪', unitPrice: 1200 },
                ]
            },
            {
                type: 'CHAPTER', name: '六、清潔工程', children: [
                    { type: 'ITEM', name: '細部清潔', unit: '式', unitPrice: 15000 },
                ]
            },
        ],
    },
    {
        id: 'tpl-commercial',
        name: '商空裝修版',
        projectType: 'COMMERCIAL',
        description: '適用於商業空間，著重水電與空調',
        items: [
            {
                type: 'CHAPTER', name: '一、拆除保護工程', children: [
                    { type: 'ITEM', name: '原有裝潢拆除', unit: '坪', unitPrice: 2500 },
                    { type: 'ITEM', name: '公設保護', unit: '式', unitPrice: 15000 },
                    { type: 'ITEM', name: '廢料清運', unit: '車', unitPrice: 8000 },
                ]
            },
            {
                type: 'CHAPTER', name: '二、隔間牆工程', children: [
                    { type: 'ITEM', name: '輕隔間牆', unit: '坪', unitPrice: 3200 },
                    { type: 'ITEM', name: '玻璃隔間', unit: '坪', unitPrice: 8500 },
                    { type: 'ITEM', name: '隔音牆', unit: '坪', unitPrice: 4500 },
                ]
            },
            {
                type: 'CHAPTER', name: '三、水電空調工程', children: [
                    { type: 'ITEM', name: '給排水配管', unit: '式', unitPrice: 45000 },
                    { type: 'ITEM', name: '電力配線', unit: '迴路', unitPrice: 4500 },
                    { type: 'ITEM', name: '空調主機安裝', unit: '台', unitPrice: 65000 },
                    { type: 'ITEM', name: '風管配置', unit: 'm', unitPrice: 1200 },
                    { type: 'ITEM', name: '消防灑水', unit: '頭', unitPrice: 3500 },
                ]
            },
            {
                type: 'CHAPTER', name: '四、天花板工程', children: [
                    { type: 'ITEM', name: '明架天花板', unit: '坪', unitPrice: 2800 },
                    { type: 'ITEM', name: '暗架天花板', unit: '坪', unitPrice: 3500 },
                    { type: 'ITEM', name: '造型天花板', unit: '坪', unitPrice: 5500 },
                ]
            },
            {
                type: 'CHAPTER', name: '五、地板工程', children: [
                    { type: 'ITEM', name: '地坪整平', unit: '坪', unitPrice: 1800 },
                    { type: 'ITEM', name: 'PVC地磚', unit: '坪', unitPrice: 2500 },
                    { type: 'ITEM', name: '磁磚鋪設', unit: '坪', unitPrice: 4500 },
                ]
            },
            {
                type: 'CHAPTER', name: '六、油漆工程', children: [
                    { type: 'ITEM', name: '批土整平', unit: '坪', unitPrice: 800 },
                    { type: 'ITEM', name: '乳膠漆', unit: '坪', unitPrice: 1200 },
                ]
            },
            {
                type: 'CHAPTER', name: '七、門窗招牌工程', children: [
                    { type: 'ITEM', name: '鋁門窗', unit: '樘', unitPrice: 18000 },
                    { type: 'ITEM', name: '玻璃門', unit: '樘', unitPrice: 25000 },
                    { type: 'ITEM', name: '招牌製作', unit: '式', unitPrice: 35000 },
                ]
            },
            {
                type: 'CHAPTER', name: '八、清潔工程', children: [
                    { type: 'ITEM', name: '細部清潔', unit: '式', unitPrice: 25000 },
                ]
            },
        ],
    },
    {
        id: 'tpl-minimal',
        name: '輕裝修版',
        projectType: 'MINIMAL',
        description: '簡易翻新，油漆+清潔為主',
        items: [
            {
                type: 'CHAPTER', name: '一、前置作業', children: [
                    { type: 'ITEM', name: '現場保護', unit: '式', unitPrice: 8000 },
                    { type: 'ITEM', name: '傢俱移動', unit: '式', unitPrice: 5000 },
                ]
            },
            {
                type: 'CHAPTER', name: '二、油漆工程', children: [
                    { type: 'ITEM', name: '牆面補土', unit: '坪', unitPrice: 500 },
                    { type: 'ITEM', name: '批土整平', unit: '坪', unitPrice: 800 },
                    { type: 'ITEM', name: '乳膠漆 (牆面)', unit: '坪', unitPrice: 1200 },
                    { type: 'ITEM', name: '乳膠漆 (天花)', unit: '坪', unitPrice: 1000 },
                ]
            },
            {
                type: 'CHAPTER', name: '三、清潔工程', children: [
                    { type: 'ITEM', name: '細部清潔', unit: '式', unitPrice: 15000 },
                ]
            },
        ],
    },
    // ===========================================
    // 營建類模板
    // ===========================================
    {
        id: 'tpl-factory-new',
        name: '新建廠房',
        projectType: 'FACTORY',
        description: '適用於工業廠房新建，含結構、鋼構、水電消防',
        items: [
            {
                type: 'CHAPTER', name: '一、假設工程', children: [
                    { type: 'ITEM', name: '施工圍籬', unit: 'm', unitPrice: 1200 },
                    { type: 'ITEM', name: '臨時水電', unit: '式', unitPrice: 35000 },
                    { type: 'ITEM', name: '工地辦公室', unit: '月', unitPrice: 25000 },
                    { type: 'ITEM', name: '鷹架搭設', unit: '㎡', unitPrice: 180 },
                    { type: 'ITEM', name: '安全設施', unit: '式', unitPrice: 50000 },
                ]
            },
            {
                type: 'CHAPTER', name: '二、基礎工程', children: [
                    { type: 'ITEM', name: '地質鑽探', unit: '孔', unitPrice: 18000 },
                    { type: 'ITEM', name: '基礎開挖', unit: 'm³', unitPrice: 450 },
                    { type: 'ITEM', name: 'PC層澆置', unit: '㎡', unitPrice: 650 },
                    { type: 'ITEM', name: '筏式基礎', unit: 'm³', unitPrice: 8500 },
                    { type: 'ITEM', name: '獨立基腳', unit: '座', unitPrice: 35000 },
                    { type: 'ITEM', name: '地樑施作', unit: 'm³', unitPrice: 9000 },
                    { type: 'ITEM', name: '基礎回填', unit: 'm³', unitPrice: 350 },
                ]
            },
            {
                type: 'CHAPTER', name: '三、結構工程', children: [
                    { type: 'ITEM', name: 'RC柱施作', unit: 'm³', unitPrice: 12000 },
                    { type: 'ITEM', name: 'RC樑施作', unit: 'm³', unitPrice: 11000 },
                    { type: 'ITEM', name: 'RC樓板施作', unit: '㎡', unitPrice: 3200 },
                    { type: 'ITEM', name: '混凝土澆置', unit: 'm³', unitPrice: 3800 },
                    { type: 'ITEM', name: '鋼筋組立', unit: 't', unitPrice: 32000 },
                    { type: 'ITEM', name: '模板組立', unit: '㎡', unitPrice: 850 },
                ]
            },
            {
                type: 'CHAPTER', name: '四、鋼構工程', children: [
                    { type: 'ITEM', name: 'H型鋼主構架', unit: 't', unitPrice: 85000 },
                    { type: 'ITEM', name: 'C型鋼檁條', unit: 'm', unitPrice: 450 },
                    { type: 'ITEM', name: '鋼構焊接', unit: 'm', unitPrice: 350 },
                    { type: 'ITEM', name: '鋼構噴漆', unit: '㎡', unitPrice: 280 },
                ]
            },
            {
                type: 'CHAPTER', name: '五、屋頂工程', children: [
                    { type: 'ITEM', name: '屋面鋼浪板', unit: '㎡', unitPrice: 850 },
                    { type: 'ITEM', name: '隔熱層', unit: '㎡', unitPrice: 350 },
                    { type: 'ITEM', name: '屋頂防水層', unit: '㎡', unitPrice: 850 },
                    { type: 'ITEM', name: '採光罩', unit: '㎡', unitPrice: 2500 },
                    { type: 'ITEM', name: '排水天溝', unit: 'm', unitPrice: 1500 },
                ]
            },
            {
                type: 'CHAPTER', name: '六、外牆工程', children: [
                    { type: 'ITEM', name: '外牆浪板', unit: '㎡', unitPrice: 750 },
                    { type: 'ITEM', name: '砌磚牆', unit: '㎡', unitPrice: 2800 },
                    { type: 'ITEM', name: '外牆塗料', unit: '㎡', unitPrice: 550 },
                ]
            },
            {
                type: 'CHAPTER', name: '七、門窗工程', children: [
                    { type: 'ITEM', name: '廠房大門', unit: '樘', unitPrice: 180000 },
                    { type: 'ITEM', name: '電動捲門', unit: '樘', unitPrice: 85000 },
                    { type: 'ITEM', name: '鋁門窗', unit: '㎡', unitPrice: 4500 },
                    { type: 'ITEM', name: '採光窗', unit: '㎡', unitPrice: 3500 },
                ]
            },
            {
                type: 'CHAPTER', name: '八、水電消防工程', children: [
                    { type: 'ITEM', name: '給水系統', unit: '式', unitPrice: 150000 },
                    { type: 'ITEM', name: '排水系統', unit: '式', unitPrice: 120000 },
                    { type: 'ITEM', name: '電力系統', unit: '式', unitPrice: 350000 },
                    { type: 'ITEM', name: '照明系統', unit: '式', unitPrice: 180000 },
                    { type: 'ITEM', name: '消防灑水系統', unit: '式', unitPrice: 280000 },
                    { type: 'ITEM', name: '消防警報系統', unit: '式', unitPrice: 85000 },
                ]
            },
            {
                type: 'CHAPTER', name: '九、環境工程', children: [
                    { type: 'ITEM', name: '排水溝施作', unit: 'm', unitPrice: 2800 },
                    { type: 'ITEM', name: '化糞池', unit: '座', unitPrice: 85000 },
                    { type: 'ITEM', name: '污水處理設施', unit: '式', unitPrice: 250000 },
                    { type: 'ITEM', name: '地坪鋪面', unit: '㎡', unitPrice: 850 },
                ]
            },
            {
                type: 'CHAPTER', name: '十、雜項及清潔', children: [
                    { type: 'ITEM', name: '工程保險', unit: '式', unitPrice: 50000 },
                    { type: 'ITEM', name: '竣工清潔', unit: '式', unitPrice: 45000 },
                ]
            },
        ],
    },
    {
        id: 'tpl-old-renovation',
        name: '老屋翻修',
        projectType: 'RENOVATION',
        description: '適用於50年以上老屋、透天厝全面翻修',
        items: [
            {
                type: 'CHAPTER', name: '一、拆除工程', children: [
                    { type: 'ITEM', name: '磁磚打除', unit: '坪', unitPrice: 1800 },
                    { type: 'ITEM', name: '隔間拆除', unit: '坪', unitPrice: 2500 },
                    { type: 'ITEM', name: '天花板拆除', unit: '坪', unitPrice: 800 },
                    { type: 'ITEM', name: '衛浴設備拆除', unit: '間', unitPrice: 8000 },
                    { type: 'ITEM', name: '廚具拆除', unit: '式', unitPrice: 12000 },
                    { type: 'ITEM', name: '廢料清運', unit: '車', unitPrice: 8000 },
                ]
            },
            {
                type: 'CHAPTER', name: '二、結構補強', children: [
                    { type: 'ITEM', name: '碳纖維貼片', unit: '㎡', unitPrice: 8500 },
                    { type: 'ITEM', name: '植筋補強', unit: '支', unitPrice: 350 },
                    { type: 'ITEM', name: '裂縫灌注', unit: 'm', unitPrice: 1200 },
                    { type: 'ITEM', name: '柱外包補強', unit: '支', unitPrice: 65000 },
                    { type: 'ITEM', name: '樓板補強', unit: '㎡', unitPrice: 3500 },
                ]
            },
            {
                type: 'CHAPTER', name: '三、防水工程', children: [
                    { type: 'ITEM', name: '屋頂防水層', unit: '㎡', unitPrice: 850 },
                    { type: 'ITEM', name: '外牆防水', unit: '㎡', unitPrice: 650 },
                    { type: 'ITEM', name: '浴室防水', unit: '間', unitPrice: 18000 },
                    { type: 'ITEM', name: '陽台防水', unit: '㎡', unitPrice: 800 },
                ]
            },
            {
                type: 'CHAPTER', name: '四、水電更新', children: [
                    { type: 'ITEM', name: '給水管全面更新', unit: '式', unitPrice: 85000 },
                    { type: 'ITEM', name: '排水管更新', unit: '式', unitPrice: 65000 },
                    { type: 'ITEM', name: '配電盤更新', unit: '式', unitPrice: 45000 },
                    { type: 'ITEM', name: '電路全面更新', unit: '迴路', unitPrice: 4500 },
                    { type: 'ITEM', name: '弱電配管', unit: '式', unitPrice: 25000 },
                ]
            },
            {
                type: 'CHAPTER', name: '五、泥作工程', children: [
                    { type: 'ITEM', name: '牆面粉刷', unit: '坪', unitPrice: 1800 },
                    { type: 'ITEM', name: '地坪粉光', unit: '坪', unitPrice: 2500 },
                    { type: 'ITEM', name: '浴室磁磚', unit: '間', unitPrice: 35000 },
                    { type: 'ITEM', name: '廚房磁磚', unit: '坪', unitPrice: 4500 },
                ]
            },
            {
                type: 'CHAPTER', name: '六、門窗更換', children: [
                    { type: 'ITEM', name: '鋁門窗更換', unit: '樘', unitPrice: 18000 },
                    { type: 'ITEM', name: '氣密窗升級', unit: '樘', unitPrice: 25000 },
                    { type: 'ITEM', name: '大門更換', unit: '樘', unitPrice: 35000 },
                    { type: 'ITEM', name: '房門更換', unit: '樘', unitPrice: 12000 },
                ]
            },
            {
                type: 'CHAPTER', name: '七、木作裝修', children: [
                    { type: 'ITEM', name: '木作天花板', unit: '坪', unitPrice: 3500 },
                    { type: 'ITEM', name: '木作隔間', unit: '坪', unitPrice: 4000 },
                    { type: 'ITEM', name: '木地板', unit: '坪', unitPrice: 4500 },
                ]
            },
            {
                type: 'CHAPTER', name: '八、油漆工程', children: [
                    { type: 'ITEM', name: '批土整平', unit: '坪', unitPrice: 800 },
                    { type: 'ITEM', name: '乳膠漆', unit: '坪', unitPrice: 1200 },
                    { type: 'ITEM', name: '外牆防水漆', unit: '㎡', unitPrice: 450 },
                ]
            },
            {
                type: 'CHAPTER', name: '九、設備安裝', children: [
                    { type: 'ITEM', name: '衛浴設備', unit: '間', unitPrice: 45000 },
                    { type: 'ITEM', name: '廚具設備', unit: '式', unitPrice: 120000 },
                    { type: 'ITEM', name: '熱水器', unit: '台', unitPrice: 18000 },
                ]
            },
            {
                type: 'CHAPTER', name: '十、清潔工程', children: [
                    { type: 'ITEM', name: '粗清', unit: '式', unitPrice: 25000 },
                    { type: 'ITEM', name: '細部清潔', unit: '式', unitPrice: 15000 },
                ]
            },
        ],
    },
    {
        id: 'tpl-rebuild-townhouse',
        name: '老屋重建/透天新建',
        projectType: 'REBUILD',
        description: '適用於危老重建、透天自建，含拆除重建全流程',
        items: [
            {
                type: 'CHAPTER', name: '一、拆除清運工程', children: [
                    { type: 'ITEM', name: '建築物拆除', unit: '坪', unitPrice: 3500 },
                    { type: 'ITEM', name: '結構體拆除', unit: 'm³', unitPrice: 4500 },
                    { type: 'ITEM', name: '廢料清運', unit: '車', unitPrice: 8000 },
                    { type: 'ITEM', name: '整地', unit: '坪', unitPrice: 1200 },
                ]
            },
            {
                type: 'CHAPTER', name: '二、假設工程', children: [
                    { type: 'ITEM', name: '施工圍籬', unit: 'm', unitPrice: 1200 },
                    { type: 'ITEM', name: '臨時水電', unit: '式', unitPrice: 35000 },
                    { type: 'ITEM', name: '鷹架搭設', unit: '㎡', unitPrice: 180 },
                    { type: 'ITEM', name: '安全設施', unit: '式', unitPrice: 50000 },
                ]
            },
            {
                type: 'CHAPTER', name: '三、基礎工程', children: [
                    { type: 'ITEM', name: '基礎開挖', unit: 'm³', unitPrice: 450 },
                    { type: 'ITEM', name: 'PC層澆置', unit: '㎡', unitPrice: 650 },
                    { type: 'ITEM', name: '筏式基礎', unit: 'm³', unitPrice: 8500 },
                    { type: 'ITEM', name: '地樑施作', unit: 'm³', unitPrice: 9000 },
                    { type: 'ITEM', name: '基礎回填', unit: 'm³', unitPrice: 350 },
                ]
            },
            {
                type: 'CHAPTER', name: '四、結構工程 (RC)', children: [
                    { type: 'ITEM', name: 'RC柱施作', unit: 'm³', unitPrice: 12000 },
                    { type: 'ITEM', name: 'RC樑施作', unit: 'm³', unitPrice: 11000 },
                    { type: 'ITEM', name: 'RC樓板施作', unit: '㎡', unitPrice: 3200 },
                    { type: 'ITEM', name: 'RC牆施作', unit: '㎡', unitPrice: 4500 },
                    { type: 'ITEM', name: '混凝土澆置', unit: 'm³', unitPrice: 3800 },
                    { type: 'ITEM', name: '鋼筋組立', unit: 't', unitPrice: 32000 },
                    { type: 'ITEM', name: '模板組立', unit: '㎡', unitPrice: 850 },
                ]
            },
            {
                type: 'CHAPTER', name: '五、屋頂防水工程', children: [
                    { type: 'ITEM', name: '屋頂防水層', unit: '㎡', unitPrice: 850 },
                    { type: 'ITEM', name: '隔熱磚', unit: '㎡', unitPrice: 650 },
                    { type: 'ITEM', name: '女兒牆泥作', unit: 'm', unitPrice: 2500 },
                    { type: 'ITEM', name: '排水溝', unit: 'm', unitPrice: 1500 },
                ]
            },
            {
                type: 'CHAPTER', name: '六、外牆工程', children: [
                    { type: 'ITEM', name: '外牆粉刷', unit: '㎡', unitPrice: 550 },
                    { type: 'ITEM', name: '外牆磁磚', unit: '㎡', unitPrice: 2800 },
                    { type: 'ITEM', name: '外牆塗料', unit: '㎡', unitPrice: 450 },
                ]
            },
            {
                type: 'CHAPTER', name: '七、內裝隔間工程', children: [
                    { type: 'ITEM', name: '砌磚隔間', unit: '㎡', unitPrice: 2800 },
                    { type: 'ITEM', name: '輕隔間牆', unit: '坪', unitPrice: 3200 },
                    { type: 'ITEM', name: '隔間牆粉刷', unit: '㎡', unitPrice: 450 },
                ]
            },
            {
                type: 'CHAPTER', name: '八、水電消防工程', children: [
                    { type: 'ITEM', name: '給水系統', unit: '式', unitPrice: 85000 },
                    { type: 'ITEM', name: '排水系統', unit: '式', unitPrice: 65000 },
                    { type: 'ITEM', name: '電力配線', unit: '迴路', unitPrice: 4500 },
                    { type: 'ITEM', name: '配電盤', unit: '式', unitPrice: 45000 },
                    { type: 'ITEM', name: '消防設備', unit: '式', unitPrice: 85000 },
                ]
            },
            {
                type: 'CHAPTER', name: '九、門窗工程', children: [
                    { type: 'ITEM', name: '鋁門窗', unit: '樘', unitPrice: 18000 },
                    { type: 'ITEM', name: '大門', unit: '樘', unitPrice: 45000 },
                    { type: 'ITEM', name: '房門', unit: '樘', unitPrice: 12000 },
                ]
            },
            {
                type: 'CHAPTER', name: '十、室內裝修工程', children: [
                    { type: 'ITEM', name: '木作天花板', unit: '坪', unitPrice: 3500 },
                    { type: 'ITEM', name: '地坪磁磚', unit: '坪', unitPrice: 4500 },
                    { type: 'ITEM', name: '衛浴磁磚', unit: '間', unitPrice: 35000 },
                    { type: 'ITEM', name: '批土油漆', unit: '坪', unitPrice: 2000 },
                    { type: 'ITEM', name: '衛浴設備', unit: '間', unitPrice: 45000 },
                    { type: 'ITEM', name: '廚具設備', unit: '式', unitPrice: 120000 },
                ]
            },
            {
                type: 'CHAPTER', name: '十一、雜項清潔', children: [
                    { type: 'ITEM', name: '工程保險', unit: '式', unitPrice: 35000 },
                    { type: 'ITEM', name: '竣工清潔', unit: '式', unitPrice: 35000 },
                ]
            },
        ],
    },
];

// ============================================
// 工具函數
// ============================================

/**
 * 生成估價單編號
 */
export const generateQuotationNo = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Q${year}-${random}`;
};

/**
 * 生成項次編號
 */
export const generateItemCode = (parentCode, index) => {
    if (!parentCode) return `${index + 1}`;
    return `${parentCode}.${index + 1}`;
};

/**
 * 計算單行複價
 */
export const calculateLineAmount = (quantity, unitPrice) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return Math.round(qty * price);
};

/**
 * 計算估價單總金額
 */
export const calculateQuotationTotals = (items, settings = {}) => {
    const {
        discountRate = 0,
        discountAmount = 0,
        managementFeeRate = DEFAULT_SETTINGS.managementFee,
        profitRate = DEFAULT_SETTINGS.profitRate,
        taxRate = DEFAULT_SETTINGS.taxRate,
        taxType = TAX_TYPES.INCLUSIVE,
    } = settings;

    // 計算工項小計
    const subtotal = items
        .filter(item => item.type === ITEM_TYPES.ITEM && item.supplyType !== SUPPLY_TYPES.OWNER)
        .reduce((sum, item) => sum + calculateLineAmount(item.quantity, item.unitPrice), 0);

    // 計算成本總計
    const costTotal = items
        .filter(item => item.type === ITEM_TYPES.ITEM && item.supplyType !== SUPPLY_TYPES.OWNER)
        .reduce((sum, item) => sum + calculateLineAmount(item.quantity, item.costPrice || 0), 0);

    // 折扣
    const discountAmt = discountAmount || Math.round(subtotal * discountRate / 100);
    const afterDiscount = subtotal - discountAmt;

    // 管理費
    const managementFee = Math.round(afterDiscount * managementFeeRate / 100);

    // 利潤
    const profitAmount = Math.round((afterDiscount + managementFee) * profitRate / 100);

    // 稅前總計
    const beforeTax = afterDiscount + managementFee + profitAmount;

    // 稅額
    let taxAmount = 0;
    let totalAmount = beforeTax;

    if (taxType === TAX_TYPES.EXCLUSIVE) {
        taxAmount = Math.round(beforeTax * taxRate / 100);
        totalAmount = beforeTax + taxAmount;
    } else {
        // 含稅 - 反算稅額
        taxAmount = Math.round(beforeTax * taxRate / (100 + taxRate));
    }

    // 毛利率
    const profitRateActual = costTotal > 0 ? ((totalAmount - costTotal) / totalAmount * 100) : 0;

    return {
        subtotal,
        costTotal,
        discountAmount: discountAmt,
        afterDiscount,
        managementFee,
        profitAmount,
        beforeTax,
        taxAmount,
        totalAmount,
        profitRate: profitRateActual.toFixed(1),
    };
};

/**
 * 套用模板生成工項
 */
export const applyTemplate = (template) => {
    const items = [];
    let itemId = 1;

    const processItems = (templateItems, parentId = null, parentCode = '') => {
        templateItems.forEach((tplItem, index) => {
            const code = generateItemCode(parentCode, index);
            const item = {
                id: `item-${itemId++}`,
                parentId,
                itemCode: code,
                type: tplItem.type,
                name: tplItem.name,
                specification: tplItem.specification || '',
                unit: tplItem.unit || '',
                quantity: tplItem.quantity || 0,
                unitPrice: tplItem.unitPrice || 0,
                costPrice: tplItem.costPrice || Math.round(tplItem.unitPrice * 0.8),
                amount: 0,
                supplyType: SUPPLY_TYPES.CONTRACTOR,
                isOptional: false,
                remark: '',
                sortOrder: items.length,
            };
            items.push(item);

            if (tplItem.children && tplItem.children.length > 0) {
                processItems(tplItem.children, item.id, code);
            }
        });
    };

    processItems(template.items);
    return items;
};

// ============================================
// 估價單服務類 - 使用 Backend API
// ============================================

class QuotationServiceClass {
    constructor() {
        this.catalogKey = 'senteng_catalog'; // 工項庫暫存本機
    }

    // 取得所有估價單
    async getQuotations(filters = {}) {
        try {
            const params = {};
            if (filters.projectId) params.projectId = filters.projectId;
            if (filters.status) params.status = filters.status;

            return await quotationsApi.getAll(params);
        } catch (error) {
            console.error('Failed to get quotations:', error);
            return [];
        }
    }

    // 取得單一估價單
    async getQuotation(id) {
        try {
            return await quotationsApi.getById(id);
        } catch (error) {
            console.error('Failed to get quotation:', error);
            return null;
        }
    }

    // 取得版本歷史
    async getVersions(id) {
        try {
            return await quotationsApi.getVersions(id);
        } catch (error) {
            console.error('Failed to get versions:', error);
            return [];
        }
    }

    // 新增估價單
    async createQuotation(data) {
        try {
            // Transform items to backend-compatible format
            const transformedItems = (data.items || [])
                .filter(item => item.type === 'ITEM' || !item.type) // Only send actual items, not chapters
                .map((item, index) => ({
                    itemOrder: index + 1,
                    category: item.category || '',
                    itemName: item.name || item.itemName || '未命名工項',
                    spec: item.specification || item.spec || '',
                    unit: item.unit || '式',
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                    amount: item.amount || (item.quantity || 1) * (item.unitPrice || 0),
                    remark: item.remark || '',
                }));

            const payload = {
                projectId: data.projectId,
                title: data.title || '新估價單',
                currency: data.currency || DEFAULT_SETTINGS.currency,
                isTaxIncluded: data.taxType !== TAX_TYPES.EXCLUSIVE,
                taxRate: data.taxRate || DEFAULT_SETTINGS.taxRate,
                validUntil: data.validUntil || new Date(Date.now() + DEFAULT_SETTINGS.validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: data.description || data.notes || '',
                items: transformedItems,
            };

            return await quotationsApi.create(payload);
        } catch (error) {
            console.error('Failed to create quotation:', error);
            throw error;
        }
    }

    // 更新估價單
    async updateQuotation(id, data) {
        try {
            return await quotationsApi.update(id, data);
        } catch (error) {
            console.error('Failed to update quotation:', error);
            throw error;
        }
    }

    // 提交審核
    async submitForReview(id) {
        try {
            return await quotationsApi.submit(id);
        } catch (error) {
            console.error('Failed to submit quotation:', error);
            throw error;
        }
    }

    // 核准
    async approve(id) {
        try {
            return await quotationsApi.approve(id);
        } catch (error) {
            console.error('Failed to approve quotation:', error);
            throw error;
        }
    }

    // 駁回
    async reject(id, reason) {
        try {
            return await quotationsApi.reject(id, reason);
        } catch (error) {
            console.error('Failed to reject quotation:', error);
            throw error;
        }
    }

    // 建立新版本
    async createNewVersion(id) {
        try {
            return await quotationsApi.createNewVersion(id);
        } catch (error) {
            console.error('Failed to create new version:', error);
            throw error;
        }
    }

    // 變更狀態 (通用)
    async changeStatus(id, newStatus, note = '') {
        return this.updateQuotation(id, {
            status: newStatus,
            notes: note,
        });
    }

    // 取得工項庫 (仍使用 localStorage 作為快取)
    async getCatalogItems() {
        try {
            const data = localStorage.getItem(this.catalogKey);
            return data ? JSON.parse(data) : DEFAULT_CATALOG_ITEMS;
        } catch {
            return DEFAULT_CATALOG_ITEMS;
        }
    }

    // 搜尋工項庫
    async searchCatalog(keyword, category = null) {
        const items = await this.getCatalogItems();
        return items.filter(item => {
            const matchKeyword = !keyword ||
                item.name.includes(keyword) ||
                item.id.includes(keyword);
            const matchCategory = !category || item.category === category;
            return matchKeyword && matchCategory;
        });
    }
}

export const QuotationService = new QuotationServiceClass();
export default QuotationService;
