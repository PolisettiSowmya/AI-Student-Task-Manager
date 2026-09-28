import React from 'react';
import { ShieldCheck, LogOut, ExternalLink, HelpCircle, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { defaultFirebaseConfig } from '../firebase';

interface NavbarProps {
  onOpenSetupGuide: () => void;
  onOpenForgotPassword?: () => void;
  activeTab?: 'login' | 'register';
  setActiveTab?: (tab: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSetupGuide,
  activeTab,
  setActiveTab,
}) => {
  const { user, profile, isEmailVerified, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">SecureAuth</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Firebase v11
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Email Verification & User Management
            </p>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Firebase Project Pill */}
          <button
            onClick={onOpenSetupGuide}
            title="View Firebase Connection Details"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500">Project:</span>
            <span className="font-mono text-slate-800 font-semibold">{defaultFirebaseConfig.projectId}</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                  {profile?.displayName ? profile.displayName[0] : (user.email ? user.email[0] : 'U')}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-slate-800 leading-tight max-w-[130px] truncate">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center gap-1">
                    {isEmailVerified ? (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={signOutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-lg transition-colors"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSetupGuide}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                title="Firebase Config Info"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {setActiveTab && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setActiveTab('login')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'login'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'register'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
