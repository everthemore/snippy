import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { pdokService } from '../services/pdok';
import type { Suggestion } from '../services/pdok';

interface AddressSearchProps {
  onSelect: (id: string, name: string) => void;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 3) {
      setLoading(true);
      try {
        const res = await pdokService.suggest(val);
        setSuggestions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Enter your Dutch address..." 
          className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 animate-spin" />}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map(s => (
            <button 
              key={s.id}
              onClick={() => {
                onSelect(s.id, s.weergavenaam);
                setQuery(s.weergavenaam);
                setSuggestions([]);
              }}
              className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-4 h-4 text-slate-300" />
              <span className="text-sm font-medium text-slate-700">{s.weergavenaam}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
