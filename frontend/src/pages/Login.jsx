import React, { useState } from 'react';
import { Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import ComponentHubLogo from '../assets/ComponentHubLogo.png';
import { loginUser } from '../services/api';

export default function Login({ onAuthSuccess, onSwitchToSignUp }) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginUser(loginForm);
      onAuthSuccess?.(res.data);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
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
            placeholder="student@example.com"
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

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#1c1c1c] px-3 text-neutral-500">
            New to ComponentHub?
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchToSignUp}
        className="w-full py-2.5 px-4 border border-neutral-700/80 bg-[#222222] rounded-lg hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition"
      >
        <UserPlus size={15} className="text-emerald-400" />
        Create a student account
      </button>
    </div>
  );
}