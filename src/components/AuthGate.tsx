import React, { useState, useEffect } from 'react';
import { Leaf, Mail, User, Lock, ArrowRight, ArrowLeft, CheckCircle2, CloudSun, MapPin, Zap } from 'lucide-react';
import { db } from '../data/db';
import type { UserSession } from '../types/garden';

interface AuthGateProps {
  children: React.ReactNode;
  onLoginStateChange: () => void;
}

export default function AuthGate({ children, onLoginStateChange }: AuthGateProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ftueStep, setFtueStep] = useState(0); // 0 means show onboarding intro, 1-4 slides
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(db.getSession());
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vul a.u.b. een e-mailadres in.');
      return;
    }
    if (isRegister && !name) {
      setError('Vul a.u.b. een naam in.');
      return;
    }

    const mockSession: UserSession = {
      name: isRegister ? name : email.split('@')[0],
      email: email,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      ftueCompleted: !isRegister // If logging in, assume already completed. If registering, start FTUE!
    };

    db.setSession(mockSession);
    setSession(mockSession);
    onLoginStateChange();

    if (isRegister) {
      setFtueStep(1); // Start onboarding!
    }
  };

  const handleDemo = () => {
    const demoSession: UserSession = {
      name: 'Demo Tuinier',
      email: 'demo@snippy.nl',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Demo',
      ftueCompleted: true
    };
    db.setSession(demoSession);
    setSession(demoSession);
    onLoginStateChange();
  };

  const handleFinishOnboarding = () => {
    if (session) {
      const updatedSession = { ...session, ftueCompleted: true };
      db.setSession(updatedSession);
      setSession(updatedSession);
      onLoginStateChange();
    }
  };

  // If logged in and completed onboarding, let them access the app!
  if (session && session.ftueCompleted) {
    return <>{children}</>;
  }

  // If logged in but onboarding is NOT completed, show the FTUE carousel
  if (session && !session.ftueCompleted) {
    const slides = [
      {
        title: 'Welkom bij Snippy!',
        description: 'Snippy helpt je om je fruitbomen, heesters en andere tuinplanten op de juiste manier te verzorgen en te snoeien.',
        icon: <Leaf className="w-16 h-16 text-emerald-500" />,
        color: 'from-emerald-500/20 to-teal-500/20'
      },
      {
        title: 'Zoek je tuin op de kaart',
        description: 'Vul je adres in om de officiële Kadaster-perceelgrenzen en gebouwen direct in te laden. Zo zie je precies waar jouw tuin ligt.',
        icon: <MapPin className="w-16 h-16 text-sky-500" />,
        color: 'from-sky-500/20 to-indigo-500/20'
      },
      {
        title: 'Planten slepen & positioneren',
        description: 'Voeg je bomen en planten toe aan de inventaris en sleep ze direct naar hun werkelijke plek op de perceelkaart.',
        icon: <Zap className="w-16 h-16 text-amber-500" />,
        color: 'from-amber-500/20 to-orange-500/20'
      },
      {
        title: 'Slim AI-advies & Frost Warning',
        description: 'Onze AI-bot bekijkt het lokale microklimaat, de Open-Meteo weersvoorspelling en waarschuwt bij nachtvorst om je planten te beschermen.',
        icon: <CloudSun className="w-16 h-16 text-rose-500" />,
        color: 'from-rose-500/20 to-purple-500/20'
      }
    ];

    const currentSlide = slides[ftueStep - 1] || slides[0];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-lg bg-white/95 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[520px] justify-between relative">
          
          {/* Top Progress bar */}
          <div className="flex w-full h-1.5 bg-slate-100">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`flex-1 h-full transition-all duration-300 ${idx < ftueStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
              />
            ))}
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className={`p-6 bg-gradient-to-br ${currentSlide.color} rounded-full animate-bounce-slow shadow-inner`}>
              {currentSlide.icon}
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                {currentSlide.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                {currentSlide.description}
              </p>
            </div>
          </div>

          {/* Slide Footer / Navigation */}
          <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <button
              onClick={() => setFtueStep(prev => Math.max(1, prev - 1))}
              disabled={ftueStep === 1}
              className={`flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-0`}
            >
              <ArrowLeft className="w-4 h-4" />
              Vorige
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${idx + 1 === ftueStep ? 'w-4 bg-emerald-500' : 'bg-slate-300'}`}
                />
              ))}
            </div>

            {ftueStep === slides.length ? (
              <button
                onClick={handleFinishOnboarding}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
              >
                Afronden
                <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setFtueStep(prev => Math.min(slides.length, prev + 1))}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
              >
                Volgende
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not logged in: show Login/Registration Form
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-teal-900/40 backdrop-blur-xl p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur border border-white/20 rounded-[40px] shadow-2xl p-8 space-y-8 animate-scale-up">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[22px] flex items-center justify-center shadow-lg shadow-emerald-200 animate-spin-slow">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Snippy</h1>
            <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">
              {isRegister ? 'Registreren' : 'Inloggen'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl animate-shake">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Je naam"
                className="w-full pl-12 pr-4 py-4 bg-slate-50/65 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm text-slate-700"
                value={name}
                onChange={e => { setName(e.target.value); setError(null); }}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder="Je e-mailadres"
              className="w-full pl-12 pr-4 py-4 bg-slate-50/65 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm text-slate-700"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              placeholder="Wachtwoord (elke invoer ok)"
              className="w-full pl-12 pr-4 py-4 bg-slate-50/65 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm text-slate-700"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 mt-6 text-sm"
          >
            {isRegister ? 'Registreren' : 'Inloggen'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Of</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={handleDemo}
          className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-98 text-sm"
        >
          Bekijk Demo (Sla inloggen over)
        </button>

        {/* Switch Link */}
        <div className="text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
          >
            {isRegister 
              ? 'Heb je al een account? Log in' 
              : 'Nieuw hier? Maak een account aan'}
          </button>
        </div>

      </div>
    </div>
  );
}
