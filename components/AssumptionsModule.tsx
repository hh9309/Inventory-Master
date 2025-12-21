
import React from 'react';

interface AssumptionsProps {
  fullAssumptions: string;
}

const AssumptionsModule: React.FC<AssumptionsProps> = ({ fullAssumptions }) => {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center tracking-tight">
          <span className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-sm font-black">AS</span>
          模型底层假设 (Assumptions)
        </h2>
        <span className="text-xs font-black text-indigo-400 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 uppercase tracking-widest">Theoretical Basis</span>
      </div>

      <div className="relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-indigo-100 rounded-full"></div>
        <p className="text-base text-slate-600 leading-relaxed font-medium pl-2 text-justify">
          {fullAssumptions}
        </p>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: '需求确定性', value: '基于模型定义' },
          { label: '补货模式', value: '周期性/瞬时' },
          { label: '提前期', value: '固定常数' }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{item.label}</p>
            <p className="text-xs font-bold text-slate-700">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssumptionsModule;
