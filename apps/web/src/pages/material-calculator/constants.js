// Material Calculator - Constants & Data
// Extracted from MaterialCalculator.jsx

// ============================================
// 工具函數
// ============================================

export const formatNumber = (num, decimals = 2) => {
    if (isNaN(num) || num === null) return '-';
    return Number(num).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
};

export const applyWastage = (value, wastagePercent) => {
    return value * (1 + wastagePercent / 100);
};

// ============================================
// 計算公式與常數定義
// ============================================

// 預設損耗率 (%) - 依專家審計調整
// 混凝土: 5% (適用一般專案，大型泵送可降至3%)
// 磁磚: 10% (考慮切割與損耗，複雜區域可調高至15%)
export const DEFAULT_WASTAGE = {
    concrete: 5,  // 專家建議：小型專案需要更高損耗率
    rebar: 5,
    formwork: 10,
    cement: 10,
    sand: 10,
    brick: 5,
    tile: 10,     // 專家建議：考慮切割、圖案對花、複雜區域
    grout: 15,
    adhesive: 10,
    paint: 10,
    putty: 10,
    waterproof: 15,  // 防水材料損耗較高
    insulation: 10,  // 保溫材料
};

// 防水材料規格 (台灣常用)
export const WATERPROOF_MATERIALS = [
    { id: 'pu', label: 'PU防水塗料', usage: 1.2, unit: 'kg/m²', layers: 2, price: { min: 400, max: 700 }, method: '滾塗兩道' },
    { id: 'epoxy', label: '環氧樹脂', usage: 0.8, unit: 'kg/m²', layers: 2, price: { min: 600, max: 1000 }, method: '刮塗+滾塗' },
    { id: 'asphalt', label: '瀝青防水毯', usage: 1.15, unit: 'm²', layers: 1, price: { min: 300, max: 500 }, method: '熱熔鋪貼' },
    { id: 'cement', label: '水泥基滲透結晶', usage: 1.5, unit: 'kg/m²', layers: 2, price: { min: 350, max: 600 }, method: '滾塗或噴塗' },
    { id: 'silicone', label: '矽利康防水劑', usage: 0.3, unit: 'kg/m²', layers: 1, price: { min: 200, max: 400 }, method: '噴塗' },
];

// 保溫材料規格
export const INSULATION_MATERIALS = [
    { id: 'eps', label: 'EPS保麗龍板 (25mm)', usage: 1.05, unit: 'm²', rValue: 0.8, price: { min: 80, max: 150 }, density: '15kg/m³' },
    { id: 'xps', label: 'XPS擠塑板 (25mm)', usage: 1.05, unit: 'm²', rValue: 1.0, price: { min: 120, max: 200 }, density: '30kg/m³' },
    { id: 'rockwool', label: '岩棉板 (50mm)', usage: 1.05, unit: 'm²', rValue: 1.4, price: { min: 200, max: 350 }, density: '80kg/m³' },
    { id: 'glasswool', label: '玻璃棉 (50mm)', usage: 1.05, unit: 'm²', rValue: 1.25, price: { min: 150, max: 280 }, density: '24kg/m³' },
    { id: 'pu_spray', label: 'PU發泡噴塗 (25mm)', usage: 1.0, unit: 'm²', rValue: 1.5, price: { min: 300, max: 500 }, density: '35kg/m³' },
];

// 紅磚用量對照表 (塊/m²)
export const BRICK_PER_SQM = {
    '12': { label: '12牆 (12cm)', count: 64 },
    '18': { label: '18牆 (18cm)', count: 96 },
    '24': { label: '24牆 (24cm)', count: 128 },
    '37': { label: '37牆 (37cm)', count: 192 },
};

// 磁磚尺寸選項
export const TILE_SIZES = [
    { label: '30×30 cm', l: 30, w: 30 },
    { label: '30×60 cm', l: 30, w: 60 },
    { label: '45×45 cm', l: 45, w: 45 },
    { label: '60×60 cm', l: 60, w: 60 },
    { label: '60×120 cm', l: 60, w: 120 },
    { label: '80×80 cm', l: 80, w: 80 },
    { label: '自訂', l: 0, w: 0 },
];

