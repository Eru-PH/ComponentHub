import React, { useState } from 'react';
import { Package, Lock } from 'lucide-react';
import { loginUser } from './services/api';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null); // { id, email, full_name, role }
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // Otherwise, show the Login screen
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-sans text-neutral-100">
      <div className="bg-[#1c1c1c] w-full max-w-md p-8 rounded-lg shadow-xl border border-neutral-800">
        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
          <Package size={28} />
          <h1 className="text-2xl font-bold text-white">ComponentHub</h1>
        </div>
        <p className="text-sm text-neutral-400 text-center mb-6">
          Sign in to access your borrowing and inventory portal
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-950/60 border border-red-800/70 text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              placeholder="studenttest@test.com"
              className="w-full p-2 rounded bg-[#141414] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              placeholder="Enter password"
              className="w-full p-2 rounded bg-[#141414] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-500 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition"
          >
            <Lock size={16} />
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Test Account Helpers for local testing */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-xs text-neutral-400 space-y-2">
          <p className="font-medium text-neutral-300">Quick Test Accounts:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setLoginForm({
                  email: 'admintest@test.com',
                  password: 'Admin123!',
                })
              }
              className="flex-1 py-1.5 px-2 border border-neutral-700 bg-neutral-800/60 rounded hover:bg-neutral-800 hover:border-emerald-500/50 text-neutral-200 transition"
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
              className="flex-1 py-1.5 px-2 border border-neutral-700 bg-neutral-800/60 rounded hover:bg-neutral-800 hover:border-emerald-500/50 text-neutral-200 transition"
            >
              Fill Student Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}