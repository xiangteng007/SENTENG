/**
 * 結構材料統合計算器
 * 整合構件計算、材料匯總與報價功能
 */

import React, { useState, useMemo } from 'react';
import {
    Calculator, Plus, Trash2, Edit3, Save, X, Info,
    FileSpreadsheet, DollarSign, ChevronDown, Copy, Check
} from 'lucide-react';

// ============================================
// 鋼筋規格 (台灣CNS 560標準)
// ============================================
const REBAR_SPECS = [
    { id: 'd10', label: '#3 D10 (9.53mm)', diameter: 9.53, weight: 0.56, grade: 'SD280W', price: 26000 },
    { id: 'd13', label: '#4 D13 (12.7mm)', diameter: 12.7, weight: 0.99, grade: 'SD280W', price: 26000 },
    { id: 'd16', label: '#5 D16 (15.9mm)', diameter: 15.9, weight: 1.56, grade: 'SD280W', price: 26000 },
    { id: 'd19', label: '#6 D19 (19.1mm)', diameter: 19.1, weight: 2.24, grade: 'SD420W', price: 27000 },
    { id: 'd22', label: '#7 D22 (22.2mm)', diameter: 22.2, weight: 3.04, grade: 'SD420W', price: 27000 },
    { id: 'd25', label: '#8 D25 (25.4mm)', diameter: 25.4, weight: 3.98, grade: 'SD420W', price: 27000 },
    { id: 'd29', label: '#9 D29 (28.7mm)', diameter: 28.7, weight: 5.07, grade: 'SD420W', price: 27000 },
    { id: 'd32', label: '#10 D32 (32.3mm)', diameter: 32.3, weight: 6.42, grade: 'SD420W', price: 27000 },
];

const REBAR_GRADES = [
    { id: 'SD280W', label: 'SD280W (中拉鋼筋 #3~#5)', desc: '降伏強度 2800 kgf/cm²' },
    { id: 'SD420W', label: 'SD420W (高拉鋼筋 #6+)', desc: '降伏強度 4200 kgf/cm²' },
];

// ============================================
// 混凝土強度等級 (預拌混凝土)
// ============================================
const CONCRETE_GRADES = [
    { id: 'c140', strength: 140, psi: 2000, mpa: 13.7, label: '140 kgf/cm² (2000psi)', usage: 'PC層、假設工程', price: 2200 },
    { id: 'c210', strength: 210, psi: 3000, mpa: 20.6, label: '210 kgf/cm² (3000psi)', usage: '一般樓房、公共工程', price: 2600 },
    { id: 'c280', strength: 280, psi: 4000, mpa: 27.5, label: '280 kgf/cm² (4000psi)', usage: '新建公共工程、基礎', price: 2900 },
    { id: 'c350', strength: 350, psi: 5000, mpa: 34.3, label: '350 kgf/cm² (5000psi)', usage: '高樓、橋樑柱、預力', price: 3200 },
];

// ============================================
// 構件類型定義
// ============================================
const COMPONENT_TYPES = [
    { id: 'column', label: '柱子', icon: '🏛️', unit: '支' },
    { id: 'beam', label: '樑', icon: '📏', unit: '支' },
    { id: 'slab', label: '樓板', icon: '⬜', unit: '塊' },
    { id: 'wall', label: '牆體', icon: '🧱', unit: '面' },
    { id: 'parapet', label: '女兒牆', icon: '🏘️', unit: '圈' },
    { id: 'groundBeam', label: '地樑', icon: '⛏️', unit: '支' },
    { id: 'foundation', label: '基礎', icon: '🏗️', unit: '座' },
    { id: 'stairs', label: '樓梯', icon: '🪜', unit: '座' },
];

