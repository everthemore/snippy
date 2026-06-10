import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  label: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUpload, label }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onUpload(file);
    }
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/*"
      />
      
      {!preview ? (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-video rounded-[32px] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-4 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
        >
          <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 text-slate-300 group-hover:text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-500">{label}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG up to 10MB</p>
          </div>
        </button>
      ) : (
        <div className="relative w-full aspect-video rounded-[32px] overflow-hidden group shadow-2xl">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white rounded-full hover:bg-emerald-50 transition-colors shadow-lg"
            >
              <Upload className="w-6 h-6 text-emerald-600" />
            </button>
            <button 
              onClick={() => setPreview(null)}
              className="p-3 bg-white rounded-full hover:bg-rose-50 transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-rose-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