// 磁磚施工方法分類
export const TILE_METHODS = [
    { value: 'none', label: '未選擇' },
    { value: 'wet', label: '濕式工法(軟底)' },
    { value: 'dry', label: '乾式工法(硬底)' },
    { value: 'semi', label: '半乾濕式(騷底)' },
    { value: 'hang', label: '乾掛式工法' },
];

// 粉光配比對照表
export const PLASTER_RATIOS = {
    '1:2': { label: '1:2 粉光 (細)', cementPerM3: 650, sandPerM3: 800, desc: '細緻粉光面' },
    '1:3': { label: '1:3 打底 (粗)', cementPerM3: 450, sandPerM3: 950, desc: '一般打底用' },
};

// 牆壁厚度選項
export const WALL_THICKNESS_OPTIONS = [
    { value: 'all', label: '全部厚度' },
    { value: 8, label: '8 cm (鋼構)' },
    { value: 10, label: '10 cm (鋼構)' },
    { value: 15, label: '15 cm' },
    { value: 18, label: '18 cm' },
    { value: 20, label: '20 cm' },
    { value: 24, label: '24 cm (1B磚)' },
    { value: 25, label: '25 cm' },
    { value: 30, label: '30 cm' },
    { value: 35, label: '35 cm (地下室)' },
    { value: 40, label: '40 cm (深地下室)' },
];

