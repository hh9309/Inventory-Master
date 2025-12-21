
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface ChartProps {
  data: any[];
  rop: number;
}

const InventoryChart: React.FC<ChartProps> = ({ data, rop }) => {
  return (
    <div className="h-[320px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="time" 
            label={{ value: '仿真时间 (天)', position: 'insideBottom', offset: -15, fontSize: 13, fontWeight: 600, fill: '#64748b' }} 
            tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            label={{ value: '当前库存量', angle: -90, position: 'insideLeft', offset: 15, fontSize: 13, fontWeight: 600, fill: '#64748b' }}
            tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            formatter={(value: any) => [Number(value).toFixed(1), '库存水平']}
          />
          <Area 
            type="monotone" 
            dataKey="level" 
            stroke="#2563eb" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorLevel)" 
            animationDuration={1500}
          />
          <ReferenceLine y={rop} label={{ value: '再订货点 ROP', position: 'right', fontSize: 11, fontWeight: 'bold', fill: '#ef4444' }} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InventoryChart;
