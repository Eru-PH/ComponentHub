import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import ComponentHubLogo from '../assets/ComponentHubLogo.png';
import { registerUser, loginUser } from '../services/api';

export default function SignUp({ onAuthSuccess, onSwitchToLogin }) {
  const [signUpForm, setSignUpForm] = useState({
    full_name: '',
    borrower_key: '',
    email: '',
    password: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      full_name: signUpForm.full_name.trim(),
      borrower_key: signUpForm.borrower_key.trim() || undefined,
      email: signUpForm.email.trim(),
      password: signUpForm.password,
      role: 'student',
    };

    try {
      const res = await registerUser(payload);

      if (res.data?.user) {
        onAuthSuccess?.(res.data);
        return;
      }

      // Fallback if backend register endpoint only returns a success message
      const loginRes = await loginUser({
        email: payload.email,
        password: payload.password,
      });
      onAuthSuccess?.(loginRes.data);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Could not create student account. Please try again.'
      );
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
        Student sign up
      </h1>
      <p className="text-sm text-neutral-400 mt-2 mb-6">
        Register a student account to borrow hardware and track returns.
      </p>

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-800/70 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Full name
          </label>
          <input
            type="text"
            required
            value={signUpForm.full_name}
            onChange={(e) =>
              setSignUpForm({ ...signUpForm, full_name: e.target.value })
            }
            placeholder="Enter your full name"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#252525] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Student ID / Borrower key{' '}
            <span className="text-neutral-500">(optional)</span>
          </label>
          <input
            type="text"
            value={signUpForm.borrower_key}
            onChange={(e) =>
              setSignUpForm({ ...signUpForm, borrower_key: e.target.value })
            }
            placeholder="e.g. TUPM-24-XXXX"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#252525] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            value={signUpForm.email}
            onChange={(e) =>
              setSignUpForm({ ...signUpForm, email: e.target.value })
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
              minLength={6}
              value={signUpForm.password}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, password: e.target.value })
              }
              placeholder="Create a password (min. 6 characters)"
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
          <UserPlus size={16} />
          {submitting ? 'Creating account...' : 'Create Student Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft size={14} />
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}