// 建築類型概估指標 (擴充版 - 含牆壁厚度與加強磚造)
export const BUILDING_TYPES = [
    // ========== RC 鋼筋混凝土結構 ==========
    // 透天住宅類 (鋼筋: 100-112 kg/m², 混凝土: 0.73-0.82 m³/m²)
    { label: 'RC透天 (1-2F)', rebar: 95, concrete: 0.70, formwork: 2.0, sand: 0.08, structure: 'RC', wallThickness: 15 },
    { label: 'RC透天 (3F)', rebar: 100, concrete: 0.73, formwork: 2.1, sand: 0.09, structure: 'RC', wallThickness: 18 },
    { label: 'RC透天 (4-5F)', rebar: 108, concrete: 0.78, formwork: 2.2, sand: 0.10, structure: 'RC', wallThickness: 20 },
    { label: '別墅/Villa', rebar: 105, concrete: 0.75, formwork: 2.1, sand: 0.09, structure: 'RC', wallThickness: 18 },

    // 公寓類 (鋼筋: 121-136 kg/m², 混凝土: 0.76-0.91 m³/m²)
    { label: '公寓 (5-6F)', rebar: 121, concrete: 0.78, formwork: 2.3, sand: 0.10, structure: 'RC', wallThickness: 20 },
    { label: '公寓 (7-8F)', rebar: 128, concrete: 0.82, formwork: 2.4, sand: 0.11, structure: 'RC', wallThickness: 20 },
    { label: '電梯大樓 (9-11F)', rebar: 135, concrete: 0.85, formwork: 2.5, sand: 0.12, structure: 'RC', wallThickness: 25 },

    // 高層建築 (鋼筋: 91-130 kg/m², 混凝土: 0.38-0.50 m³/m²)
    { label: '小高層 (12-15F)', rebar: 95, concrete: 0.40, formwork: 2.4, sand: 0.10, structure: 'RC', wallThickness: 25 },
    { label: '高層 (16-20F)', rebar: 105, concrete: 0.42, formwork: 2.5, sand: 0.11, structure: 'RC', wallThickness: 25 },
    { label: '高層 (21-30F)', rebar: 115, concrete: 0.45, formwork: 2.6, sand: 0.12, structure: 'RC', wallThickness: 30 },

    // 特殊用途
    { label: '辦公大樓 (RC)', rebar: 110, concrete: 0.42, formwork: 2.5, sand: 0.10, structure: 'RC', wallThickness: 25 },
    { label: '學校/公共建築', rebar: 100, concrete: 0.40, formwork: 2.4, sand: 0.10, structure: 'RC', wallThickness: 20 },
    { label: '醫院', rebar: 120, concrete: 0.45, formwork: 2.6, sand: 0.12, structure: 'RC', wallThickness: 25 },
    { label: '工廠/倉庫 (RC)', rebar: 75, concrete: 0.35, formwork: 1.8, sand: 0.08, structure: 'RC', wallThickness: 18 },

    // 地下室 (高配筋、高混凝土用量)
    { label: '地下室 (1層)', rebar: 150, concrete: 0.55, formwork: 3.2, sand: 0.15, structure: 'RC', wallThickness: 30 },
    { label: '地下室 (2層)', rebar: 175, concrete: 0.65, formwork: 3.5, sand: 0.18, structure: 'RC', wallThickness: 35 },
    { label: '地下室 (3層+)', rebar: 200, concrete: 0.75, formwork: 4.0, sand: 0.20, structure: 'RC', wallThickness: 40 },

    // ========== SRC 鋼骨鋼筋混凝土結構 ==========
    // SRC結構鋼筋+鋼骨用量較高 (約 130-260 kg/m²)
    { label: 'SRC中高層 (10-15F)', rebar: 140, concrete: 0.42, formwork: 2.5, sand: 0.11, structure: 'SRC', wallThickness: 25 },
    { label: 'SRC高層 (16-25F)', rebar: 180, concrete: 0.48, formwork: 2.8, sand: 0.13, structure: 'SRC', wallThickness: 30 },
    { label: 'SRC超高層 (26F+)', rebar: 220, concrete: 0.52, formwork: 3.0, sand: 0.14, structure: 'SRC', wallThickness: 35 },
    { label: 'SRC辦公大樓', rebar: 160, concrete: 0.45, formwork: 2.6, sand: 0.12, structure: 'SRC', wallThickness: 25 },

    // ========== SC 鋼骨結構 ==========
    // 鋼構主要用鋼骨，鋼筋較少 (主要用於樓板)
    { label: '鋼構廠房', rebar: 35, concrete: 0.18, formwork: 1.2, sand: 0.05, structure: 'SC', wallThickness: 10 },
    { label: '鋼構辦公大樓', rebar: 50, concrete: 0.25, formwork: 1.5, sand: 0.07, structure: 'SC', wallThickness: 15 },
    { label: '鋼構高層 (20F+)', rebar: 65, concrete: 0.30, formwork: 1.8, sand: 0.08, structure: 'SC', wallThickness: 20 },
    { label: '鋼構倉庫', rebar: 25, concrete: 0.15, formwork: 1.0, sand: 0.04, structure: 'SC', wallThickness: 8 },

    // ========== RB 加強磚造結構 ==========
    // 加強磚造鋼筋較少，但砂用量較高 (砌磚用)
    { label: '加強磚造透天 (2F)', rebar: 25, concrete: 0.20, formwork: 1.2, sand: 0.45, structure: 'RB', wallThickness: 24 },
    { label: '加強磚造透天 (3F)', rebar: 30, concrete: 0.25, formwork: 1.4, sand: 0.50, structure: 'RB', wallThickness: 24 },
    { label: '加強磚造公寓', rebar: 35, concrete: 0.28, formwork: 1.5, sand: 0.55, structure: 'RB', wallThickness: 24 },
    { label: '農舍/倉庫 (磚造)', rebar: 20, concrete: 0.18, formwork: 1.0, sand: 0.40, structure: 'RB', wallThickness: 24 },
];


// 鋼筋規格表 (含工程常用號數)
export const REBAR_SPECS = [
    { label: '#3 D10 (9.53mm)', d: 9.53, weight: 0.56 },
    { label: '#4 D13 (12.7mm)', d: 12.7, weight: 0.99 },
    { label: '#5 D16 (15.9mm)', d: 15.9, weight: 1.56 },
    { label: '#6 D19 (19.1mm)', d: 19.1, weight: 2.25 },
    { label: '#7 D22 (22.2mm)', d: 22.2, weight: 3.04 },
    { label: '#8 D25 (25.4mm)', d: 25.4, weight: 3.98 },
    { label: '#9 D29 (28.7mm)', d: 28.7, weight: 5.08 },
    { label: '#10 D32 (32.2mm)', d: 32.2, weight: 6.39 },
];

