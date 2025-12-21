
import React, { useState, useEffect } from 'react';
import { InventoryModelType, InventoryParams, CalculationResult, AIConfig, AIProvider, DistributionType } from './types';
import { MODEL_METADATA, INITIAL_PARAMS, MODEL_ORDER } from './constants';
import { calculateInventory } from './utils/calculators';
import { getInventoryInsight } from './services/geminiService';
import Header from './components/Header';
import InventoryChart from './components/InventoryChart';
import FormulaModule from './components/FormulaModule';
import CalculationModule from './components/CalculationModule';
import AssumptionsModule from './components/AssumptionsModule';

const App: React.FC = () => {
  const [activeModel, setActiveModel] = useState<InventoryModelType>(InventoryModelType.BASIC_EOQ);
  const [params, setParams] = useState<InventoryParams>(INITIAL_PARAMS);
  const [results, setResults] = useState<CalculationResult>(calculateInventory(InventoryModelType.BASIC_EOQ, INITIAL_PARAMS));
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  
  // AI 设置状态
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'gemini',
    geminiKey: '',
    deepseekKey: ''
  });

  useEffect(() => {
    setResults(calculateInventory(activeModel, params));
  }, [activeModel, params]);

  const handleParamChange = (key: keyof InventoryParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const isKeyReady = () => {
    if (aiConfig.provider === 'gemini') return !!aiConfig.geminiKey;
    if (aiConfig.provider === 'deepseek') return !!aiConfig.deepseekKey;
    return false;
  };

  const checkAuthAndFetch = async () => {
    if (!isKeyReady()) {
      setShowSettings(true);
      return;
    }
    fetchAiInsight();
  };

  const fetchAiInsight = async () => {
    setIsAiLoading(true);
    setAiInsight('');
    try {
      const insight = await getInventoryInsight(activeModel, params, results, aiConfig);
      setAiInsight(insight);
    } catch (error: any) {
      if (error.message === "AUTH_REQUIRED") {
        setAiInsight("身份认证失效，请检查 API Key。");
        setShowSettings(true);
      } else {
        setAiInsight(`分析失败: ${error.message}`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const activeMeta = MODEL_METADATA[activeModel];

  // 动态生成输入字段列表
  const getInputFields = () => {
    const baseFields = [
      { label: '年需求量 (D)', key: 'demand' },
      { label: '单次订货成本 (S)', key: 'setupCost' },
      { label: '单位持有成本 (H)', key: 'holdingCost' },
      { label: '采购单价 (K)', key: 'unitPrice' },
      { label: '提前期 (L/天)', key: 'leadTime' },
    ];

    const extraFields = [];

    // 生产速率 (P)
    if (activeModel === InventoryModelType.EPQ || activeModel === InventoryModelType.EPQ_SHORTAGE_COMBINED) {
      extraFields.push({ label: '年生产速率 (P)', key: 'productionRate' });
    }

    // 缺货成本 (B/Cu)
    if (activeModel === InventoryModelType.EOQ_SHORTAGE || activeModel === InventoryModelType.EPQ_SHORTAGE_COMBINED || activeModel === InventoryModelType.NEWSVENDOR) {
      extraFields.push({ label: activeModel === InventoryModelType.NEWSVENDOR ? '单位缺货损失 (Cu)' : '单位缺货成本 (B)', key: 'shortageCost' });
    }

    // 超储成本 (Co)
    if (activeModel === InventoryModelType.NEWSVENDOR) {
      extraFields.push({ label: '单位超储成本 (Co)', key: 'overstockCost' });
    }

    // 标准差 (σ) - 只要分布是正态或者模型本身是随机模型，就显示
    if (
      params.demandDistribution === DistributionType.NORMAL || 
      activeModel === InventoryModelType.PROBABILISTIC || 
      activeModel === InventoryModelType.P_SYSTEM || 
      activeModel === InventoryModelType.NEWSVENDOR
    ) {
      extraFields.push({ label: '需求波动标准差 (σ)', key: 'standardDeviation' });
    }

    // 服务水平 (α)
    if (activeModel === InventoryModelType.PROBABILISTIC || activeModel === InventoryModelType.P_SYSTEM) {
      extraFields.push({ label: '目标服务水平 (α)', key: 'serviceLevel', min: 0.8, max: 0.99, step: 0.01 });
    }

    // 复核周期 (T)
    if (activeModel === InventoryModelType.P_SYSTEM) {
      extraFields.push({ label: '复核周期 (T/天)', key: 'reviewPeriod' });
    }

    return [...baseFields, ...extraFields];
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#f4f7fa] relative">
      <Header />
      
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">AI 模型设置与授权</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Model Configuration</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">选择智能引擎</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['gemini', 'deepseek'] as AIProvider[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setAiConfig({...aiConfig, provider: p})}
                      className={`py-4 rounded-2xl font-bold transition-all border-2 ${aiConfig.provider === p ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                    >
                      {p === 'gemini' ? 'Google Gemini' : 'DeepSeek AI'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  输入 {aiConfig.provider === 'gemini' ? 'Gemini' : 'DeepSeek'} API Key
                </label>
                <div className="relative group">
                  <input 
                    type="password"
                    placeholder={`在此输入您的密钥...`}
                    value={aiConfig.provider === 'gemini' ? aiConfig.geminiKey : aiConfig.deepseekKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (aiConfig.provider === 'gemini') setAiConfig({...aiConfig, geminiKey: val});
                      else setAiConfig({...aiConfig, deepseekKey: val});
                    }}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-mono text-sm shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium px-1">
                  注意：Gemini 与 DeepSeek 均需手动输入 Key 后才能应用智能建议。
                </p>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl ${isKeyReady() ? 'bg-slate-900 hover:bg-black scale-100' : 'bg-slate-300 cursor-not-allowed opacity-50'}`}
                disabled={!isKeyReady()}
              >
                保存并应用 Key
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1536px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[3px] mb-5 px-1">模型库 ({MODEL_ORDER.length})</h2>
            <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
              {MODEL_ORDER.map((key) => {
                const meta = MODEL_METADATA[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveModel(key)}
                    className={`w-full flex items-center p-4 rounded-2xl transition-all border-2 ${
                      activeModel === key 
                      ? 'bg-blue-600 text-white shadow-lg border-blue-600 scale-[1.02]' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <span className="text-3xl mr-4">{meta.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-base tracking-tight">{meta.name}</p>
                      <p className={`text-sm mt-0.5 leading-tight ${activeModel === key ? 'text-blue-100' : 'text-slate-400'}`}>{meta.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[3px]">AI 智能决策</h3>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <svg className="w-5 h-5 animate-hover-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
            </div>
            <button 
              onClick={checkAuthAndFetch} 
              disabled={isAiLoading} 
              className={`w-full py-4 text-white rounded-2xl font-black transition-all shadow-lg ${isKeyReady() ? 'bg-slate-900 hover:bg-black' : 'bg-slate-400 opacity-60 cursor-not-allowed'}`}
            >
              {isAiLoading ? (
                <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2 border-2 border-white/20 border-t-white rounded-full"></svg>研判中...</span>
              ) : '生成智能策略建议'}
            </button>
            <div className="mt-4 flex items-center justify-between px-1">
               <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">引擎:</span>
                 <span className="text-[10px] font-black text-blue-500 uppercase">{aiConfig.provider}</span>
               </div>
               <div className={`text-[10px] font-black uppercase ${isKeyReady() ? 'text-green-500' : 'text-red-400'}`}>
                 {isKeyReady() ? '● 已就绪' : '○ 未授权'}
               </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-6 space-y-8">
          <AssumptionsModule fullAssumptions={activeMeta.fullAssumptions} />

          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-800 flex items-center tracking-tight">
                <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm font-black">IN</span>
                输入参数配置 ({activeMeta.name})
              </h2>
              {/* 分布类型选择器 */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => handleParamChange('demandDistribution', DistributionType.CONSTANT)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${params.demandDistribution === DistributionType.CONSTANT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  确定性需求
                </button>
                <button 
                  onClick={() => handleParamChange('demandDistribution', DistributionType.NORMAL)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${params.demandDistribution === DistributionType.NORMAL ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  正态分布需求
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              {getInputFields().map(field => (
                <div key={field.key} className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-slate-500">{field.label}</label>
                    {field.key === 'standardDeviation' && <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">波动参数</span>}
                  </div>
                  <input 
                    type="number" 
                    step={(field as any).step || (field.key === 'standardDeviation' ? 0.1 : 1)}
                    min={(field as any).min}
                    max={(field as any).max}
                    value={(params as any)[field.key] ?? ''} 
                    onChange={(e) => handleParamChange(field.key as any, Number(e.target.value))}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:bg-white outline-none text-lg font-bold text-slate-800 transition-all shadow-inner"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">库存演化仿真模拟</h2>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${params.demandDistribution === DistributionType.NORMAL ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  {params.demandDistribution === DistributionType.NORMAL ? 'Stochastic' : 'Deterministic'}
                </span>
                <div className="px-5 py-2 bg-blue-50 text-blue-700 text-xs font-black rounded-full border border-blue-100">动力学仿真</div>
              </div>
            </div>
            <InventoryChart data={results.chartData} rop={results.reorderPoint} />
          </section>

          {aiInsight && (
            <section className="bg-slate-900 rounded-[2rem] p-10 text-white border border-slate-800 shadow-2xl relative overflow-hidden group animate-in slide-in-from-bottom duration-500">
              <h3 className="text-lg font-black mb-8 flex items-center uppercase tracking-[4px] text-blue-400">
                AI 策略专家研判 ({aiConfig.provider.toUpperCase()})
              </h3>
              <div className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap font-medium bg-white/5 p-8 rounded-3xl border border-white/10 italic">
                {aiInsight}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-3 space-y-6">
          <FormulaModule formula={activeMeta.formula} logic={activeMeta.logic} />
          <CalculationModule steps={results.steps} />
          <section className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[3px] mb-8">决策看板</h2>
            <div className="space-y-10">
              <div>
                <p className="text-sm text-slate-500 font-bold mb-3">最佳决策量 Q*</p>
                <div className="flex items-baseline space-x-1">
                  <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                    {results.optimalQty.toFixed(0)}
                  </p>
                  <span className="text-sm font-bold text-slate-400">单位</span>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">安全库存 SS</p>
                  <p className="text-3xl font-black text-slate-800 tabular-nums">{results.safetyStock.toFixed(1)}</p>
                </div>
                <div className="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100/50">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">预估年度总成本 TC</p>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold text-indigo-400 mr-2">¥</span>
                    <p className="text-3xl font-black text-indigo-700 tracking-tighter tabular-nums leading-none">
                      {results.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </main>
      
      <style>{`
        @keyframes hover-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(180deg); }
        }
        .animate-hover-spin:hover {
          animation: hover-spin 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
