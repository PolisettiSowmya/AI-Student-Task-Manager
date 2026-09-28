import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Loader2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { evaluatePasswordStrength, getFriendlyAuthErrorMessage } from '../utils/authErrors';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onOpenFirebaseGuide: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onOpenFirebaseGuide,
}) => {
  const { logActivity } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ title: string; message: string; actionHint?: string } | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<{ email: string; name: string } | null>(null);

  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    // Frontend validations
    if (!displayName.trim()) {
      setErrorDetails({
        title: 'Full Name Required',
        message: 'Please provide your full name or nickname for the profile.',
      });
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorDetails({
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    if (password.length < 8) {
      setErrorDetails({
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters long for security.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorDetails({
        title: 'Passwords Do Not Match',
        message: 'Please verify that both password fields are identical.',
      });
      return;
    }

    if (!agreeTerms) {
      setErrorDetails({
        title: 'Agreement Required',
        message: 'Please agree to the security and privacy terms.',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create User in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Update Display Name in Firebase Auth Profile
      if (displayName.trim()) {
        await updateProfile(user, {
          displayName: displayName.trim(),
        });
      }

      // 3. Immediately dispatch email verification link
      let verificationSent = false;
      try {
        await sendEmailVerification(user);
        verificationSent = true;
        logActivity(
          'VERIFICATION_SENT',
          'Verification Link Sent',
          `Sent verification email to ${user.email}`
        );
      } catch (verErr: any) {
        console.warn('Verification dispatch notice:', verErr);
      }

      logActivity(
        'REGISTER',
        'Account Registered',
        `New account registered for ${user.email} (Email Verification: ${verificationSent ? 'Sent' : 'Pending'})`
      );

      setRegisteredSuccess({
        email: user.email || email,
        name: displayName.trim(),
      });
    } catch (err: any) {
      console.error('Registration failed:', err);
      const friendly = getFriendlyAuthErrorMessage(err);
      setErrorDetails(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorDetails(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      logActivity(
        'REGISTER',
        'Signed Up with Google',
        `Google authenticated as ${result.user.email} (Verified: ${result.user.emailVerified})`
      );
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      const friendly = getFriendlyAuthErrorMessage(err);
      setErrorDetails(friendly);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Success Confirmation Card after Registration
  if (registeredSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Mail className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
          Registration Successful
        </span>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email Address</h2>
        <p className="text-slate-600 text-sm mt-2">
          We sent a verification link to{' '}
          <span className="font-semibold text-slate-900">{registeredSuccess.email}</span>.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-5 text-left text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Check your inbox for a message from Firebase Auth</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Click the verification link to activate all account features</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Check your <strong>Spam / Junk</strong> folder if not received within 1 minute</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          You are currently logged in with basic privileges. You can view your dashboard now or resend the link at any time.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Secure Account</h2>
        <p className="text-sm text-slate-500 mt-1">
          Sign up with email verification and military-grade password hashing
        </p>
      </div>

      {/* Error Alert */}
      {errorDetails && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorDetails.title}</span>
          </div>
          <p className="pl-6">{errorDetails.message}</p>
          {errorDetails.actionHint && (
            <p className="pl-6 text-rose-700 font-medium pt-1 border-t border-rose-200/60 mt-1">
              💡 {errorDetails.actionHint}
            </p>
          )}
          {errorDetails.title.includes('Not Enabled') && (
            <div className="pl-6 pt-1">
              <button
                type="button"
                onClick={onOpenFirebaseGuide}
                className="inline-flex items-center gap-1 text-indigo-700 font-semibold underline hover:text-indigo-800"
              >
                <span>View Firebase Console Activation Steps</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Google Provider Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all shadow-xs hover:border-slate-300 disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>Sign up with Google</span>
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 font-medium">Or register with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Verification link will be emailed to this address.
          </p>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            {password && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                strength.score >= 3 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
              }`}>
                Strength: {strength.label}
              </span>
            )}
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      step <= strength.score - 1 ? strength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1">
                <span className={`flex items-center gap-1 ${strength.hasMinLength ? 'text-emerald-600 font-medium' : ''}`}>
                  {strength.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                  8+ characters
                </span>
                <span className={`flex items-center gap-1 ${strength.hasUpper && strength.hasLower ? 'text-emerald-600 font-medium' : ''}`}>
                  {strength.hasUpper && strength.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                  Upper & lowercase
                </span>
                <span className={`flex items-center gap-1 ${strength.hasNumber ? 'text-emerald-600 font-medium' : ''}`}>
                  {strength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                  At least 1 number
                </span>
                <span className={`flex items-center gap-1 ${strength.hasSpecial ? 'text-emerald-600 font-medium' : ''}`}>
                  {strength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                  Special symbol (!@#$)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={`w-full pl-9 pr-10 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-all ${
                confirmPassword && !passwordsMatch
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
              <X className="w-3 h-3" /> Passwords do not match
            </p>
          )}
        </div>

        {/* Terms Agreement */}
        <label className="flex items-start gap-2 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-500 leading-normal">
            I agree to the secure identity policies and consent to receiving email verification links.
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !passwordsMatch || !agreeTerms}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Secure Account...</span>
            </>
          ) : (
            <>
              <span>Register & Send Verification</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
};