// 各部位鋼筋用量概算指標 (kg/m²) - 營造經驗數據
export const REBAR_USAGE_BY_COMPONENT = {
    wall: [
        { label: 'RC牆 15cm', thickness: 15, usage: 23, desc: '主筋@20+箍筋' },
        { label: 'RC牆 18cm', thickness: 18, usage: 29, desc: '主筋@15+箍筋' },
        { label: 'RC牆 20cm', thickness: 20, usage: 34, desc: '雙層主筋+箍筋' },
        { label: 'RC牆 25cm', thickness: 25, usage: 47, desc: '雙層主筋+加強箍筋' },
        { label: 'RC牆 30cm', thickness: 30, usage: 58, desc: '雙層主筋+密箍' },
    ],
    floor: [
        { label: '樓板 12cm', thickness: 12, usage: 13, desc: '單層雙向配筋' },
        { label: '樓板 15cm', thickness: 15, usage: 17, desc: '單層雙向配筋' },
        { label: '加厚板 18cm', thickness: 18, usage: 25, desc: '雙層雙向配筋' },
        { label: '屋頂板', thickness: 12, usage: 16, desc: '含隔熱層配筋' },
    ],
    stair: [
        { label: '直跑樓梯', usage: 40, desc: '踏板+斜版' },
        { label: '迴轉樓梯', usage: 50, desc: '含中間平台' },
        { label: '懸臂樓梯', usage: 62, desc: '高配筋' },
    ],
    beam: [
        { label: '一般大梁', usage: 85, desc: '主筋+箍筋 (kg/m³)' },
        { label: '框架梁', usage: 100, desc: '高配筋 (kg/m³)' },
    ],
    column: [
        { label: '一般柱', usage: 120, desc: '主筋+箍筋 (kg/m³)' },
        { label: '框架柱', usage: 150, desc: '高配筋 (kg/m³)' },
    ],
};

