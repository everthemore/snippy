import React, { useState, useEffect } from 'react';
import type { GardenPlant, Plant, TrimmingState } from '../types/garden';

interface TrimmingMatrixProps {
  plants: Array<{ garden: GardenPlant; details: Plant }>;
  onCellClick: (plant: Plant, month: number) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const TrimmingMatrix: React.FC<TrimmingMatrixProps> = ({ plants, onCellClick }) => {
  const [ftuiStep, setFtuiStep] = useState<number | null>(() => {
    const s = localStorage.getItem('snippy_ftui_step');
    return s ? parseInt(s, 10) : null;
  });
  const language = localStorage.getItem('snippy-lang') || 'nl';

  useEffect(() => {
    const handleSync = () => {
      const s = localStorage.getItem('snippy_ftui_step');
      setFtuiStep(s ? parseInt(s, 10) : null);
    };
    window.addEventListener('ftuiStateChange', handleSync);
    return () => window.removeEventListener('ftuiStateChange', handleSync);
  }, []);

  const getStateColor = (state: TrimmingState) => {
    const isFtui8 = ftuiStep === 8;
    switch (state) {
      case 'optimal': return `bg-emerald-500 ${isFtui8 ? '' : 'hover:bg-emerald-600'} shadow-sm shadow-emerald-100`;
      case 'acceptable': return `bg-amber-400 ${isFtui8 ? '' : 'hover:bg-amber-500'} shadow-sm shadow-amber-100`;
      case 'bleeding_risk': return `bg-rose-500 ${isFtui8 ? '' : 'hover:bg-rose-600'} shadow-sm shadow-rose-100`;
      default: return `bg-slate-100 ${isFtui8 ? '' : 'hover:bg-slate-200'}`;
    }
  };

  return (
    <div className="w-full bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="sticky left-0 z-10 bg-slate-50/50 p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[200px]">Plant</th>
              {MONTHS.map(month => (
                <th key={month} className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plants.map(({ garden, details }) => (
              <tr 
                key={garden.id} 
                className={`group transition-colors ${
                  ftuiStep === 8 ? '' : 'hover:bg-slate-50/50'
                }`}
              >
                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 p-6 border-b border-slate-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-lg">{garden.nickname || details.commonName}</span>
                    <span className="text-xs italic text-slate-400">{details.latinName}</span>
                  </div>
                </td>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1;
                  const matrixItem = details.trimmingMatrix.find(m => m.month === monthNum);
                  const state = matrixItem?.state || 'avoid';
                  
                  return (
                    <td key={i} className="p-2 border-b border-slate-50">
                      <button 
                        onClick={() => onCellClick(details, monthNum)}
                        className={`w-full h-10 rounded-xl transition-all ${
                          ftuiStep === 8 ? 'pointer-events-none cursor-default' : 'active:scale-90'
                        } ${getStateColor(state)}`}
                        title={`${details.commonName} - ${MONTHS[i]}: ${state}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {ftuiStep === 8 ? (
        <div className="p-8 bg-emerald-50/35 border-t border-emerald-100 flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-1.5">
            <span>💡 {language === 'nl' ? "Snoeiadvies Uitleg" : "Pruning Advice Explanation"}</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Green Optimal Balloon */}
            <div className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-100 w-fit shadow-sm">
                <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm animate-pulse" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  {language === 'nl' ? "Optimaal (Groen)" : "Optimal (Green)"}
                </span>
              </div>
              <div className="relative bg-emerald-500 text-white text-xs p-4 rounded-2xl shadow-md border border-emerald-600 leading-relaxed font-semibold">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-500 border-l border-t border-emerald-600 rotate-45" />
                {language === 'nl' 
                  ? "Perfecte tijd om te snoeien. De boom of plant verdraagt de ingreep goed en wonden genezen zeer snel." 
                  : "Perfect time to prune. The tree or plant tolerates the cut well and wounds heal very quickly."}
              </div>
            </div>

            {/* Orange Acceptable Balloon */}
            <div className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-100 w-fit shadow-sm">
                <div className="w-4 h-4 rounded-md bg-amber-400 shadow-sm animate-pulse" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  {language === 'nl' ? "Acceptabel (Oranje)" : "Acceptable (Orange)"}
                </span>
              </div>
              <div className="relative bg-amber-400 text-slate-900 text-xs p-4 rounded-2xl shadow-md border border-amber-500 leading-relaxed font-bold">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-amber-400 border-l border-t border-amber-500 rotate-45" />
                {language === 'nl' 
                  ? "Snoeien kan, maar is niet ideaal. Vermijd snoeien als er vorst in de weersvoorspelling staat." 
                  : "Pruning is possible, but less than ideal. Avoid cuts if frost is predicted in the forecast."}
              </div>
            </div>

            {/* Red Bleeding Risk/Avoid Balloon */}
            <div className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-rose-100 w-fit shadow-sm">
                <div className="w-4 h-4 rounded-md bg-rose-500 shadow-sm animate-pulse" />
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  {language === 'nl' ? "Bloedingsrisico (Rood)" : "Bleeding Risk (Red)"}
                </span>
              </div>
              <div className="relative bg-rose-500 text-white text-xs p-4 rounded-2xl shadow-md border border-rose-600 leading-relaxed font-semibold">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-rose-500 border-l border-t border-rose-600 rotate-45" />
                {language === 'nl' 
                  ? "Niet snoeien! Gevaar op sapbloeden (zoals bij steenfruit) of grote kans op schimmels en vorstschade." 
                  : "Do not prune! Danger of sap bleeding (common in stone fruit) or high risk of infection and frost damage."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-400 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Acceptable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-rose-500 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bleeding Risk / Avoid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-slate-100 shadow-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Trimming</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrimmingMatrix;
