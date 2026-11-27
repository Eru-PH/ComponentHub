import React, { useState } from 'react';
import { Cpu, ClipboardCheck, ShieldCheck } from 'lucide-react';
import ComponentHubLogo from './assets/ComponentHubLogo.png';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

const SHOWCASE_SLIDES = [
  {
    icon: Cpu,
    title: 'Track what you borrow,\nNever lose a component again',
    subtitle:
      'Real-time lab inventory across microcontrollers, sensors, and power modules.',
  },
  {
    icon: ClipboardCheck,
    title: 'Fast Student Check-Outs,\nClear Return Logs',
    subtitle:
      'Streamlined borrowing workflows with condition tracking on every check-in.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Control,\nInstant CSV Audits',
    subtitle:
      'Dedicated student and admin views with one-click activity log exports.',
  },
];

export default function App() {
  const [user, setUser] = useState(null); // { id, email, full_name, role }
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activeSlide, setActiveSlide] = useState(0);

  const handleAuthSuccess = (authPayload) => {
    const resolvedUser = authPayload?.user || authPayload;
    setUser(resolvedUser);
    setAuthView('login');
  };

  const handleLogout = () => {
    setUser(null);
    setAuthView('login');
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  const currentSlide = SHOWCASE_SLIDES[activeSlide];
  const SlideIcon = currentSlide.icon;

  return (
    <div
      className="min-h-screen bg-[#111312] flex items-center justify-center p-4 sm:p-6 font-sans text-neutral-100"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.16), transparent 45%), radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 24px 24px',
      }}
    >
      <style>{`
        @keyframes hubEntrance {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes hubFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes slideFadeUp {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-hub-entrance {
          animation: hubEntrance 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-hub-float {
          animation: hubFloat 4.5s ease-in-out infinite;
        }
        .animate-slide-swap {
          animation: slideFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div className="animate-hub-entrance w-full max-w-5xl bg-gradient-to-b from-[#1e2120] to-[#181818] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.65)] border border-neutral-800/90 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Visual Showcase Panel */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950 via-[#15241e] to-[#111614] border border-emerald-500/20 hover:border-emerald-500/35 p-7 sm:p-9 flex flex-col justify-between min-h-[280px] lg:min-h-[540px] transition-colors duration-300">
          <div
            className="pointer-events-none absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(5, 150, 105, 0.25), transparent 50%)',
            }}
          />

          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-white">
              <img
                src={ComponentHubLogo}
                alt="ComponentHub Logo"
                className="w-8 h-8 object-contain rounded-md"
              />
              <span className="text-lg font-bold tracking-tight">
                ComponentHub
              </span>
            </div>

            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-neutral-200 border border-white/10 backdrop-blur-sm">
              Lab Inventory Portal
            </span>
          </div>

          {/* Animated Icon + Copy per Slide */}
          <div
            key={activeSlide}
            className="animate-slide-swap relative z-10 flex-1 flex flex-col justify-between my-4"
          >
            <div className="my-auto py-6 flex justify-center">
              <div className="animate-hub-float w-24 h-24 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 flex items-center justify-center shadow-inner shadow-emerald-500/10">
                <SlideIcon size={42} className="text-emerald-400" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-white whitespace-pre-line leading-snug">
                {currentSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300/80 max-w-sm mx-auto">
                {currentSlide.subtitle}
              </p>
            </div>
          </div>

          {/* Slide Dots */}
          <div className="relative z-10 flex items-center justify-center gap-2 pt-2">
            {SHOWCASE_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx
                    ? 'w-8 bg-white'
                    : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Auth Panel */}
        <div className="flex flex-col justify-center px-4 py-6 sm:px-10 sm:py-10 rounded-xl bg-gradient-to-br from-[#1d201f] via-[#1b1b1b] to-[#171918]">
          {authView === 'signup' ? (
            <SignUp
              onAuthSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setAuthView('login')}
            />
          ) : (
            <Login
              onAuthSuccess={handleAuthSuccess}
              onSwitchToSignUp={() => setAuthView('signup')}
            />
          )}
        </div>
      </div>
    </div>
  );
}