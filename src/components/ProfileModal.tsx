import React, { useState, useEffect } from 'react';
import { X, LogOut, MapPin, Check, Trash2, Plus, User } from 'lucide-react';
import { db } from '../data/db';
import type { UserGarden, UserSession } from '../types/garden';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onGardenSwitch: () => void;
}

export default function ProfileModal({ isOpen, onClose, onLogout, onGardenSwitch }: ProfileModalProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [gardens, setGardens] = useState<UserGarden[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSession = db.getSession();
      setSession(currentSession);
      if (currentSession) {
        setName(currentSession.name);
      }
      setGardens(db.getGardens());
      setActiveId(db.getActiveGardenId());
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const handleSaveName = () => {
    if (!name.trim()) return;
    const updated = { ...session, name: name.trim() };
    db.setSession(updated);
    setSession(updated);
    setIsEditingName(false);
    onGardenSwitch(); // Trigger update in parent sidebar
  };

  const handleSwitchGarden = (id: string) => {
    db.setActiveGardenId(id);
    setActiveId(id);
    onGardenSwitch(); // Refresh views
  };

  const handleDeleteGarden = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Weet je zeker dat je dit adres en de bijbehorende planten wilt verwijderen?')) {
      db.removeGarden(id);
      const remaining = db.getGardens();
      setGardens(remaining);
      setActiveId(db.getActiveGardenId());
      onGardenSwitch();
    }
  };

  const handleLogoutClick = () => {
    if (confirm('Weet je zeker dat je wilt uitloggen?')) {
      db.clearSession();
      onLogout();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Mijn Profiel</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Info card */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            {session.avatarUrl ? (
              <img 
                src={session.avatarUrl} 
                alt={session.name} 
                className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 object-cover" 
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div className="flex-grow space-y-1">
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="px-3 py-1 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <button 
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                  >
                    Opslaan
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{session.name}</h3>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    Bewerken
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400 font-medium font-mono">{session.email}</p>
            </div>
          </div>

          {/* Manage addresses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mijn Tuinen / Adressen</h4>
              <button
                onClick={() => {
                  onClose();
                  // Redirect or show mapping
                  window.location.hash = '/map'; // Simple hash routing support if legacy, or just redirect
                  window.history.pushState({}, '', '/map');
                  // Trigger navigation by reloading page or custom event
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Nieuw Adres
              </button>
            </div>

            {gardens.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 text-center rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">Nog geen tuinen toegevoegd.</p>
                <p className="text-xs text-slate-400 mt-1">Zoek een adres op de kaart om te beginnen.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {gardens.map(g => {
                  const isActive = g.id === activeId;
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleSwitchGarden(g.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-50/50 border-emerald-500 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MapPin className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                            {g.address}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {g.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isActive ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100/50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            <Check className="w-3 h-3" />
                            Actief
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteGarden(e, g.id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-500 hover:text-rose-600 rounded-2xl font-bold transition-all text-sm active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all text-sm active:scale-95 shadow-sm"
          >
            Sluiten
          </button>
        </div>

      </div>
    </div>
  );
}
