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
  const getStateColor = (state: TrimmingState) => {
    switch (state) {
      case 'optimal': return 'bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-100';
      case 'acceptable': return 'bg-amber-400 hover:bg-amber-500 shadow-sm shadow-amber-100';
      case 'bleeding_risk': return 'bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-100';
      default: return 'bg-slate-100 hover:bg-slate-200';
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
              <tr key={garden.id} className="group hover:bg-slate-50/50 transition-colors">
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
                        className={`w-full h-10 rounded-xl transition-all active:scale-90 ${getStateColor(state)}`}
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
    </div>
  );
};

export default TrimmingMatrix;