// 構件鋼筋配筋率參考值 (kg/m³ 或 kg/m²) - 含詳細工程說明
export const COMPONENT_REBAR_RATES = {
    column: [
        {
            label: '一般柱',
            value: 120,
            specs: '40×40cm，主筋8-#6，箍筋#3@15cm',
            method: '適用於3-5層透天住宅，採用較小斷面配置。主筋8根#6對稱配置於四角及中間，箍筋#3@15cm，柱頂柱底加密區箍筋@10cm。混凝土強度建議210-280 kgf/cm²。',
            application: '透天厝、農舍、低矮住宅（1-5樓）、簡易倉庫',
            regulations: '【建築技術規則§401】柱最小尺寸25cm，短邊≥長邊1/4。主筋比ρ=1%~6%，最少4根主筋。'
        },
        {
            label: '框架柱',
            value: 150,
            specs: '50×50cm，主筋12-#7，箍筋#3@12cm+繫筋',
            method: '適用於5-8層公寓大樓，主筋12根#7三面對稱配置，箍筋#3@12cm並設置繫筋。混凝土強度建議280-350 kgf/cm²。耐震設計需符合中度韌性要求。',
            application: '電梯大樓、商業建築、辦公大樓、學校、公共設施',
            regulations: '【耐震規範】中度韌性：軸壓比≤0.3fc\'Ag，箍筋需設繫筋，每隔一根主筋設置。'
        }
    ],
    beam: [
        {
            label: '一般大梁',
            value: 85,
            specs: '30×60cm，上3-#6下4-#6，箍筋#3@15cm',
            method: '承載樓板與次樑傳來之載重，上筋3根#6於支撐處抵抗負彎矩，下筋4根#6於跨中抵抗正彎矩。標準跨距4-6m適用。',
            application: '一般住宅主樑、標準框架結構、跨距6m以內',
            regulations: '【建築技術規則】樑最小寬度20cm，最小深度25cm。最小配筋率ρmin=14.1/fy。'
        },
        {
            label: '框架梁',
            value: 100,
            specs: '40×70cm，上4-#7下5-#7，箍筋#4@12cm',
            method: '大跨距樑用於無柱空間，需較大斷面與配筋抵抗撓度，上筋4根#7，下筋5根#7可雙排配置。塑鉸區需加密箍筋。',
            application: '大跨距空間（6-10m）、商業空間、會議廳、無柱大廳',
            regulations: '【耐震規範】梁端塑鉸區箍筋需加密至2倍梁深範圍。撓度控制δ≤L/240。'
        }
    ],
    slab: [
        {
            label: '12cm 樓板',
            thickness: 12,
            value: 13,
            specs: '主筋#3@20cm雙向配置，保護層2cm',
            method: '單層配筋適用於短跨距小載重樓板，底筋於跨中承受正彎矩。適合小房間、陽台、走廊等區域。',
            application: '小房間（跨距<4m）、陽台、走廊、儲藏室',
            regulations: '【建築技術規則】RC樓板最小厚度10cm，鋼筋間距≤板厚3倍且≤45cm。'
        },
        {
            label: '15cm 樓板',
            thickness: 15,
            value: 17,
            specs: '主筋#3@15cm雙向配置，保護層2cm',
            method: '標準單層配筋適用於一般住宅樓板，底筋於跨中承受正彎矩，跨距4-6m適用。',
            application: '一般住宅客廳、臥室、辦公空間（跨距4-6m）',
            regulations: '【建築技術規則】住宅活載重200kgf/m²，辦公室300kgf/m²。'
        },
        {
            label: '18cm 加厚板',
            thickness: 18,
            value: 25,
            specs: '上下層#4@15cm雙向配置，保護層2.5cm',
            method: '雙層配筋適用於連續板或較大載重，上層筋於支撐處承受負彎矩。適合商業空間或跨距較大區域。',
            application: '商業空間（活載重≥300kgf/m²）、餐廳、大跨距樓板（6-8m）',
            regulations: '【ACI規範】跨深比限制：簡支L/h≤16，連續L/h≤21。'
        }
    ],
    wall: [
        {
            label: '15cm 牆',
            thickness: 15,
            value: 23,
            specs: '單側#3@20cm垂直+水平配筋，保護層3cm',
            method: '單層配筋適用於一般隔間牆或非承重牆體，鋼筋單側配置即可。需注意與梁柱之錨定。',
            application: '隔間牆、非承重分隔牆、低樓層輕載牆',
            regulations: '【建築技術規則】RC牆最小厚度10cm，豎向筋間距≤牆厚3倍且≤45cm。'
        },
        {
            label: '18cm 牆',
            thickness: 18,
            value: 29,
            specs: '單側#4@20cm垂直+水平配筋，保護層3cm',
            method: '單層較密配筋適用於低樓層承重牆，豎筋#4間距20cm可承受較大載重。',
            application: '低樓層承重牆（1-3F）、輕型剪力牆',
            regulations: '【耐震規範】承重牆需滿足軸力與彎矩需求，牆端需設置邊緣構件。'
        },
        {
            label: '20cm 牆',
            thickness: 20,
            value: 34,
            specs: '雙側#4@15cm垂直+水平配筋，保護層3cm',
            method: '雙層配筋適用於剪力牆或中高樓層承重牆體，雙側對稱配置可承受往復水平力。搭接長度40d。',
            application: '剪力牆、耐震牆、中高樓層承重牆（4-8F）',
            regulations: '【耐震規範】剪力牆配筋率≥0.25%，邊界構件需設繫筋#3@10cm。'
        },
        {
            label: '25cm 牆',
            thickness: 25,
            value: 47,
            specs: '雙側#4@12cm垂直+水平配筋，保護層3cm',
            method: '較厚雙層配筋適用於高樓層剪力牆系統，配筋加密抵抗較大水平力。邊界區需設置加密箍筋。',
            application: '高層建築剪力牆（8F以上）、核心筒、電梯間',
            regulations: '【耐震規範】特殊剪力牆ρ≥0.25%，繫筋間距≤min(6db, 150mm)。'
        },
        {
            label: '30cm 牆',
            thickness: 30,
            value: 58,
            specs: '雙側#5@12cm垂直+水平配筋，保護層4cm',
            method: '重型剪力牆適用於高層建築或核心筒，採用#5較大直徑鋼筋並加密配置，搭接長度50d。',
            application: '超高層建築核心筒、地下室外牆、水池壁',
            regulations: '【高層建築規範】剪力牆需進行非線性分析，邊界區箍筋需加密配置。'
        }
    ],
    parapet: [
        {
            label: '輕量配筋',
            value: 18,
            specs: '厚15cm，高80-100cm，#3@25cm雙向單層',
            method: '輕型女兒牆用於低矮簡易建築，採單層配筋#3@25cm雙向，需與樓板鋼筋錨固。適合低風壓區域。',
            application: '低矮透天（高度<100cm）、陽台欄杆、一般住宅屋頂',
            regulations: '【建築技術規則§38】欄杆扶手高度≥110cm（屋頂），錨筋伸入樓板≥40d。'
        },
        {
            label: '標準配筋',
            value: 22,
            specs: '厚15cm，高100-120cm，#3@20cm雙向單層',
            method: '標準女兒牆適用於一般建築，採單層配筋#3@20cm雙向，豎筋錨入樓板，橫筋環繞。需設壓頂收邊。',
            application: '一般公寓屋頂（高度100-120cm）、商業建築女兒牆',
            regulations: '【建築技術規則§38】屋頂周邊女兒牆高度≥110cm，需檢核風力穩定性。'
        },
        {
            label: '加強配筋',
            value: 28,
            specs: '厚20cm，高120-150cm，#4@15cm雙向',
            method: '加強型女兒牆用於高風壓區或較高女兒牆，採雙層配筋或加大號數#4@15cm，建議每2-3m增設扶壁柱。',
            application: '高層建築女兒牆、強風區（沿海、山區）、高度>120cm',
            regulations: '【耐風設計規範】基本風速V10≥30m/s區域需加強，高度>120cm需設扶壁柱@2-3m。'
        }
    ],
    groundBeam: [
        {
            label: '一般地樑',
            value: 90,
            specs: '30×60cm，上下各3-#5，箍筋#3@20cm',
            method: '輕型地樑連接獨立基腳，傳遞水平力並防止基礎不均勻沉陷，主筋#5上下對稱配置。保護層5cm（接觸土壤）。',
            application: '透天住宅基礎連接、獨棟建築、輕載結構',
            regulations: '【建築技術規則】基礎間應以地樑連接，地樑最小寬度≥柱寬，深度≥40cm，保護層≥5cm。'
        },
        {
            label: '加強地樑',
            value: 110,
            specs: '40×80cm，上下各4-#6，箍筋#3@15cm',
            method: '標準地樑適用於一般公寓大樓基礎連接，較大斷面承載上部結構傳來之軸力與彎矩。需與柱筋及基腳筋妥善錨定。',
            application: '公寓大樓基礎、商業建築、學校、中型結構',
            regulations: '【耐震規定】地樑需能傳遞水平力至各基腳，鋼筋需與柱筋及基腳筋妥善錨定，底層需鋪設PC層≥5cm。'
        }
    ],
    foundation: [
        {
            label: '獨立基腳',
            value: 80,
            specs: '150×150×60cm，#4@20cm雙向底筋',
            method: '傳遞單根柱載重至地盤，底筋雙向配置抵抗底部彎矩，柱筋錨入基腳並設彎鉤。適用於承載力良好地盤。',
            application: '透天住宅、獨棟建築、輕載單柱結構、地耐力≥10tf/m²',
            regulations: '【建築技術規則】基礎需坐落於承載層，qa≤容許承載力，柱主筋伸入基腳≥40d需設彎鉤。'
        },
        {
            label: '聯合基腳',
            value: 85,
            specs: '300×150×80cm，#5@15cm雙向上下層',
            method: '連接相鄰兩柱承載偏心載重，上下雙層配筋抵抗正負彎矩。適用於柱距較近或地界限制情況。',
            application: '雙柱共用基礎、緊鄰地界情況、偏心載重柱',
            regulations: '【基礎規範】需檢核偏心與傾覆，上層筋抵抗柱間負彎矩，建議設地樑連接增加整體性。'
        },
        {
            label: '筏式基礎',
            value: 100,
            specs: '整體板厚60-100cm，#5@10cm上下雙向',
            method: '將所有柱載重分散至整個底板，適用於軟弱地盤或高地下水位，雙層雙向配筋。需設加勁梁增加剛度。',
            application: '軟弱地盤（地耐力<5tf/m²）、高地下水位、高層建築、整體基礎需求',
            regulations: '【筏基規範】需進行沉陷與差異沉陷分析，最小配筋率0.18%雙向，需設置適當分區澆置計畫控制水化熱。'
        }
    ],
    stair: [
        {
            label: '直跑樓梯',
            value: 40,
            thickness: 15,
            specs: '斜板厚15cm，踏步高18cm寬27cm，#4@15cm雙向',
            method: '斜板式樓梯最常用，踏板與斜板一體澆置。主筋配置於斜板底面，分布筋垂直主筋。踏面可用1:2水泥砂漿收邊。',
            application: '一般住宅、辦公室、商業空間（淨寬≥75cm）',
            regulations: '【建築技術規則§33】樓梯寬度≥75cm，踏步高≤18cm踏深≥26cm。扶手高≥85cm。'
        },
        {
            label: '迴轉樓梯',
            value: 50,
            thickness: 18,
            specs: '斜板厚18cm，含中間平台，#4@12cm雙向',
            method: '含90°或180°轉折平台，平台處需加強配筋。平台厚度≥斜板厚度，平台與斜板交接處需設加強筋。',
            application: '透天住宅、公寓大樓、受限空間需迴轉處',
            regulations: '【建築規則】轉折平台深度≥踏深，寬度≥樓梯淨寬。平台處需設結構計算。'
        },
        {
            label: '懸臂樓梯',
            value: 62,
            thickness: 20,
            specs: '踏板厚20cm，#5@10cm懸挑配筋，錨入牆體≥40d',
            method: '踏板單邊固定於牆體，另一端懸挑。需高配筋且錨入支撐牆體深度足夠。混凝土強度建議≥280kgf/cm²。',
            application: '高級住宅、設計感空間、展示樓梯',
            regulations: '【結構設計】懸挑長度≤1.2m，錨定長度≥40倍鋼筋直徑，支撐牆需為RC牆或柱。'
        }
    ]
};

