/**
 * 結構材料統合計算器 — 工具函數與計算引擎
 */

import { STAIR_TYPES } from './constants';

// ============================================
// 工具函數
// ============================================
export const formatNumber = (num, decimals = 2) => {
    if (num === 0 || isNaN(num)) return '0';
    return num.toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// 計算函數
// ============================================
export const calculateComponent = (type, params) => {
    const { width, depth, height, length, count = 1, thickness, perimeter, rebarRate } = params;
    let formwork = 0, concrete = 0, rebar = 0;

    switch (type) {
        case 'column': {
            const w = (width || 0) / 100;
            const d = (depth || 0) / 100;
            const h = height || 0;
            const n = count || 1;
            formwork = 2 * (w + d) * h * n;
            concrete = w * d * h * n;
            rebar = concrete * (rebarRate || 120);
            break;
        }
        case 'beam': {
            const w = (width || 0) / 100;
            const h = (height || 0) / 100;
            const l = length || 0;
            const n = count || 1;
            formwork = (w + 2 * h) * l * n;
            concrete = w * h * l * n;
            rebar = concrete * (rebarRate || 85);
            break;
        }
        case 'slab': {
            const l = length || 0;
            const w = width || 0;
            const t = (thickness || 15) / 100;
            const area = l * w;
            const peri = 2 * (l + w);
            formwork = area + peri * t;
            concrete = area * t;
            rebar = area * (rebarRate || 17);
            break;
        }
        case 'wall': {
            const l = length || 0;
            const h = height || 0;
            const t = (thickness || 20) / 100;
            const area = l * h;
            formwork = 2 * area;
            concrete = area * t;
            rebar = area * (rebarRate || 34);
            break;
        }
        case 'parapet': {
            const p = perimeter || 0;
            const h = height || 0.9;
            const t = (thickness || 15) / 100;
            const area = p * h;
            formwork = 2 * area;
            concrete = area * t;
            rebar = area * (rebarRate || 22);
            break;
        }
        case 'groundBeam': {
            const w = (width || 0) / 100;
            const d = (depth || 0) / 100;
            const l = length || 0;
            const n = count || 1;
            formwork = (w + 2 * d) * l * n;
            concrete = w * d * l * n;
            rebar = concrete * (rebarRate || 90);
            break;
        }
        case 'foundation': {
            const l = length || 0;
            const w = width || 0;
            const d = depth || 0;
            const n = count || 1;
            const peri = 2 * (l + w);
            formwork = peri * d * n;
            concrete = l * w * d * n;
            rebar = concrete * (rebarRate || 80);
            break;
        }
        case 'stairs': {
            // 樓梯計算: 類型, 寬度, 階數, 階高, 踏寬, 斜板厚, 轉台深度
            const stairWidth = (width || 120) / 100;  // 樓梯寬度(m)
            const steps = count || 12;  // 總階數
            const stepHeight = (height || 17) / 100;  // 階高(m)
            const stepDepth = (depth || 28) / 100;  // 踏寬(m)
            const slabThickness = (thickness || 15) / 100;  // 斜板厚(m)
            const landingDepth = (length || 120) / 100;  // 轉台深度(m)

            // 依樓梯類型取得梯段數和轉台數
            const stairTypeId = perimeter || 'single';  // 借用perimeter存放樓梯類型
            const stairTypeConfig = STAIR_TYPES.find(t => t.id === stairTypeId) || STAIR_TYPES[0];
            const flightCount = stairTypeConfig.flights;
            const landingCount = stairTypeConfig.landings || 0;
            const winderCount = stairTypeConfig.winders || 0;  // 扇形踏階數

            // 計算每梯段階數和斜長 (扣除扇形踏階數)
            const regularSteps = steps - winderCount;
            const stepsPerFlight = Math.ceil(regularSteps / flightCount);
            const flightRise = stepsPerFlight * stepHeight;
            const flightRun = stepsPerFlight * stepDepth;
            const slopeLength = Math.sqrt(flightRise * flightRise + flightRun * flightRun);

            // 梯段模板: (梯底 + 梯側) × 梯段數 + 踏步立板
            const bottomFormwork = slopeLength * stairWidth * flightCount;  // 梯底
            const stepFormwork = regularSteps * stepHeight * stairWidth;  // 踏步立板 (一般踏步)
            const sideFormwork = slopeLength * slabThickness * 2 * flightCount;  // 兩側

            // 轉台模板: 底板 + 側邊 (L型轉台為方形)
            const landingArea = stairTypeId === 'lShape'
                ? stairWidth * stairWidth  // L型: 方形轉角
                : stairWidth * landingDepth;  // 其他: 矩形
            const landingPerimeter = stairTypeId === 'lShape'
                ? 4 * stairWidth
                : 2 * (stairWidth + landingDepth);
            const landingFormwork = landingCount * (
                landingArea +  // 底板
                landingPerimeter * slabThickness  // 側邊
            );

            // 扇形踏模板: 底板(約1/4圓環) + 踏步立板 + 側邊
            // 扇形踏外徑 ≈ 樓梯寬, 內徑 ≈ 0.2倍寬
            const winderOuterR = stairWidth;
            const winderInnerR = stairWidth * 0.2;
            const winderAngle = 90 * (Math.PI / 180);  // 90度轉角
            const winderBottomArea = 0.25 * Math.PI * (winderOuterR * winderOuterR - winderInnerR * winderInnerR);
            const winderStepFormwork = winderCount * stepHeight * (winderOuterR + winderInnerR) / 2;  // 扇形踏立板
            const winderFormwork = winderCount > 0 ? (
                winderBottomArea +  // 底板
                winderStepFormwork +  // 踏步立板
                (winderOuterR + winderInnerR) * winderAngle * slabThickness  // 弧形側邊
            ) : 0;

            formwork = bottomFormwork + stepFormwork + sideFormwork + landingFormwork + winderFormwork;

            // 梯段混凝土: 斜板體積 + 踏步體積
            const slabVolume = slopeLength * stairWidth * slabThickness * flightCount;
            const stepVolume = regularSteps * stepHeight * stepDepth * stairWidth * 0.5;

            // 轉台混凝土
            const landingConcrete = landingCount * landingArea * slabThickness;

            // 扇形踏混凝土
            const winderConcrete = winderCount > 0 ? (
                winderBottomArea * slabThickness +  // 底板
                winderCount * stepHeight * (winderOuterR + winderInnerR) / 2 * stepDepth * 0.5  // 踏步
            ) : 0;

            concrete = slabVolume + stepVolume + landingConcrete + winderConcrete;

            rebar = concrete * (rebarRate || 85);
            break;
        }
    }

    return { formwork, concrete, rebar };
};
