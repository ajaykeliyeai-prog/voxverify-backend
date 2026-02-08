
import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DetectionResult } from '../types';

interface ResultDisplayProps {
  result: DetectionResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const isAI = result.classification === 'AI_GENERATED';
  const confidencePercent = Math.round(result.confidence * 100);
  
  const data = [
    { name: 'Confidence', value: confidencePercent },
    { name: 'Remaining', value: 100 - confidencePercent },
  ];

  const COLORS = [isAI ? '#ef4444' : '#10b981', '#f1f5f9'];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* 
          Robust Chart Container: 
          Using explicit width/height on PieChart instead of ResponsiveContainer 
          to definitively solve the "width(-1)" measurement error.
        */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative min-h-[220px]">
          <div className="relative">
            <PieChart width={200} height={200}>
              <Pie
                data={data}
                cx={100}
                cy={100}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
            
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800">{confidencePercent}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Confidence</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Forensic Report</span>
            <h2 className={`text-4xl font-black mt-2 tracking-tight ${isAI ? 'text-red-500' : 'text-emerald-500'}`}>
              {result.classification === 'AI_GENERATED' ? 'Synthetic Detected' : 'Authentic Human'}
            </h2>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 relative">
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-bold text-slate-300 uppercase">Analysis Findings</div>
            <p className="text-slate-600 leading-relaxed text-sm">
              {result.explanation}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] font-bold">
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase border border-indigo-100">Lang: {result.language}</span>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase border border-slate-200">TS: {new Date(result.timestamp).toLocaleTimeString()}</span>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase border border-slate-200">Ref: VOX-{result.timestamp.toString().slice(-4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
