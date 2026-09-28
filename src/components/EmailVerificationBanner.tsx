import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';

export const EmailVerificationBanner: React.FC = () => {
  const { user, isEmailVerified, sendVerificationEmail, refreshUser } = useAuth();

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [justVerified, setJustVerified] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!user || (isEmailVerified && !justVerified)) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setMessage(null);

    const result = await sendVerificationEmail();
    setResending(false);

    if (result.success) {
      setCooldown(60);
      setMessage({
        text: `Verification link sent to ${user.email}! Please check your inbox and spam folder.`,
        type: 'success',
      });
    } else {
      const friendly = getFriendlyAuthErrorMessage(result.error);
      setMessage({
        text: `${friendly.title}: ${friendly.message}`,
        type: 'error',
      });
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      await refreshUser();
      if (user?.emailVerified) {
        setJustVerified(true);
        setMessage({
          text: 'Congratulations! Your email address has been successfully verified.',
          type: 'success',
        });
        setTimeout(() => setJustVerified(false), 8000);
      } else {
        setMessage({
          text: 'Email not verified yet. Please make sure you clicked the verification link in your inbox.',
          type: 'info',
        });
      }
    } catch {
      setMessage({
        text: 'Failed to refresh status. Please try again.',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  if (justVerified) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Email Verified Successfully! Your account is now fully secured.
            </span>
          </div>
          <button
            onClick={() => setJustVerified(false)}
            className="text-xs bg-emerald-700/80 hover:bg-emerald-800 px-3 py-1 rounded-md"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Notice */}
          <div className="flex items-start md:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-2">
                <span>Action Required: Please Verify Your Email Address</span>
                <span className="text-[10px] font-mono bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Unverified
                </span>
              </p>
              <p className="text-xs text-amber-100 mt-0.5">
                A verification email was sent to <strong className="text-white underline">{user.email}</strong>.
                Verify to ensure account recovery and unlock full capabilities.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-800 hover:bg-amber-50 font-semibold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : "I've Verified (Refresh)"}</span>
            </button>

            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700/60 hover:bg-amber-700 text-white font-medium text-xs rounded-lg border border-white/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              {cooldown > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resend in {cooldown}s</span>
                </>
              ) : (
                <>
                  <Send className={`w-3.5 h-3.5 ${resending ? 'animate-pulse' : ''}`} />
                  <span>{resending ? 'Sending...' : 'Resend Link'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Status Feedback */}
        {message && (
          <div className="mt-2 text-xs pt-2 border-t border-white/20 flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
