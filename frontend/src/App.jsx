import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Cpu, ClipboardCheck, ShieldCheck,
} from 'lucide-react';
import ComponentHubLogo from './assets/ComponentHubLogo.png';
import { loginUser } from './services/api';
import Dashboard from './pages/Dashboard';

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
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginUser(loginForm);
      setUser(res.data.user);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setErrorMsg('');
  };

  // Login Successful: Show Dashboard
  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  const currentSlide = SHOWCASE_SLIDES[activeSlide];
  const SlideIcon = currentSlide.icon;

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6 font-sans text-neutral-100">
      <div className="w-full max-w-5xl bg-[#1c1c1c] rounded-2xl shadow-2xl border border-neutral-800/90 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Visual Showcase Panel */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950 via-[#15241e] to-[#111614] border border-emerald-500/20 p-7 sm:p-9 flex flex-col justify-between min-h-[280px] lg:min-h-[540px]">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(5, 150, 105, 0.25), transparent 50%)',
            }}
          />

          {/* 1. Upper-left logo + ComponentHub title */}
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

          {/* Center Decorative Icon Badge */}
          <div className="relative z-10 my-8 flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 flex items-center justify-center shadow-inner">
              <SlideIcon size={42} className="text-emerald-400" />
            </div>
          </div>

          {/* Bottom Tagline + Interactive Slide Indicators */}
          <div className="relative z-10 text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-white whitespace-pre-line leading-snug">
                {currentSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300/80 max-w-sm mx-auto">
                {currentSlide.subtitle}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
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
        </div>

        {/* Right Sign-In Form Panel */}
        <div className="flex flex-col justify-center px-4 py-6 sm:px-10 sm:py-10">
          <div className="w-full max-w-md mx-auto">
            {/* 2. Logo beside ComponentHub in the login section */}
            <div className="flex items-center gap-2.5 mb-2">
              <img
                src={ComponentHubLogo}
                alt="ComponentHub Logo"
                className="w-7 h-7 object-contain rounded-md"
              />
              <span className="text-sm font-semibold tracking-wide text-emerald-400">
                ComponentHub
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-400 mt-2 mb-7">
              Sign in to access your borrowing and inventory portal.
            </p>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-800/70 text-red-300 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  placeholder="studenttest@test.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#252525] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#252525] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-500 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-lg shadow-emerald-950/40"
              >
                <Lock size={16} />
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1c1c1c] px-3 text-neutral-500">
                  Quick test accounts
                </span>
              </div>
            </div>

            {/* Quick Test Account Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setLoginForm({
                    email: 'admintest@test.com',
                    password: 'Admin123!',
                  })
                }
                className="py-2.5 px-3 border border-neutral-700/80 bg-[#222222] rounded-lg hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 transition"
              >
                Fill Admin Test
              </button>
              <button
                type="button"
                onClick={() =>
                  setLoginForm({
                    email: 'studenttest@test.com',
                    password: 'Student123!',
                  })
                }
                className="py-2.5 px-3 border border-neutral-700/80 bg-[#222222] rounded-lg hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 transition"
              >
                Fill Student Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}