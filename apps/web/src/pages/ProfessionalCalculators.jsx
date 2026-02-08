/**
 * ProfessionalCalculators - 專業計算器合集
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: HVAC, Plumbing & Electrical Engineers 建議
 */

import { useState } from 'react';
import { 
  Calculator, Thermometer, Zap, Droplets,
  ChevronRight, RotateCcw, Download
} from 'lucide-react';

// ==================== BTU/坪數計算器 ====================
const BTUCalculator = () => {
  const [area, setArea] = useState('');
  const [height, setHeight] = useState('2.8');
  const [exposure, setExposure] = useState('normal'); // low, normal, high
  const [occupants, setOccupants] = useState('2');

  const calculate = () => {
    if (!area) return null;
    
    const areaNum = parseFloat(area);
    const heightNum = parseFloat(height);
    const occupantsNum = parseInt(occupants);
    
    // 基本 BTU 計算: 坪數 x 450 BTU
    let baseBTU = areaNum * 450;
    
    // 高度調整 (超過2.8m每增加0.3m增加10%)
    if (heightNum > 2.8) {
      baseBTU *= 1 + ((heightNum - 2.8) / 0.3) * 0.1;
    }
    
    // 曝曬調整
    const exposureMultiplier = { low: 0.9, normal: 1.0, high: 1.2 };
    baseBTU *= exposureMultiplier[exposure];
    
    // 人數調整 (每人增加 400 BTU)
    baseBTU += occupantsNum * 400;
    
    const tons = baseBTU / 3024; // 1噸 = 3024 BTU
    
    return {
      btu: Math.round(baseBTU),
      tons: tons.toFixed(1),
      kw: (baseBTU * 0.000293).toFixed(2),
      recommendation: tons <= 1 ? '分離式冷氣 1噸' : 
                      tons <= 2 ? '分離式冷氣 2噸' : 
                      tons <= 3 ? '分離式冷氣 2.8噸' : 
                      '建議中央空調或多台分離式'
    };
  };

  const result = calculate();

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">房間坪數</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="例如: 10"
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">天花板高度 (m)</label>
          <input
            type="number"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">西曬/頂樓程度</label>
          <select
            value={exposure}
            onChange={(e) => setExposure(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="low">輕微 (北向/低樓層)</option>
            <option value="normal">一般</option>
            <option value="high">嚴重 (西曬/頂樓)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">常駐人數</label>
          <input
            type="number"
            value={occupants}
            onChange={(e) => setOccupants(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      {result && (
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Thermometer className="text-[#D4AF37]" />
            計算結果
          </h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37]">{result.btu.toLocaleString()}</p>
              <p className="text-sm text-zinc-400">BTU/hr</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37]">{result.tons}</p>
              <p className="text-sm text-zinc-400">冷凍噸</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37]">{result.kw}</p>
              <p className="text-sm text-zinc-400">kW</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-zinc-300">💡 建議規格</p>
            <p className="text-lg font-medium">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 迴路設計計算器 ====================
const CircuitCalculator = () => {
  const [power, setPower] = useState('');
  const [voltage, setVoltage] = useState('220');
  const [phase, setPhase] = useState('single'); // single, three
  const [powerFactor, setPowerFactor] = useState('0.85');
  const [length, setLength] = useState('20');

  const calculate = () => {
    if (!power) return null;
    
    const p = parseFloat(power);
    const v = parseFloat(voltage);
    const pf = parseFloat(powerFactor);
    const len = parseFloat(length);
    
    // 計算電流
    let current;
    if (phase === 'single') {
      current = p / (v * pf);
    } else {
      current = p / (Math.sqrt(3) * v * pf);
    }
    
    // 選擇電線規格 (簡化版)
    const wireGauge = 
      current <= 15 ? { size: '1.6mm', mm2: 2.0, breaker: 15 } :
      current <= 20 ? { size: '2.0mm', mm2: 3.5, breaker: 20 } :
      current <= 30 ? { size: '5.5mm²', mm2: 5.5, breaker: 30 } :
      current <= 50 ? { size: '8mm²', mm2: 8, breaker: 50 } :
      current <= 75 ? { size: '14mm²', mm2: 14, breaker: 75 } :
      { size: '22mm² 以上', mm2: 22, breaker: 100 };
    
    // 電壓降計算 (簡化): V_drop = 2 × I × L × R
    const resistance = 0.0175 / wireGauge.mm2; // 銅的電阻率
    const voltageDrop = 2 * current * len * resistance;
    const dropPercent = (voltageDrop / v) * 100;
    
    return {
      current: current.toFixed(1),
      wireGauge: wireGauge.size,
      breaker: wireGauge.breaker,
      voltageDrop: voltageDrop.toFixed(2),
      dropPercent: dropPercent.toFixed(2),
      isDropOk: dropPercent <= 3
    };
  };

  const result = calculate();

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">負載功率 (W)</label>
          <input
            type="number"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            placeholder="例如: 3000"
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">電壓 (V)</label>
          <select
            value={voltage}
            onChange={(e) => setVoltage(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="110">110V (單相)</option>
            <option value="220">220V (單相)</option>
            <option value="380">380V (三相)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">功率因數</label>
          <input
            type="number"
            step="0.01"
            value={powerFactor}
            onChange={(e) => setPowerFactor(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">線路長度 (m)</label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      {result && (
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="text-[#D4AF37]" />
            計算結果
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{result.current}A</p>
              <p className="text-sm text-zinc-400">負載電流</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{result.wireGauge}</p>
              <p className="text-sm text-zinc-400">建議電線</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{result.breaker}A</p>
              <p className="text-sm text-zinc-400">建議斷路器</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${result.isDropOk ? 'text-green-400' : 'text-red-400'}`}>
                {result.dropPercent}%
              </p>
              <p className="text-sm text-zinc-400">電壓降</p>
            </div>
          </div>
          {!result.isDropOk && (
            <div className="bg-red-500/20 rounded-xl p-3 text-sm">
              ⚠️ 電壓降超過 3%，建議增加電線線徑或縮短配線距離
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== 管徑流量計算器 ====================
const PipeFlowCalculator = () => {
  const [flowRate, setFlowRate] = useState('');
  const [velocity, setVelocity] = useState('1.5'); // m/s
  const [pipeType, setPipeType] = useState('pvc'); // pvc, steel, copper

  const calculate = () => {
    if (!flowRate) return null;
    
    const q = parseFloat(flowRate) / 1000; // L/min to m³/min
    const v = parseFloat(velocity);
    
    // Q = A × V, A = π × (d/2)², 因此 d = sqrt(4Q / πV)
    const area = q / (v * 60); // 轉換為 m³/s
    const diameter = Math.sqrt((4 * area) / Math.PI) * 1000; // 轉換為 mm
    
    // 標準管徑規格
    const standardPipes = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150];
    const recommendedPipe = standardPipes.find(p => p >= diameter) || 150;
    
    // 實際流速
    const actualArea = Math.PI * Math.pow(recommendedPipe / 2000, 2);
    const actualVelocity = q / (actualArea * 60);
    
    return {
      calculatedDiameter: diameter.toFixed(1),
      recommendedPipe,
      actualVelocity: actualVelocity.toFixed(2),
      isVelocityOk: actualVelocity >= 0.6 && actualVelocity <= 2.0
    };
  };

  const result = calculate();

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">流量 (L/min)</label>
          <input
            type="number"
            value={flowRate}
            onChange={(e) => setFlowRate(e.target.value)}
            placeholder="例如: 60"
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">設計流速 (m/s)</label>
          <input
            type="number"
            step="0.1"
            value={velocity}
            onChange={(e) => setVelocity(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <p className="text-xs text-zinc-400 mt-1">建議: 0.6~2.0 m/s</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">管材類型</label>
          <select
            value={pipeType}
            onChange={(e) => setPipeType(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="pvc">PVC 管</option>
            <option value="steel">鍍鋅鋼管</option>
            <option value="copper">銅管</option>
          </select>
        </div>
      </div>

      {result && (
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Droplets className="text-[#D4AF37]" />
            計算結果
          </h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{result.calculatedDiameter}mm</p>
              <p className="text-sm text-zinc-400">計算管徑</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{result.recommendedPipe}mm</p>
              <p className="text-sm text-zinc-400">建議管徑</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${result.isVelocityOk ? 'text-green-400' : 'text-amber-400'}`}>
                {result.actualVelocity}m/s
              </p>
              <p className="text-sm text-zinc-400">實際流速</p>
            </div>
          </div>
          {!result.isVelocityOk && (
            <div className="bg-amber-500/20 rounded-xl p-3 text-sm">
              ⚠️ 流速不在建議範圍 (0.6~2.0 m/s)，請調整管徑或流量設計
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== 主組件 ====================
export const ProfessionalCalculators = ({ addToast }) => {
  const [activeCalc, setActiveCalc] = useState('btu');

  const calculators = [
    { id: 'btu', name: 'BTU/坪數', icon: Thermometer, component: BTUCalculator },
    { id: 'circuit', name: '迴路設計', icon: Zap, component: CircuitCalculator },
    { id: 'pipe', name: '管徑流量', icon: Droplets, component: PipeFlowCalculator },
  ];

  const ActiveComponent = calculators.find(c => c.id === activeCalc)?.component || BTUCalculator;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Calculator className="text-[#D4AF37]" />
            專業計算器
          </h1>
          <p className="text-zinc-500 mt-1">空調、電力、給排水工程計算工具</p>
        </div>
      </div>

      {/* Calculator Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {calculators.map(calc => {
          const Icon = calc.icon;
          const isActive = activeCalc === calc.id;
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-zinc-900 text-white' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#D4AF37] hover:text-[#D4AF37]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#D4AF37]' : ''} />
              {calc.name}
            </button>
          );
        })}
      </div>

      {/* Calculator Content */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default ProfessionalCalculators;
