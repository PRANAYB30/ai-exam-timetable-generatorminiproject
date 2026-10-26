import React, { useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { CollegeBrand } from '../components/Common/CollegeBrand';
import {
  GraduationCap,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Calendar,
  Building,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onEnterGuest: () => void;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onEnterGuest,
  addToast,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('error', 'Missing Information', 'Please enter your username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(username.trim(), password.trim());
      addToast('success', 'Welcome, ' + res.user.name, 'Authenticated as Controller of Examinations.');
      onLoginSuccess(res.user);
    } catch (err: any) {
      addToast('error', 'Login Failed', err.message || 'Invalid credentials. Use admin / admin123.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAutofill = () => {
    setUsername('admin');
    setPassword('admin123');
    addToast('info', 'Credentials Loaded', 'Default admin credentials populated: admin / admin123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Academic Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <CollegeBrand size="md" showSubtitle={true} />

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Academic Session: Autumn 2026-27</span>
          </span>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* Left Column: Institutional Notice & Highlights */}
          <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950 border-r border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Authorized Staff Portal</span>
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Automated Examination Scheduling System
              </h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Centralized academic portal for preparing, validating, and publishing end-semester examination timetables with guaranteed zero student clashes and venue conflicts.
              </p>

              <div className="mt-8 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <Calendar className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">Clash-Free Session Planning</span>
                    <span className="text-[11px] text-slate-400">
                      Eliminates overlapping exams for mutual student batches and elective courses.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <Building className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">Hall Capacity Allocation</span>
                    <span className="text-[11px] text-slate-400">
                      Matches registered student counts to appropriate lecture halls and computer labs.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">Independent Verification Seal</span>
                    <span className="text-[11px] text-slate-400">
                      Mathematically audits every slot before schedule release to students.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
              Department of Examinations • Ref: AITS/COE/PORTAL/2026
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Administrator Sign In</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your staff credentials to configure and set examination timetables.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                  <Lock className="h-5 w-5" />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Staff ID or University Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or coe@college.edu"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-500">Default: admin123</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>Remember my session</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickAutofill}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Auto-Fill Demo
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In as Examination Administrator</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Student View Shortcut */}
              <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 mb-2">
                  Are you a student or faculty member looking for schedules?
                </p>
                <button
                  type="button"
                  onClick={onEnterGuest}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
                >
                  <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Open Student & Public Timetable Portal</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-slate-500">
              Exam Administration Cell • Security Audit Compliant
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-3 text-center text-xs text-slate-500">
        © 2026 Apex Institute of Technology & Science — Examination Management System (EMS). Designed for academic scheduling.
      </footer>
    </div>
  );
};