// 配筋率參考值 (含鋼筋#號規格、工法說明、法規條文)
const REBAR_RATES = {
    // 柱子: 依建築類型與樓層
    column: {
        residential: {
            label: '透天住宅 (#6主筋 8根)',
            value: 120,
            desc: '3-4F住宅',
            specs: '40×40cm，主筋8-#6，箍筋#3@15cm',
            method: '透天住宅柱採用較小斷面，主筋8根#6對稱配置，箍筋#3@15cm，柱頂柱底加密區箍筋@10cm。',
            materials: '柱寬40cm、深40cm，主筋SD420W #6共8根，箍筋SD280W #3@15cm，保護層4cm',
            regulations: [
                '【建築技術規則構造編§401】柱最小尺寸25cm，短邊≥長邊1/4',
                '【耐震規範】主筋比ρ=1%~6%，最少4根主筋',
                '【箍筋規定】箍筋間距≤min(柱寬/2, 15cm)，加密區≤10cm'
            ]
        },
        apartment: {
            label: '公寓大樓 (#7主筋 12根)',
            value: 140,
            desc: '5-7F公寓',
            specs: '50×50cm，主筋12-#7，箍筋#3@12cm',
            method: '公寓大樓柱採用中型斷面，主筋12根#7三面對稱配置，箍筋#3@12cm含繫筋。',
            materials: '柱寬50cm、深50cm，主筋SD420W #7共12根，箍筋SD280W #3@12cm+繫筋，保護層4cm',
            regulations: [
                '【建築技術規則構造編§401】柱最小尺寸應考慮軸壓比限制',
                '【耐震規範】中度韌性：軸壓比≤0.3fc\'Ag',
                '【箍筋規定】箍筋需設繫筋，每隔一根主筋設置'
            ]
        },
        highrise: {
            label: '高層大樓 (#8主筋 16根)',
            value: 160,
            desc: '8F+高樓',
            specs: '60×60cm，主筋16-#8，箍筋#4@10cm',
            method: '高層建築柱需較大斷面與配筋量，主筋16根#8四面對稱配置，雙箍筋#4@10cm加繫筋。',
            materials: '柱寬60cm、深60cm，主筋SD420W #8共16根，箍筋SD420W #4@10cm雙箍+繫筋，保護層5cm',
            regulations: [
                '【建築技術規則構造編】高層建築柱需進行二階效應分析',
                '【耐震規範】高韌性：軸壓比≤0.25fc\'Ag，主筋比≥1.5%',
                '【箍筋規定】塑鉸區箍筋體積比≥0.12fc\'/fyh'
            ]
        },
        ductile: {
            label: '韌性抗震 (#9主筋 20根)',
            value: 180,
            desc: '特殊韌性',
            specs: '70×70cm，主筋20-#9，箍筋#4@8cm',
            method: '特殊抗震柱用於高層或重要建築，主筋20根#9大量配置，密箍筋#4@8cm確保韌性。',
            materials: '柱寬70cm、深70cm，主筋SD420W #9共20根，箍筋SD420W #4@8cm密箍+繫筋，保護層5cm',
            regulations: [
                '【耐震設計規範】特殊抗彎矩構架柱需滿足強柱弱梁',
                '【ACI 318】Mn柱≥1.2ΣMn梁，確保塑鉸形成於梁',
                '【圍束規定】塑鉸區箍筋需提供足夠圍束'
            ]
        },
    },
    // 樑: 依跨度與載重
    beam: {
        secondary: {
            label: '次樑/小樑 (#5主筋)',
            value: 85,
            desc: '短跨輕載',
            specs: '25×50cm，上2-#5下3-#5，箍筋#3@20cm',
            method: '次樑用於分擔樓板載重傳遞至主樑，配筋較少，上筋2根#5於支撐處，下筋3根#5於跨中。',
            materials: '樑寬25cm、深50cm，上層SD420W 2-#5，下層SD420W 3-#5，箍筋SD280W #3@20cm，保護層4cm',
            regulations: [
                '【建築技術規則】樑最小寬度20cm，最小深度25cm',
                '【配筋規定】最小配筋率ρmin=14.1/fy或1.4/fy取大值',
                '【箍筋規定】全長箍筋間距≤d/2且≤60cm'
            ]
        },
        main: {
            label: '主樑 (#6主筋)',
            value: 100,
            desc: '標準載重',
            specs: '30×60cm，上3-#6下4-#6，箍筋#3@15cm',
            method: '主樑承載樓板與次樑傳來之載重，上筋3根#6於支撐處抵抗負彎矩，下筋4根#6於跨中抵抗正彎矩。',
            materials: '樑寬30cm、深60cm，上層SD420W 3-#6，下層SD420W 4-#6，箍筋SD280W #3@15cm，保護層4cm',
            regulations: [
                '【建築技術規則構造編】主樑應能承受設計載重',
                '【耐震規範】梁端塑鉸區箍筋需加密至2倍梁深範圍',
                '【配筋規定】梁端上筋不得少於下筋之1/2'
            ]
        },
        heavy: {
            label: '大跨距樑 (#7主筋)',
            value: 120,
            desc: '大跨重載',
            specs: '40×70cm，上4-#7下5-#7，箍筋#4@12cm',
            method: '大跨距樑用於無柱空間，需較大斷面與配筋抵抗撓度，上筋4根#7，下筋5根#7雙排配置。',
            materials: '樑寬40cm、深70cm，上層SD420W 4-#7，下層SD420W 5-#7，箍筋SD420W #4@12cm，保護層5cm',
            regulations: [
                '【ACI 318】跨深比限制：簡支樑L/h≤16，連續樑L/h≤21',
                '【撓度控制】使用載重下撓度δ≤L/240',
                '【裂縫控制】fs·dc^(1/3)·A^(1/3)≤限值'
            ]
        },
        transfer: {
            label: '轉換樑 (#8主筋)',
            value: 150,
            desc: '轉換層',
            specs: '50×100cm，上6-#8下8-#8，箍筋#4@10cm',
            method: '轉換樑承載上部多根柱傳來之集中載重，需大斷面與重配筋，主筋多排配置，密箍筋抗剪。',
            materials: '樑寬50cm、深100cm，上層SD420W 6-#8雙排，下層SD420W 8-#8雙排，箍筋SD420W #4@10cm，保護層5cm',
            regulations: [
                '【轉換層規定】轉換樑需進行非線性分析',
                '【剪力設計】Vu≤φVn，箍筋需滿足剪力需求',
                '【施工規定】混凝土強度≥280kgf/cm²，分層澆置'
            ]
        },
    },
    // 樓板: 依厚度與配筋層數
    slab: {
        '12_single': {
            label: '12cm 單層 (#3@20雙向)',
            value: 13,
            desc: '單層底筋',
            specs: '主筋#3@20cm雙向，保護層2cm',
            method: '單層配筋適用於短跨距小載重樓板，底筋於跨中承受正彎矩',
            materials: '樓板厚12cm，鋼筋#3@20cm雙向配置，混凝土保護層2cm',
            regulations: ['建築技術規則構造編：RC樓板最小厚度10cm', '鋼筋間距不得大於板厚3倍且不超過45cm']
        },
        '15_single': {
            label: '15cm 單層 (#3@15雙向)',
            value: 17,
            desc: '單層底筋',
            specs: '主筋#3@15cm雙向，保護層2cm',
            method: '單層配筋適用於一般住宅樓板，底筋於跨中承受正彎矩',
            materials: '樓板厚15cm，鋼筋#3@15cm雙向配置，混凝土保護層2cm',
            regulations: ['建築技術規則構造編：RC樓板最小厚度10cm', '鋼筋間距不得大於板厚3倍且不超過45cm']
        },
        '15_double': {
            label: '15cm 雙層 (#4@20上下)',
            value: 22,
            desc: '上下層筋',
            specs: '上下層#4@20cm雙向，保護層2cm',
            method: '雙層配筋適用於連續板或較大載重，上層筋於支撐處承受負彎矩',
            materials: '樓板厚15cm，上下層#4@20cm雙向，混凝土保護層2cm',
            regulations: ['建築技術規則構造編：連續板筋需延伸至支撐', '上層筋長度≥跨度1/4']
        },
        '18_double': {
            label: '18cm 雙層 (#4@15上下)',
            value: 28,
            desc: '上下層筋',
            specs: '上下層#4@15cm雙向，保護層2.5cm',
            method: '較厚雙層配筋適用於商業空間或較大載重需求',
            materials: '樓板厚18cm，上下層#4@15cm雙向配置',
            regulations: ['活載重≥300kgf/m²時建議雙層配筋', '保護層依暴露條件調整']
        },
        '20_double': {
            label: '20cm 雙層 (#5@15上下)',
            value: 32,
            desc: '大跨距',
            specs: '上下層#5@15cm雙向，保護層3cm',
            method: '大跨距樓板需較厚板厚與較大鋼筋號數抵抗撓度',
            materials: '樓板厚20cm，上下層#5@15cm雙向，保護層3cm',
            regulations: ['跨深比L/h應符合ACI規範限制', '撓度控制δ≤L/240']
        },
    },
    // 牆體: 依厚度與配筋層數
    wall: {
        '15_single': {
            label: '15cm 單層 (#3@20)',
            value: 23,
            desc: '單側配筋',
            specs: '單側#3@20cm垂直+水平，保護層3cm',
            method: '單層配筋適用於一般隔間牆或非承重牆體',
            materials: '牆厚15cm，#3@20cm垂直與水平配筋',
            regulations: ['建築技術規則：RC牆最小厚度10cm', '豎向筋間距≤牆厚3倍且≤45cm']
        },
        '18_single': {
            label: '18cm 單層 (#4@20)',
            value: 29,
            desc: '單側配筋',
            specs: '單側#4@20cm垂直+水平，保護層3cm',
            method: '單層配筋適用於低樓層或輕載承重牆',
            materials: '牆厚18cm，#4@20cm垂直與水平配筋',
            regulations: ['承重牆需滿足軸力與彎矩需求', '牆端需設置邊緣構件']
        },
        '20_double': {
            label: '20cm 雙層 (#4@15雙側)',
            value: 38,
            desc: '雙側配筋',
            specs: '雙側#4@15cm垂直+水平，保護層3cm',
            method: '雙層配筋適用於剪力牆或較高樓層承重牆體',
            materials: '牆厚20cm，雙側#4@15cm配置，搭接長度40d',
            regulations: ['耐震設計規範：剪力牆配筋率≥0.25%', '邊界構件需設繫筋#3@10cm']
        },
        '25_double': {
            label: '25cm 雙層 (#4@12雙側)',
            value: 52,
            desc: '雙側配筋',
            specs: '雙側#4@12cm垂直+水平，保護層3cm',
            method: '較厚雙層配筋適用於高樓層剪力牆系統',
            materials: '牆厚25cm，雙側#4@12cm配置',
            regulations: ['耐震設計規範：特殊剪力牆ρ≥0.25%', '繫筋間距≤min(6db, 150mm)']
        },
        '30_double': {
            label: '30cm 雙層 (#5@12雙側)',
            value: 65,
            desc: '雙側配筋',
            specs: '雙側#5@12cm垂直+水平，保護層4cm',
            method: '重型剪力牆適用於高層建築或核心筒',
            materials: '牆厚30cm，雙側#5@12cm配置，搭接長度50d',
            regulations: ['高層建築剪力牆需進行非線性分析', '邊界區箍筋需加密配置']
        },
    },
    // 女兒牆: 依高度與風壓
    parapet: {
        light: {
            label: '輕型女兒牆 (#3@25)',
            value: 18,
            desc: '高度<100cm',
            specs: '厚15cm，高80-100cm，#3@25cm雙向',
            method: '輕型女兒牆用於低矮簡易建築，採單層配筋#3@25cm雙向，需與樓板鋼筋錨固。',
            materials: '女兒牆厚15cm、高100cm，鋼筋SD280W #3@25cm雙向單層配置，保護層3cm',
            regulations: [
                '【建築技術規則§38】欄杆扶手高度≥110cm（屋頂）',
                '【結構規定】女兒牆需與結構體錨定，錨筋伸入樓板≥40d',
                '【防水規定】女兒牆頂需設壓頂收邊，防止雨水滲入'
            ]
        },
        standard: {
            label: '標準女兒牆 (#3@20)',
            value: 22,
            desc: '高度100-120cm',
            specs: '厚15cm，高100-120cm，#3@20cm雙向',
            method: '標準女兒牆適用於一般建築，採單層配筋#3@20cm雙向，豎筋錨入樓板，橫筋環繞。',
            materials: '女兒牆厚15cm、高120cm，鋼筋SD280W #3@20cm雙向單層配置，保護層3cm',
            regulations: [
                '【建築技術規則§38】屋頂周邊女兒牆高度≥110cm',
                '【耐風設計】需檢核風力作用下之穩定性',
                '【施工規定】女兒牆與柱相接處需設置連接筋'
            ]
        },
        heavy: {
            label: '加強女兒牆 (#4@15)',
            value: 28,
            desc: '高度>120cm或風壓區',
            specs: '厚20cm，高120-150cm，#4@15cm雙向',
            method: '加強型女兒牆用於高風壓區或較高女兒牆，採雙層配筋或加大號數#4@15cm，增設扶壁柱。',
            materials: '女兒牆厚20cm、高150cm，鋼筋SD420W #4@15cm雙向單層配置，保護層4cm',
            regulations: [
                '【耐風設計規範】基本風速V10≥30m/s區域需加強設計',
                '【構造規定】高度>120cm時建議設置扶壁柱@2-3m',
                '【防墜規定】透空率限制及開口尺寸規定'
            ]
        },
        reinforced: {
            label: '雙層加強 (#4@12雙側)',
            value: 35,
            desc: '高層建築/強風區',
            specs: '厚25cm，高150cm，#4@12cm雙側',
            method: '高層建築女兒牆因風壓大，需採雙層配筋#4@12cm，並與結構柱整體設計，設置壓頂梁。',
            materials: '女兒牆厚25cm、高150cm，鋼筋SD420W #4@12cm雙側配置，壓頂梁20×25cm，保護層4cm',
            regulations: [
                '【高層建築規範】20F以上女兒牆需進行風力詳細分析',
                '【構造規定】需設壓頂梁整合，扶壁柱@1.5-2m',
                '【安全規定】必要時設置不鏽鋼欄杆加強'
            ]
        },
    },
    // 地樑: 依基礎類型與載重
    groundBeam: {
        light: {
            label: '輕型地樑 (#5主筋)',
            value: 90,
            desc: '透天基礎連接',
            specs: '30×60cm，上下各3-#5，箍筋#3@20cm',
            method: '輕型地樑連接獨立基腳，傳遞水平力並防止基礎不均勻沉陷，主筋#5上下對稱配置。',
            materials: '地樑寬30cm、深60cm，上下各SD420W 3-#5，箍筋SD280W #3@20cm，保護層5cm（接觸土壤）',
            regulations: [
                '【建築技術規則構造編】基礎間應以地樑連接',
                '【配筋規定】地樑最小寬度≥柱寬，深度≥40cm',
                '【保護層】接觸土壤面保護層≥5cm'
            ]
        },
        normal: {
            label: '標準地樑 (#6主筋)',
            value: 110,
            desc: '公寓基礎連接',
            specs: '40×80cm，上下各4-#6，箍筋#3@15cm',
            method: '標準地樑適用於一般公寓大樓基礎連接，較大斷面承載上部結構傳來之軸力與彎矩。',
            materials: '地樑寬40cm、深80cm，上下各SD420W 4-#6，箍筋SD280W #3@15cm，保護層5cm',
            regulations: [
                '【基礎工程規範】地樑需能傳遞水平力至各基腳',
                '【耐震規定】地樑鋼筋需與柱筋及基腳筋妥善錨定',
                '【施工規定】地樑底層需鋪設PC層≥5cm'
            ]
        },
        heavy: {
            label: '加強地樑 (#7主筋)',
            value: 130,
            desc: '大型基礎連接',
            specs: '50×100cm，上下各5-#7，箍筋#4@12cm',
            method: '加強地樑用於高層或大跨距建築基礎，斷面與配筋量大，可承受較大不平衡彎矩。',
            materials: '地樑寬50cm、深100cm，上下各SD420W 5-#7，箍筋SD420W #4@12cm，保護層5cm',
            regulations: [
                '【高層建築規範】地樑需考慮地震時之軸力變化',
                '【剪力設計】剪力筋需滿足Vu≤φVn',
                '【錨定規定】主筋伸入基腳長度≥50d'
            ]
        },
        grade: {
            label: '筏基地梁 (#8主筋)',
            value: 150,
            desc: '筏式基礎加勁',
            specs: '60×120cm，上下各6-#8，箍筋#4@10cm',
            method: '筏式基礎上之加勁地梁，提供基礎板額外剛度，承載柱傳來之集中載重。',
            materials: '地樑寬60cm、深120cm，上下各SD420W 6-#8雙排，箍筋SD420W #4@10cm，保護層6cm',
            regulations: [
                '【筏基規範】加勁梁需與筏板整體設計',
                '【構造規定】梁寬≥板厚，梁深≥2倍板厚',
                '【施工規定】筏基需整體一次澆置，不設施工縫'
            ]
        },
    },
    // 基礎: 依類型與載重
    foundation: {
        isolated: {
            label: '獨立基腳 (#4@20雙向)',
            value: 80,
            desc: '單柱承載',
            specs: '150×150×60cm，#4@20cm雙向底筋',
            method: '獨立基腳傳遞單根柱載重至地盤，底筋雙向配置抵抗底部彎矩，柱筋錨入基腳。',
            materials: '基腳150×150cm、厚60cm，底筋SD420W #4@20cm雙向，保護層7cm（底部）',
            regulations: [
                '【建築技術規則構造編】基礎需坐落於承載層',
                '【承載設計】qa≤容許承載力，沉陷量≤容許值',
                '【錨定規定】柱主筋伸入基腳≥40d，需設彎鉤'
            ]
        },
        spread: {
            label: '擴展基腳 (#5@15雙向)',
            value: 90,
            desc: '加大單柱承載',
            specs: '200×200×80cm，#5@15cm雙向底筋',
            method: '擴展基腳為加大版獨立基腳，用於較大柱載或較低地耐力，底筋加密配置。',
            materials: '基腳200×200cm、厚80cm，底筋SD420W #5@15cm雙向，保護層7cm',
            regulations: [
                '【基礎規範】基腳尺寸需滿足承載力與抗傾覆',
                '【配筋規定】底筋延伸至基腳邊緣並設彎鉤',
                '【施工規定】基腳底需設PC層≥10cm'
            ]
        },
        combined: {
            label: '聯合基腳 (#5@12雙向)',
            value: 100,
            desc: '雙柱共用',
            specs: '300×150×80cm，#5@12cm雙向上下層',
            method: '聯合基腳連接相鄰兩柱，承載偏心載重，上下雙層配筋抵抗正負彎矩。',
            materials: '基腳300×150cm、厚80cm，上下層SD420W #5@12cm雙向配置，保護層7cm',
            regulations: [
                '【基礎規範】聯合基腳需檢核偏心與傾覆',
                '【配筋規定】上層筋抵抗柱間負彎矩',
                '【地樑規定】建議設地樑連接增加整體性'
            ]
        },
        mat: {
            label: '筏式基礎 (#5@10上下)',
            value: 120,
            desc: '整體基礎板',
            specs: '整體板厚60-100cm，#5@10cm上下雙向',
            method: '筏式基礎將所有柱載重分散至整個底板，適用於軟弱地盤或高地下水位，雙層雙向配筋。',
            materials: '筏基板厚80cm，上下層SD420W #5@10cm雙向配置，加勁梁另計，保護層7cm',
            regulations: [
                '【筏基規範】需進行沉陷與差異沉陷分析',
                '【配筋規定】最小配筋率0.18%雙向',
                '【施工規定】需設置適當分區澆置計畫，控制水化熱'
            ]
        },
    },
    // 樓梯: 板式/框架式 (含詳細法規條文)
    stairs: {
        plate: {
            label: '板式樓梯 (#4@15主筋)',
            value: 80,
            desc: '斜板式結構',
            specs: '主筋#4@12-15cm，分布筋#3@20cm',
            method: '板式樓梯由斜放之RC板直接支承踏步，結構簡單，適用於一般住宅。梯段板作為一塊斜置的板，主筋沿梯段方向配置，分布筋垂直於主筋方向。',
            materials: '斜板厚12-18cm，主筋#4@12-15cm沿梯段方向，分布筋#3@20cm，保護層2cm，轉台處需加強錨定',
            regulations: [
                '【建築技術規則§33】一般建築：淨寬≥75cm，級高≤20cm，級深≥21cm',
                '【建築技術規則§33】學校/醫院：淨寬≥140cm，級高≤18cm，級深≥26cm',
                '【混凝土規範】踏步鋼筋每級不得少於2根#3，分布筋間距≤25cm',
                '【構造規定】樓梯高度每4m內應設置平台，平台深度≥樓梯寬度'
            ]
        },
        frame: {
            label: '框架式樓梯 (#5梯梁主筋)',
            value: 95,
            desc: '梁板式結構',
            specs: '梯梁#5-#6主筋，箍筋#3@15cm，踏步#3@20cm',
            method: '框架式樓梯(梁板式)設有梯梁支承踏步板，荷載由踏步板傳遞至梯梁，再由梯梁傳遞至平台梁或支座。適用於大跨距或重載場所，抗震性能較佳。',
            materials: '梯梁寬20cm×深40cm以上，主筋#5-#6共4根，箍筋#3@15cm，踏步板厚8-10cm，踏步板筋#3@20cm',
            regulations: [
                '【建築技術規則§33】一般建築：淨寬≥75cm，級高≤20cm，級深≥21cm',
                '【建築技術規則§33】居室>200m²：淨寬≥120cm，級高≤20cm，級深≥24cm',
                '【耐震設計】框架結構樓梯需考慮與主體結構之交互作用',
                '【構造規定】梯梁與柱連接處需設置加強鋼筋，轉台與柱牆交界需補強'
            ]
        },
    },
};

