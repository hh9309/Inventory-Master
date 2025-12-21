
import React from 'react';

interface CalcProps {
  steps: string[];
}

const CalculationModule: React.FC<CalcProps> = ({ steps }) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">决策推理链条</h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold shadow-sm">
              {i+1}
            </span>
            <span className="text-sm text-slate-700 font-medium">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalculationModule;
