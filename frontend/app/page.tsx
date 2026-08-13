'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const router = useRouter();

  // Gmail orqali kirishni saqlash
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      alert('Iltimos, to\'g\'ri Gmail manzilini kiriting!');
      return;
    }
    // Emailni saqlab, kurslar sahifasiga o'tamiz
    localStorage.setItem('user_email', emailInput);
    router.push('/courses');
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Orqa fon nurlari */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        <div className="online-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase">
          Ustoz MADi - Onlayn Ta'lim Platformasi
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Ta'lim Kelajagini <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
            Ustoz MADi
          </span> bilan yarating
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Mukammal video darsliklar, real vaqtli interaktiv boshqaruv va zamonaviy UI/UX tajribasi endi bir makonda kesishadi.
        </p>

        {/* Tugmalar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-extrabold text-slate-950 text-base shadow-xl shadow-cyan-500/20 transition-all transform active:scale-95"
          >
            Kurslarni Boshlash 🚀
          </button>

          <button 
            onClick={() => setShowLoginModal(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 font-bold text-white text-base transition-all backdrop-blur-xl"
          >
            Kabinetga Kirish ⚙️
          </button>
        </div>

        {/* Pastki statistikalar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="bg-slate-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <h3 className="text-2xl font-black text-cyan-400">7000+</h3>
            <p className="text-slate-400 text-xs mt-1">Foydalanuvchilar</p>
          </div>
          <div className="bg-slate-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <h3 className="text-2xl font-black text-indigo-400">24/7</h3>
            <p className="text-slate-400 text-xs mt-1">INTERAKTIV NAZORAT</p>
          </div>
          <div className="bg-slate-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <h3 className="text-2xl font-black text-purple-400">Pro</h3>
            <p className="text-slate-400 text-xs mt-1">DARSLIKLAR</p>
          </div>
        </div>
      </div>

      {/* GMAIL ORQALI KIRISH OYNASI (MODAL) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/15 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white mb-2">Tizimga Kirish 🔐</h3>
              <p className="text-slate-400 text-xs">Davom etish uchun o'zingizning Gmail (Google) manzilingizni kiriting.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Gmail Manzili</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-extrabold text-slate-950 text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Google / Gmail bilan kirish</span>
                <span>✨</span>
              </button>
            </form>

            <p className="text-center text-[11px] text-slate-500 mt-6">
              Admin sahifasini ochish uchun o'zadmin emailingizni (<code className="text-cyan-400">khakimovashahzoda027@gmail.com</code>) kiriting.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}