// ============================================
// 樓梯類型定義
// ============================================
const STAIR_TYPES = [
    { id: 'single', label: '單跑樓梯 (直梯)', flights: 1, landings: 0, winders: 0, desc: '無轉折，直接連接兩層' },
    { id: 'double', label: '雙跑樓梯 (折返)', flights: 2, landings: 1, winders: 0, desc: '180°轉折，平行雙梯段' },
    { id: 'lShape', label: 'L型樓梯 (七字型)', flights: 2, landings: 1, winders: 0, desc: '90°轉折，沿牆配置' },
    { id: 'uShape', label: 'U型樓梯', flights: 3, landings: 2, winders: 0, desc: '雙90°轉折，三梯段' },
    { id: 'winder', label: '半踏轉折樓梯 (扇形踏)', flights: 2, landings: 0, winders: 3, desc: '轉角用扇形踏步，省空間' },
];

// ============================================
// 構件常用規格預設 (台灣標準)
// ============================================
const COMPONENT_PRESETS = {
    column: [
        { id: '40x40x300', label: '40×40 (透天厝)', width: 40, depth: 40, height: 300, rebarRate: 120 },
        { id: '50x50x300', label: '50×50 (5F公寓)', width: 50, depth: 50, height: 300, rebarRate: 130 },
        { id: '60x60x350', label: '60×60 (電梯大樓)', width: 60, depth: 60, height: 350, rebarRate: 140 },
        { id: '70x70x350', label: '70×70 (10F+高樓)', width: 70, depth: 70, height: 350, rebarRate: 150 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    beam: [
        { id: '25x50x600', label: '25×50 (小梁)', width: 25, depth: 50, length: 600, rebarRate: 85 },
        { id: '30x60x600', label: '30×60 (主梁)', width: 30, depth: 60, length: 600, rebarRate: 100 },
        { id: '40x70x800', label: '40×70 (大樓主梁)', width: 40, depth: 70, length: 800, rebarRate: 110 },
        { id: '50x80x1000', label: '50×80 (大跨距)', width: 50, depth: 80, length: 1000, rebarRate: 120 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    slab: [
        { id: '12cm_4x4', label: '12cm 4×4m (小房間)', thickness: 12, length: 400, width: 400, perimeter: 1600 },
        { id: '15cm_6x4', label: '15cm 6×4m (一般房間)', thickness: 15, length: 600, width: 400, perimeter: 2000 },
        { id: '18cm_8x5', label: '18cm 8×5m (客廳)', thickness: 18, length: 800, width: 500, perimeter: 2600 },
        { id: '20cm_10x6', label: '20cm 10×6m (大廳)', thickness: 20, length: 1000, width: 600, perimeter: 3200 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    wall: [
        { id: '15x600x300', label: '15cm (隔間牆)', thickness: 15, length: 600, height: 300 },
        { id: '20x600x300', label: '20cm (承重牆)', thickness: 20, length: 600, height: 300 },
        { id: '25x600x350', label: '25cm (剪力牆)', thickness: 25, length: 600, height: 350 },
        { id: '30x600x350', label: '30cm (核心筒)', thickness: 30, length: 600, height: 350 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    parapet: [
        { id: '15x100x100', label: '15cm×100cm (低矮型)', thickness: 15, length: 1000, height: 100 },
        { id: '15x100x120', label: '15cm×120cm (標準)', thickness: 15, length: 1000, height: 120 },
        { id: '20x100x150', label: '20cm×150cm (加高型)', thickness: 20, length: 1000, height: 150 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    groundBeam: [
        { id: '25x50x500', label: '25×50 (迷你)', width: 25, depth: 50, length: 500, rebarRate: 85 },
        { id: '30x60x600', label: '30×60 (一般)', width: 30, depth: 60, length: 600, rebarRate: 90 },
        { id: '35x70x700', label: '35×70 (透天加強)', width: 35, depth: 70, length: 700, rebarRate: 95 },
        { id: '40x80x800', label: '40×80 (中型)', width: 40, depth: 80, length: 800, rebarRate: 100 },
        { id: '45x90x900', label: '45×90 (公寓)', width: 45, depth: 90, length: 900, rebarRate: 105 },
        { id: '50x100x1000', label: '50×100 (大型)', width: 50, depth: 100, length: 1000, rebarRate: 110 },
        { id: '60x120x1200', label: '60×120 (筏基)', width: 60, depth: 120, length: 1200, rebarRate: 130 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    foundation: [
        { id: '150x150x60', label: '獨立基腳 1.5×1.5m', width: 150, depth: 150, height: 60, rebarRate: 80 },
        { id: '200x200x80', label: '獨立基腳 2×2m', width: 200, depth: 200, height: 80, rebarRate: 85 },
        { id: '300x150x80', label: '聯合基腳 3×1.5m', width: 300, depth: 150, height: 80, rebarRate: 90 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
    stairs: [
        { id: 'single_90x20', label: '單跑 90cm寬 20級', width: 90, steps: 20, stepHeight: 17.5, stepDepth: 28, thickness: 15, stairType: 'single' },
        { id: 'double_100x16', label: '雙跑 100cm寬 16級', width: 100, steps: 16, stepHeight: 17.5, stepDepth: 28, thickness: 15, stairType: 'double', landingDepth: 100 },
        { id: 'lshape_100x18', label: 'L型 100cm寬 18級', width: 100, steps: 18, stepHeight: 17.5, stepDepth: 28, thickness: 15, stairType: 'lShape', landingDepth: 100 },
        { id: 'custom', label: '🔧 自訂尺寸', custom: true },
    ],
};

// ============================================
// 工具函數
// ============================================
const formatNumber = (num, decimals = 2) => {
    if (num === 0 || isNaN(num)) return '0';
    return num.toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// 計算函數
// ============================================
const calculateComponent = (type, params) => {
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

// ============================================
// 主元件
// ============================================
const StructuralMaterialCalculator = () => {
    // 材料規格選擇
    const [concreteGrade, setConcreteGrade] = useState('c280');
    const [rebarGrade, setRebarGrade] = useState('SD420W');

    // 構件清單
    const [components, setComponents] = useState([]);

    // 新增構件對話框
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // 新構件表單
    const [newComponent, setNewComponent] = useState({
        type: 'column',
        name: '',
        presetId: '',  // 預設規格ID
        concreteGrade: 'c280',  // 該構件混凝土強度
        rebarGrade: 'SD420W',   // 該構件鋼筋等級
        width: '',
        depth: '',
        height: '',
        length: '',
        count: '1',
        thickness: '15',
        perimeter: '',
        rebarRate: 120,
        rebarLayer: '15_single',  // 單層/雙層配筋
    });

    // 單價設定
    const [prices, setPrices] = useState({
        formwork: 850,
        rebar: 27,
        concrete: CONCRETE_GRADES.find(g => g.id === 'c280')?.price || 2900,
    });

    // 損耗率
    const [wastage, setWastage] = useState(10);

    // 複製狀態
    const [copied, setCopied] = useState(false);

    // 計算匯總
    const totals = useMemo(() => {
        return components.reduce((acc, comp) => ({
            formwork: acc.formwork + comp.formwork,
            concrete: acc.concrete + comp.concrete,
            rebar: acc.rebar + comp.rebar,
        }), { formwork: 0, concrete: 0, rebar: 0 });
    }, [components]);

    // 含損耗的數量
    const totalsWithWastage = useMemo(() => ({
        formwork: totals.formwork * (1 + wastage / 100),
        concrete: totals.concrete * (1 + wastage / 100),
        rebar: totals.rebar * (1 + wastage / 100),
    }), [totals, wastage]);

    // 總價計算
    const totalCost = useMemo(() => ({
        formwork: totalsWithWastage.formwork * prices.formwork,
        concrete: totalsWithWastage.concrete * prices.concrete,
        rebar: totalsWithWastage.rebar * prices.rebar,
        get total() { return this.formwork + this.concrete + this.rebar; }
    }), [totalsWithWastage, prices]);

    // 更新混凝土單價
    const handleConcreteGradeChange = (gradeId) => {
        setConcreteGrade(gradeId);
        const grade = CONCRETE_GRADES.find(g => g.id === gradeId);
        if (grade) {
            setPrices(prev => ({ ...prev, concrete: grade.price }));
        }
    };

    // 新增構件
    const handleAddComponent = () => {
        const calc = calculateComponent(newComponent.type, {
            width: parseFloat(newComponent.width) || 0,
            depth: parseFloat(newComponent.depth) || 0,
            height: parseFloat(newComponent.height) || 0,
            length: parseFloat(newComponent.length) || 0,
            count: parseFloat(newComponent.count) || 1,
            thickness: parseFloat(newComponent.thickness) || 15,
            perimeter: parseFloat(newComponent.perimeter) || 0,
            rebarRate: parseFloat(newComponent.rebarRate) || 100,
        });

        const typeInfo = COMPONENT_TYPES.find(t => t.id === newComponent.type);
        const component = {
            id: editingId || generateId(),
            type: newComponent.type,
            typeName: typeInfo?.label || '',
            icon: typeInfo?.icon || '',
            name: newComponent.name || `${typeInfo?.label} ${components.length + 1}`,
            params: { ...newComponent },
            ...calc,
        };

        if (editingId) {
            setComponents(prev => prev.map(c => c.id === editingId ? component : c));
            setEditingId(null);
        } else {
            setComponents(prev => [...prev, component]);
        }

        resetForm();
        setShowAddModal(false);
    };

    // 編輯構件
    const handleEditComponent = (comp) => {
        setNewComponent({
            type: comp.type,
            name: comp.name,
            ...comp.params,
        });
        setEditingId(comp.id);
        setShowAddModal(true);
    };

    // 刪除構件
    const handleDeleteComponent = (id) => {
        setComponents(prev => prev.filter(c => c.id !== id));
    };

    // 重置表單
    const resetForm = () => {
        setNewComponent({
            type: 'column',
            name: '',
            width: '',
            depth: '',
            height: '',
            length: '',
            count: '1',
            thickness: '15',
            perimeter: '',
            rebarRate: 120,
            rebarLayer: '15_single',
        });
    };

    // 複製清單
    const copyToClipboard = () => {
        const text = components.map(c =>
            `${c.name}: 模板${formatNumber(c.formwork)}m², 鋼筋${formatNumber(c.rebar)}kg, 混凝土${formatNumber(c.concrete, 3)}m³`
        ).join('\n') + `\n\n總計: 模板${formatNumber(totals.formwork)}m², 鋼筋${formatNumber(totals.rebar)}kg, 混凝土${formatNumber(totals.concrete, 3)}m³`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 渲染構件輸入表單
    const renderComponentForm = () => {
        const type = newComponent.type;
        const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent";

        const fields = {
            column: ['width', 'depth', 'height', 'count'],
            beam: ['width', 'height', 'length', 'count'],
            slab: ['length', 'width', 'thickness'],
            wall: ['length', 'height', 'thickness'],
            parapet: ['perimeter', 'height', 'thickness'],
            groundBeam: ['width', 'depth', 'length', 'count'],
            foundation: ['length', 'width', 'depth', 'count'],
            stairs: ['width', 'count', 'height', 'depth', 'thickness', 'perimeter', 'length'],  // 寬度, 階數, 階高, 踏寬, 斜板厚, 轉台數, 轉台深
        };

        const labels = {
            width: { column: '寬度 (cm)', beam: '寬度 (cm)', slab: '寬度 (m)', wall: '', groundBeam: '寬度 (cm)', foundation: '長度 (m)', stairs: '樓梯寬 (cm)' },
            depth: { column: '深度 (cm)', groundBeam: '深度 (cm)', foundation: '寬度 (m)', stairs: '踏寬 (cm)' },
            height: { column: '高度 (m)', beam: '樑高 (cm)', wall: '高度 (m)', parapet: '高度 (m)', stairs: '階高 (cm)' },
            length: { beam: '長度 (m)', slab: '長度 (m)', wall: '長度 (m)', groundBeam: '長度 (m)', stairs: '轉台深 (cm)' },
            count: { default: '數量', stairs: '總階數' },
            thickness: { slab: '厚度 (cm)', wall: '厚度 (cm)', parapet: '厚度 (cm)', stairs: '斜板厚 (cm)' },
            perimeter: { parapet: '周長 (m)', stairs: '樓梯類型' },
        };

        const placeholder = {
            width: { column: '40', beam: '30', slab: '8', groundBeam: '40', foundation: '2', stairs: '120' },
            depth: { column: '40', groundBeam: '60', foundation: '2', stairs: '28' },
            height: { column: '3', beam: '60', wall: '3', parapet: '0.9', stairs: '17' },
            length: { beam: '6', slab: '10', wall: '6', groundBeam: '8', stairs: '120' },
            count: { default: '1', stairs: '20' },
            thickness: { slab: '15', wall: '20', parapet: '15', stairs: '15' },
            perimeter: { parapet: '50', stairs: '1' },
        };

        return (
            <div className="grid grid-cols-2 gap-3">
                {fields[type]?.map(field => {
                    // 樓梯類型下拉選單 (借用perimeter欄位)
                    if (type === 'stairs' && field === 'perimeter') {
                        return (
                            <div key={field} className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">樓梯類型</label>
                                <select
                                    value={newComponent.perimeter || 'single'}
                                    onChange={e => setNewComponent(prev => ({ ...prev, perimeter: e.target.value }))}
                                    className={inputClass + ' bg-white'}
                                >
                                    {STAIR_TYPES.map(st => (
                                        <option key={st.id} value={st.id}>
                                            {st.label} - {st.desc}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }
                    // 單跑樓梯和半踏轉折樓梯不需要轉台深 (無平台)
                    if (type === 'stairs' && field === 'length' &&
                        (newComponent.perimeter === 'single' || newComponent.perimeter === 'winder' || !newComponent.perimeter)) {
                        return null;
                    }
                    return (
                        <div key={field}>
                            <label className="block text-xs text-gray-500 mb-1">
                                {labels[field]?.[type] || labels[field]?.default || field}
                            </label>
                            <input
                                type="number"
                                value={newComponent[field]}
                                onChange={e => setNewComponent(prev => ({ ...prev, [field]: e.target.value }))}
                                placeholder={placeholder[field]?.[type] || placeholder[field]?.default || ''}
                                className={inputClass}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 標題與說明 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calculator className="text-orange-500" size={24} />
                        結構材料統合計算器
                    </h2>
                    <p className="text-sm text-gray-500">逐項添加構件，自動匯整材料清單與報價</p>
                </div>
            </div>

            {/* 構件清單 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet size={18} className="text-gray-500" />
                        構件清單 ({components.length} 項)
                    </h3>
                    <button
                        onClick={() => { resetForm(); setEditingId(null); setShowAddModal(true); }}
                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-1"
                    >
                        <Plus size={16} /> 新增構件
                    </button>
                </div>

                {components.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Calculator size={48} className="mx-auto mb-3 opacity-30" />
                        <p>尚無構件，點擊「新增構件」開始計算</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {components.map((comp, idx) => (
                            <div key={comp.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{comp.icon}</span>
                                        <div>
                                            <div className="font-medium text-gray-800">{comp.name}</div>
                                            <div className="text-xs text-gray-500">
                                                模板 {formatNumber(comp.formwork)} m² · 鋼筋 {formatNumber(comp.rebar)} kg · 混凝土 {formatNumber(comp.concrete, 3)} m³
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditComponent(comp)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComponent(comp.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 材料匯總 */}
            {components.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                        <h3 className="font-medium text-orange-800 flex items-center gap-2">
                            <DollarSign size={18} />
                            材料匯總與報價
                        </h3>
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? '已複製' : '複製清單'}
                        </button>
                    </div>

                    {/* 損耗率設定 */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">損耗率:</span>
                            {[5, 10, 15].map(w => (
                                <button
                                    key={w}
                                    onClick={() => setWastage(w)}
                                    className={`px-3 py-1 rounded-lg text-sm ${wastage === w ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {w}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 單價設定與計算表 */}
                    <div className="p-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-100">
                                    <th className="text-left py-2 font-medium">材料</th>
                                    <th className="text-right py-2 font-medium">數量 (含損耗)</th>
                                    <th className="text-right py-2 font-medium w-32">單價</th>
                                    <th className="text-right py-2 font-medium">小計</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="py-3">模板</td>
                                    <td className="text-right">{formatNumber(totalsWithWastage.formwork)} m²</td>
                                    <td className="text-right">
                                        <input
                                            type="number"
                                            value={prices.formwork}
                                            onChange={e => setPrices(prev => ({ ...prev, formwork: parseFloat(e.target.value) || 0 }))}
                                            className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                                        />
                                    </td>
                                    <td className="text-right font-medium">${formatNumber(totalCost.formwork, 0)}</td>
                                </tr>
                                <tr>
                                    <td className="py-3">鋼筋 ({rebarGrade})</td>
                                    <td className="text-right">{formatNumber(totalsWithWastage.rebar)} kg</td>
                                    <td className="text-right">
                                        <input
                                            type="number"
                                            value={prices.rebar}
                                            onChange={e => setPrices(prev => ({ ...prev, rebar: parseFloat(e.target.value) || 0 }))}
                                            className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                                        />
                                    </td>
                                    <td className="text-right font-medium">${formatNumber(totalCost.rebar, 0)}</td>
                                </tr>
                                <tr>
                                    <td className="py-3">混凝土 ({CONCRETE_GRADES.find(g => g.id === concreteGrade)?.label.split(' ')[0]})</td>
                                    <td className="text-right">{formatNumber(totalsWithWastage.concrete, 3)} m³</td>
                                    <td className="text-right">
                                        <input
                                            type="number"
                                            value={prices.concrete}
                                            onChange={e => setPrices(prev => ({ ...prev, concrete: parseFloat(e.target.value) || 0 }))}
                                            className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                                        />
                                    </td>
                                    <td className="text-right font-medium">${formatNumber(totalCost.concrete, 0)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-orange-200 bg-orange-50">
                                    <td colSpan="3" className="py-3 font-bold text-orange-800">總計 (未稅)</td>
                                    <td className="text-right font-bold text-orange-800 text-lg">${formatNumber(totalCost.total, 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* 新增/編輯構件對話框 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">
                                {editingId ? '編輯構件' : '新增構件'}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* 構件類型選擇 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">構件類型</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COMPONENT_TYPES.map(t => {
                                        // 每種構件類型的預設配筋方式
                                        const defaultRebarLayers = {
                                            column: 'apartment',
                                            beam: 'main',
                                            slab: '15_single',
                                            wall: '20_double',
                                            parapet: 'standard',
                                            groundBeam: 'normal',
                                            foundation: 'isolated',
                                            stairs: 'plate',
                                        };
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    const defaultLayer = defaultRebarLayers[t.id];
                                                    const defaultRate = defaultLayer && REBAR_RATES[t.id]?.[defaultLayer]?.value || 120;
                                                    setNewComponent(prev => ({
                                                        ...prev,
                                                        type: t.id,
                                                        presetId: '',  // 重置預設規格選擇
                                                        rebarLayer: defaultLayer || prev.rebarLayer,
                                                        rebarRate: defaultRate
                                                    }));
                                                }}
                                                className={`p-2 rounded-lg text-center transition-all ${newComponent.type === t.id ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                                            >
                                                <span className="text-xl block">{t.icon}</span>
                                                <span className="text-xs">{t.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 混凝土強度 + 鋼筋等級 (並排) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">混凝土強度</label>
                                    <select
                                        value={newComponent.concreteGrade}
                                        onChange={e => setNewComponent(prev => ({ ...prev, concreteGrade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                                    >
                                        {CONCRETE_GRADES.map(g => (
                                            <option key={g.id} value={g.id}>{g.strength} kgf/cm²</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">鋼筋等級</label>
                                    <select
                                        value={newComponent.rebarGrade}
                                        onChange={e => setNewComponent(prev => ({ ...prev, rebarGrade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                                    >
                                        {REBAR_GRADES.map(g => (
                                            <option key={g.id} value={g.id}>{g.id}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 常用規格預設 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">常用規格</label>
                                <select
                                    value={newComponent.presetId}
                                    onChange={e => {
                                        const presetId = e.target.value;
                                        const presets = COMPONENT_PRESETS[newComponent.type] || [];
                                        const preset = presets.find(p => p.id === presetId);

                                        if (preset && !preset.custom) {
                                            // 自動填入預設值
                                            setNewComponent(prev => ({
                                                ...prev,
                                                presetId,
                                                width: preset.width || prev.width,
                                                depth: preset.depth || prev.depth,
                                                height: preset.height || prev.height,
                                                length: preset.length || prev.length,
                                                thickness: preset.thickness || prev.thickness,
                                                perimeter: preset.perimeter || prev.perimeter,
                                                rebarRate: preset.rebarRate || prev.rebarRate,
                                                stairType: preset.stairType || prev.stairType,
                                            }));
                                        } else {
                                            setNewComponent(prev => ({ ...prev, presetId }));
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                >
                                    <option value="">-- 選擇規格或自訂 --</option>
                                    {(COMPONENT_PRESETS[newComponent.type] || []).map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 名稱 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">名稱 (選填)</label>
                                <input
                                    type="text"
                                    value={newComponent.name}
                                    onChange={e => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={`${COMPONENT_TYPES.find(t => t.id === newComponent.type)?.label} ${components.length + 1}`}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            {/* 尺寸參數 - 選擇自訂時顯示所有欄位 */}
                            {(newComponent.presetId === 'custom' || newComponent.presetId === '') && renderComponentForm()}

                            {/* 配筋選擇 - 依構件類型顯示不同選項 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    配筋方式
                                </label>
                                <select
                                    value={newComponent.rebarLayer}
                                    onChange={e => {
                                        const layer = e.target.value;
                                        const rate = REBAR_RATES[newComponent.type]?.[layer]?.value || 100;
                                        setNewComponent(prev => ({ ...prev, rebarLayer: layer, rebarRate: rate }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                >
                                    {Object.entries(REBAR_RATES[newComponent.type] || {}).map(([key, opt]) => {
                                        // 依構件類型顯示不同單位
                                        const unit = ['slab', 'wall', 'parapet'].includes(newComponent.type) ? 'kg/m²' : 'kg/m³';
                                        return (
                                            <option key={key} value={key}>
                                                {opt.label} ({opt.value} {unit}) - {opt.desc}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* 工法說明區塊 - 當選擇有詳細資訊的配筋方式時顯示 */}
                                {newComponent.rebarLayer &&
                                    REBAR_RATES[newComponent.type]?.[newComponent.rebarLayer]?.method && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm space-y-2">
                                            {/* 工法說明 */}
                                            <div>
                                                <span className="font-medium text-blue-700">📐 工法說明：</span>
                                                <p className="text-gray-700 mt-1">
                                                    {REBAR_RATES[newComponent.type][newComponent.rebarLayer].method}
                                                </p>
                                            </div>

                                            {/* 材料規格 */}
                                            {REBAR_RATES[newComponent.type][newComponent.rebarLayer].materials && (
                                                <div>
                                                    <span className="font-medium text-blue-700">🔩 材料規格：</span>
                                                    <p className="text-gray-700 mt-1">
                                                        {REBAR_RATES[newComponent.type][newComponent.rebarLayer].materials}
                                                    </p>
                                                </div>
                                            )}

                                            {/* 法規條文 */}
                                            {REBAR_RATES[newComponent.type][newComponent.rebarLayer].regulations && (
                                                <div>
                                                    <span className="font-medium text-blue-700">📖 法規規定：</span>
                                                    <ul className="mt-1 text-gray-700 list-disc list-inside space-y-0.5">
                                                        {REBAR_RATES[newComponent.type][newComponent.rebarLayer].regulations.map((reg, idx) => (
                                                            <li key={idx} className="text-xs">{reg}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAddComponent}
                                className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {editingId ? '更新' : '加入清單'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StructuralMaterialCalculator;