// 女兒牆預設高度選項
export const PARAPET_HEIGHTS = [
    { value: 0.6, label: '60 cm (矮牆)' },
    { value: 0.9, label: '90 cm (標準)' },
    { value: 1.2, label: '120 cm (高欄)' },
];

// 構件類型定義
export const COMPONENT_TYPES = [
    { id: 'column', label: '柱子', icon: '🏛️' },
    { id: 'beam', label: '樑', icon: '📏' },
    { id: 'slab', label: '樓板', icon: '⬜' },
    { id: 'wall', label: '牆體', icon: '🧱' },
    { id: 'stair', label: '樓梯', icon: '🪜' },
    { id: 'parapet', label: '女兒牆', icon: '🏚️' },
    { id: 'groundBeam', label: '地樑', icon: '⛏️' },
    { id: 'foundation', label: '基礎', icon: '🏗️' },
];

// 台灣營建參考價格 (NT$) - 整合 construction-estimator skill
export const TAIWAN_REFERENCE_PRICES = {
    // 結構材料
    concrete: { min: 3500, max: 5000, unit: 'm³', label: '混凝土（含澆置）' },
    rebar: { min: 30, max: 45, unit: 'kg', label: '鋼筋（含綁紮）' },
    formwork: { min: 400, max: 800, unit: 'm²', label: '模板（含支撐）' },
    steelStructure: { min: 60, max: 90, unit: 'kg', label: '結構鋼' },
    // 裝修材料
    tile: { min: 2000, max: 4500, unit: 'm²', label: '磁磚（含施工）' },
    paint: { min: 300, max: 600, unit: 'm²', label: '油漆（含底漆）' },
    brick: { min: 8, max: 12, unit: '塊', label: '紅磚' },
    cement: { min: 180, max: 250, unit: '包', label: '水泥（50kg）' },
    sand: { min: 800, max: 1200, unit: 'm³', label: '砂' },
    // 裝修工程
    plaster: { min: 400, max: 700, unit: 'm²', label: '粉光（含打底）' },
    waterproof: { min: 500, max: 1000, unit: 'm²', label: '防水材料' },
};

