import { X, Scissors, Wrench, Droplets, ThermometerSnowflake, Info } from 'lucide-react';
import type { Plant } from '../types/garden';
import { useLanguage } from '../services/i18n';

interface TrimmingDetailModalProps {
  plant: Plant | null;
  month: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES_EN = [
  '', 'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_NL = [
  '', 'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

const TrimmingDetailModal: React.FC<TrimmingDetailModalProps> = ({ plant, month, isOpen, onClose }) => {
  const { language } = useLanguage();
  if (!isOpen || !plant || !month) return null;

  const matrixItem = plant.trimmingMatrix.find(m => m.month === month);
  const advice = matrixItem?.advice || "No specific advice for this month. Trimming is generally not recommended during this period.";
  const monthName = language === 'nl' ? MONTH_NAMES_NL[month] : MONTH_NAMES_EN[month];

  const getStateInfo = (state: string) => {
    const isDutch = language === 'nl';
    switch (state) {
      case 'optimal':
        return {
          label: isDutch ? 'Optimaal' : 'Optimal',
          bgColorClass: 'bg-emerald-600'
        };
      case 'acceptable':
        return {
          label: isDutch ? 'Acceptabel' : 'Acceptable',
          bgColorClass: 'bg-amber-500'
        };
      case 'bleeding_risk':
        return {
          label: isDutch ? 'Bloedingsrisico' : 'Bleeding Risk',
          bgColorClass: 'bg-rose-600'
        };
      case 'avoid':
      default:
        return {
          label: isDutch ? 'Vermijden' : 'Avoid',
          bgColorClass: 'bg-slate-500'
        };
    }
  };

  const stateInfo = getStateInfo(matrixItem?.state || 'avoid');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="p-2 bg-white/80 backdrop-blur shadow-sm rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
          <div className={`w-full md:w-1/3 p-8 text-white transition-colors duration-300 ${stateInfo.bgColorClass}`}>
            <h3 className="text-3xl font-black leading-tight mb-2">{monthName}</h3>
            <p className="text-white/80 font-medium mb-8">Trimming Guide</p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Scissors className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">{stateInfo.label}</span>
              </div>
              
              {plant.defaultInstructions.frostWarning && (
                <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/20">
                  <ThermometerSnowflake className="w-6 h-6 text-blue-200" />
                  <span className="text-xs font-medium">Frost protection recommended</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{plant.commonName}</h2>
              <p className="text-slate-400 italic">{plant.latinName}</p>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2">
              <section>
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  <Info className="w-4 h-4 text-emerald-500" />
                  Seasonal Advice
                </h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {advice}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <section>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Droplets className="w-4 h-4 text-emerald-500" />
                    Target Shoots
                  </h4>
                  <p className="text-sm text-slate-700 font-medium">{plant.defaultInstructions.targetShoots}</p>
                </section>
                <section>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Scissors className="w-4 h-4 text-emerald-500" />
                    Cut Depth
                  </h4>
                  <p className="text-sm text-slate-700 font-medium">{plant.defaultInstructions.cutDepth}</p>
                </section>
              </div>

              <section>
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  <Wrench className="w-4 h-4 text-emerald-500" />
                  Required Tools
                </h4>
                <div className="flex flex-wrap gap-2">
                  {plant.defaultInstructions.tools.map(tool => (
                    <span key={tool} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                      {tool}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <button 
              onClick={onClose}
              className="mt-8 w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimmingDetailModal;
