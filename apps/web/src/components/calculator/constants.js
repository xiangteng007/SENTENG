/**
 * MaterialCalculator - 常數定義
 * 從 MaterialCalculator.jsx 提取 (FE-001)
 */

// 預設損耗率 (%)
export const DEFAULT_WASTAGE = {
    concrete: 3,
    rebar: 5,
    formwork: 10,
    cement: 10,
    sand: 10,
    brick: 5,
    tile: 5,
    grout: 15,
    adhesive: 10,
    paint: 10,
    putty: 10,
};

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

// 構件鋼筋配筋率參考值 (kg/m³ 或 kg/m²)
export const COMPONENT_REBAR_RATES = {
    column: [
        { label: '一般柱', value: 120, desc: '主筋+箍筋' },
        { label: '框架柱', value: 150, desc: '高配筋' },
    ],
    beam: [
        { label: '一般大梁', value: 85, desc: '主筋+箍筋' },
        { label: '框架梁', value: 100, desc: '高配筋' },
    ],
    slab: [
        { label: '12cm 樓板', thickness: 12, value: 13, desc: '單層雙向' },
        { label: '15cm 樓板', thickness: 15, value: 17, desc: '單層雙向' },
        { label: '18cm 加厚板', thickness: 18, value: 25, desc: '雙層雙向' },
    ],
    wall: [
        { label: '15cm 牆', thickness: 15, value: 23, desc: '主筋@20' },
        { label: '18cm 牆', thickness: 18, value: 29, desc: '主筋@15' },
        { label: '20cm 牆', thickness: 20, value: 34, desc: '雙層主筋' },
        { label: '25cm 牆', thickness: 25, value: 47, desc: '雙層+加強' },
        { label: '30cm 牆', thickness: 30, value: 58, desc: '雙層+密箍' },
    ],
    parapet: [
        { label: '輕量配筋', value: 18, desc: '單層' },
        { label: '標準配筋', value: 22, desc: '雙層' },
        { label: '加強配筋', value: 25, desc: '密配' },
    ],
    groundBeam: [
        { label: '一般地樑', value: 90, desc: '標準' },
        { label: '加強地樑', value: 110, desc: '框架' },
    ],
    foundation: [
        { label: '獨立基腳', value: 80, desc: '單柱基礎' },
        { label: '聯合基腳', value: 85, desc: '多柱基礎' },
        { label: '筏式基礎', value: 100, desc: '全面基礎' },
    ],
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
    { id: 'parapet', label: '女兒牆', icon: '🏚️' },
    { id: 'groundBeam', label: '地樑', icon: '⛏️' },
    { id: 'foundation', label: '基礎', icon: '🏗️' },
];