// 單位轉換常數
export const UNIT_CONVERSIONS = {
    // 面積
    pingToSqm: 3.3058,       // 1坪 = 3.3058 m²
    sqmToPing: 0.3025,       // 1m² = 0.3025 坪
    caiToSqm: 0.0929,        // 1才 = 0.0929 m² (30.3cm × 30.3cm)
    sqmToCai: 10.764,        // 1m² = 10.764 才
    // 長度
    taiwanFootToM: 0.30303,  // 1台尺 = 30.303 cm
    mToTaiwanFoot: 3.3,      // 1m = 3.3 台尺
    // 常用換算
    pingToTsubo: 1.0,        // 1坪 = 1 坪 (台日同)
    sqftToSqm: 0.0929,       // 1 sq ft = 0.0929 m²
};

// 常用開口尺寸預設 (用於牆體/磁磚扣除)
export const COMMON_OPENINGS = {
    doors: [
        { label: '標準單門', width: 0.9, height: 2.1, area: 1.89 },
        { label: '雙開門', width: 1.5, height: 2.1, area: 3.15 },
        { label: '大門', width: 1.8, height: 2.4, area: 4.32 },
        { label: '浴室門', width: 0.7, height: 2.0, area: 1.40 },
        { label: '落地門', width: 0.9, height: 2.4, area: 2.16 },
    ],
    windows: [
        { label: '標準窗', width: 1.2, height: 1.2, area: 1.44 },
        { label: '大窗', width: 1.8, height: 1.5, area: 2.70 },
        { label: '落地窗', width: 1.2, height: 2.1, area: 2.52 },
        { label: '氣窗', width: 0.6, height: 0.4, area: 0.24 },
        { label: '觀景窗', width: 2.4, height: 1.5, area: 3.60 },
    ],
};

