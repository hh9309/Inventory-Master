
import React from 'react';

interface FormulaProps {
  formula: string;
  logic: string;
}

const FormulaModule: React.FC<FormulaProps> = ({ formula, logic }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[3px] mb-5">模型核心公式</h3>
      {/* 修改背景为明亮的蓝紫渐变，缩小字号从 text-3xl/4xl 降至 text-xl/2xl */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-10 rounded-2xl border border-white/20 mb-5 shadow-lg flex items-center justify-center min-h-[140px]">
        <code className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider text-center block leading-relaxed drop-shadow-md">
          {formula}
        </code>
      </div>
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <p className="text-sm text-slate-600 leading-relaxed font-bold">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          决策逻辑：<span className="font-medium text-slate-500">{logic}</span>
        </p>
      </div>
    </div>
  );
};

export default FormulaModule;
