/**
 * VisualEnhancements - 視覺化增強工具集
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Masonry, Carpentry, Painting Specialists 建議
 */

import { useState, useMemo } from 'react';
import {
    Grid3X3, Palette, Box, Ruler, Copy
} from 'lucide-react';

// ==================== 磁磚排列預覽 ====================
const TileLayoutPreview = () => {
  const [roomWidth, setRoomWidth] = useState(400); // cm
  const [roomLength, setRoomLength] = useState(500); // cm
  const [tileWidth, setTileWidth] = useState(60); // cm
  const [tileHeight, setTileHeight] = useState(60); // cm
  const [pattern, setPattern] = useState('straight'); // straight, diagonal, herringbone
  const [groutWidth, _setGroutWidth] = useState(2); // mm

  const layoutInfo = useMemo(() => {
    const tilesX = Math.ceil(roomWidth / tileWidth);
    const tilesY = Math.ceil(roomLength / tileHeight);
    const totalTiles = tilesX * tilesY;
    const wastePercent = pattern === 'diagonal' ? 15 : pattern === 'herringbone' ? 20 : 10;
    const tilesWithWaste = Math.ceil(totalTiles * (1 + wastePercent / 100));
    const boxCount = Math.ceil(tilesWithWaste / 4); // 假設每箱4片
    const groutArea = ((tilesX * roomLength + tilesY * roomWidth) * (groutWidth / 10)) / 10000; // m²

    return { tilesX, tilesY, totalTiles, tilesWithWaste, boxCount, wastePercent, groutArea };
  }, [roomWidth, roomLength, tileWidth, tileHeight, pattern, groutWidth]);

  // 繪製磁磚預覽
  const renderTileGrid = () => {
    const scale = 0.4;
    const displayWidth = Math.min(roomWidth * scale, 300);
    const displayHeight = Math.min(roomLength * scale, 200);
    const tileDisplayW = (tileWidth / roomWidth) * displayWidth;
    const tileDisplayH = (tileHeight / roomLength) * displayHeight;

    return (
      <div 
        className="relative bg-zinc-100 rounded-lg overflow-hidden mx-auto"
        style={{ width: displayWidth, height: displayHeight }}
      >
        {Array.from({ length: layoutInfo.tilesY }).map((_, row) => (
          Array.from({ length: layoutInfo.tilesX }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="absolute border border-zinc-300 bg-zinc-200 hover:bg-[#D4AF37]/30 transition-colors"
              style={{
                width: tileDisplayW - 1,
                height: tileDisplayH - 1,
                left: col * tileDisplayW,
                top: row * tileDisplayH,
                transform: pattern === 'diagonal' ? 'rotate(45deg) scale(0.7)' : 'none',
              }}
            />
          ))
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">房間寬度 (cm)</label>
          <input
            type="number"
            value={roomWidth}
            onChange={(e) => setRoomWidth(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">房間長度 (cm)</label>
          <input
            type="number"
            value={roomLength}
            onChange={(e) => setRoomLength(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">磁磚尺寸 (cm)</label>
          <select
            value={`${tileWidth}x${tileHeight}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              setTileWidth(w);
              setTileHeight(h);
            }}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="30x30">30x30</option>
            <option value="45x45">45x45</option>
            <option value="60x60">60x60</option>
            <option value="80x80">80x80</option>
            <option value="60x120">60x120</option>
            <option value="30x60">30x60</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">鋪設方式</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="straight">直鋪</option>
            <option value="diagonal">斜鋪 45°</option>
            <option value="herringbone">人字鋪</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-zinc-50 rounded-2xl p-6">
        <h4 className="font-medium text-zinc-900 mb-4 text-center">排列預覽</h4>
        {renderTileGrid()}
      </div>

      {/* Result */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Grid3X3 className="text-[#D4AF37]" />
          計算結果
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{layoutInfo.totalTiles}</p>
            <p className="text-sm text-zinc-400">基本片數</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{layoutInfo.tilesWithWaste}</p>
            <p className="text-sm text-zinc-400">建議購買 (+{layoutInfo.wastePercent}%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{layoutInfo.boxCount}</p>
            <p className="text-sm text-zinc-400">箱數 (4片/箱)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{layoutInfo.groutArea.toFixed(2)}</p>
            <p className="text-sm text-zinc-400">填縫面積 m²</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 色卡/配色建議 ====================
const ColorPalette = () => {
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [style, setStyle] = useState('modern');

  const palettes = {
    modern: {
      name: '現代簡約',
      colors: [
        { name: '主牆色', hex: '#F5F5F5', desc: '暖白灰' },
        { name: '強調牆', hex: '#2C3E50', desc: '深海藍' },
        { name: '天花板', hex: '#FFFFFF', desc: '純白' },
        { name: '木作', hex: '#D4A373', desc: '自然木色' },
      ]
    },
    nordic: {
      name: '北歐風格',
      colors: [
        { name: '主牆色', hex: '#FAFAFA', desc: '雪白' },
        { name: '強調牆', hex: '#90A4AE', desc: '灰藍' },
        { name: '天花板', hex: '#FFFFFF', desc: '純白' },
        { name: '木作', hex: '#E8D5B5', desc: '淺木色' },
      ]
    },
    industrial: {
      name: '工業風格',
      colors: [
        { name: '主牆色', hex: '#9E9E9E', desc: '水泥灰' },
        { name: '強調牆', hex: '#424242', desc: '深灰' },
        { name: '天花板', hex: '#212121', desc: '暗色' },
        { name: '金屬', hex: '#8D6E63', desc: '鏽銅色' },
      ]
    },
    luxury: {
      name: '輕奢風格',
      colors: [
        { name: '主牆色', hex: '#F5F0E6', desc: '奶油白' },
        { name: '強調牆', hex: '#1A1A1A', desc: '黑色' },
        { name: '天花板', hex: '#FFFFFF', desc: '純白' },
        { name: '金屬', hex: '#D4AF37', desc: '金色' },
      ]
    },
  };

  const currentPalette = palettes[style];

  const copyColor = (hex) => {
    navigator.clipboard.writeText(hex);
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">空間類型</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="living">客廳</option>
            <option value="bedroom">臥室</option>
            <option value="kitchen">廚房</option>
            <option value="bathroom">浴室</option>
            <option value="office">辦公室</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">設計風格</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="modern">現代簡約</option>
            <option value="nordic">北歐風格</option>
            <option value="industrial">工業風格</option>
            <option value="luxury">輕奢風格</option>
          </select>
        </div>
      </div>

      {/* Color Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentPalette.colors.map((color, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div 
              className="h-24 w-full"
              style={{ backgroundColor: color.hex }}
            />
            <div className="p-4">
              <p className="font-medium text-zinc-900">{color.name}</p>
              <p className="text-sm text-zinc-500">{color.desc}</p>
              <div className="flex items-center justify-between mt-2">
                <code className="text-xs bg-zinc-100 px-2 py-1 rounded">{color.hex}</code>
                <button 
                  onClick={() => copyColor(color.hex)}
                  className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <Copy size={14} className="text-zinc-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paint Calculator */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="text-[#D4AF37]" />
          塗料用量參考
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#D4AF37]">8-10</p>
            <p className="text-sm text-zinc-400">m²/L (一道)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#D4AF37]">2</p>
            <p className="text-sm text-zinc-400">建議道數</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#D4AF37]">4-5</p>
            <p className="text-sm text-zinc-400">m²/L (實際)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#D4AF37]">10%</p>
            <p className="text-sm text-zinc-400">建議備量</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 系統櫃尺寸規劃器 ====================
const CabinetPlanner = () => {
  const [width, setWidth] = useState(240); // cm
  const [height, setHeight] = useState(240); // cm
  const [depth, setDepth] = useState(60); // cm
  const [_style, _setStyle] = useState('wardrobe');
  const [doors, setDoors] = useState(3);

  const specs = useMemo(() => {
    const panelThickness = 1.8; // cm
    const usableWidth = width - (panelThickness * 2);
    const usableHeight = height - (panelThickness * 2);
    const usableDepth = depth - panelThickness;
    
    const doorWidth = usableWidth / doors;
    const shelfCount = Math.floor(usableHeight / 35); // 每35cm一層
    
    // 板材估算
    const sideArea = 2 * (height * depth / 10000); // m²
    const topBottomArea = 2 * (width * depth / 10000);
    const backArea = width * height / 10000;
    const shelfArea = shelfCount * (usableWidth * usableDepth / 10000);
    const doorArea = doors * (usableHeight * doorWidth / 10000);
    const totalArea = sideArea + topBottomArea + backArea + shelfArea + doorArea;

    return {
      usableWidth: usableWidth.toFixed(0),
      usableHeight: usableHeight.toFixed(0),
      doorWidth: doorWidth.toFixed(1),
      shelfCount,
      totalArea: totalArea.toFixed(2),
      boardCount: Math.ceil(totalArea / 2.88), // 4x8尺板材面積
    };
  }, [width, height, depth, doors]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">總寬度 (cm)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">總高度 (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">深度 (cm)</label>
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="35">35 (書櫃)</option>
            <option value="45">45 (一般櫃)</option>
            <option value="60">60 (衣櫃)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">門片數量</label>
          <input
            type="number"
            min="1"
            max="6"
            value={doors}
            onChange={(e) => setDoors(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      {/* Cabinet Preview */}
      <div className="bg-zinc-50 rounded-2xl p-6">
        <h4 className="font-medium text-zinc-900 mb-4 text-center">櫃體預覽</h4>
        <div className="flex justify-center">
          <div 
            className="bg-[#D4A373] rounded-lg border-4 border-[#8B5A2B] flex"
            style={{ width: Math.min(width * 0.8, 300), height: Math.min(height * 0.6, 200) }}
          >
            {Array.from({ length: doors }).map((_, i) => (
              <div 
                key={i}
                className="flex-1 border border-[#8B5A2B] m-1 rounded bg-[#DEB887] flex items-center justify-center"
              >
                <div className="w-2 h-8 bg-[#8B5A2B] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Box className="text-[#D4AF37]" />
          規格計算
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{specs.doorWidth}cm</p>
            <p className="text-sm text-zinc-400">門片寬度</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{specs.shelfCount}</p>
            <p className="text-sm text-zinc-400">建議層數</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{specs.totalArea}m²</p>
            <p className="text-sm text-zinc-400">板材面積</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{specs.boardCount}</p>
            <p className="text-sm text-zinc-400">4x8尺板數</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 主組件 ====================
export const VisualEnhancements = ({ _addToast }) => {
  const [activeTool, setActiveTool] = useState('tile');

  const tools = [
    { id: 'tile', name: '磁磚排列', icon: Grid3X3, component: TileLayoutPreview },
    { id: 'color', name: '配色建議', icon: Palette, component: ColorPalette },
    { id: 'cabinet', name: '系統櫃規劃', icon: Box, component: CabinetPlanner },
  ];

  const ActiveComponent = tools.find(t => t.id === activeTool)?.component || TileLayoutPreview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Ruler className="text-[#D4AF37]" />
            視覺化設計工具
          </h1>
          <p className="text-zinc-500 mt-1">磁磚排列、配色建議、系統櫃規劃</p>
        </div>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tools.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-zinc-900 text-white' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#D4AF37] hover:text-[#D4AF37]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#D4AF37]' : ''} />
              {tool.name}
            </button>
          );
        })}
      </div>

      {/* Tool Content */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default VisualEnhancements;