// 專案範本 (常見建築類型快速設定)
export const PROJECT_TEMPLATES = [
    {
        id: 'townhouse',
        label: '透天住宅 (3F)',
        icon: '🏠',
        area: 100,
        floors: 3,
        perimeter: 40,
        openings: { doors: 3, windows: 12 },
        materials: { concrete: 120, rebar: 12000, formwork: 400, tile: 200, paint: 600 }
    },
    {
        id: 'apartment',
        label: '公寓大樓 (5F)',
        icon: '🏢',
        area: 500,
        floors: 5,
        perimeter: 80,
        openings: { doors: 20, windows: 40 },
        materials: { concrete: 350, rebar: 35000, formwork: 1200, tile: 800, paint: 2000 }
    },
    {
        id: 'factory',
        label: '鋼構廠房',
        icon: '🏭',
        area: 1000,
        floors: 1,
        perimeter: 150,
        openings: { doors: 4, windows: 20 },
        materials: { concrete: 200, rebar: 8000, formwork: 300, steelStructure: 50000 }
    },
    {
        id: 'renovation',
        label: '老屋翻新',
        icon: '🔧',
        area: 80,
        floors: 2,
        perimeter: 36,
        openings: { doors: 4, windows: 8 },
        materials: { tile: 160, paint: 400, waterproof: 40, plaster: 200 }
    },
];

// Alias for backward compatibility
export const SLAB_THICKNESS_OPTIONS = WALL_THICKNESS_OPTIONS;
