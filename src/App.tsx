import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { UserDashboard } from './components/UserDashboard';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import {
  ShieldCheck,
  MailCheck,
  Lock,
  Users,
  CheckCircle,
  ExternalLink,
  Flame,
  ArrowRight,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState(false);
  const [prefillForgotEmail, setPrefillForgotEmail] = useState('');

  // Validate connection to Firestore on initial boot as required by Firebase skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    }
    testConnection();
  }, []);

  const handleOpenForgotPassword = (email?: string) => {
    setPrefillForgotEmail(email || '');
    setIsForgotPasswordOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Connecting to Firebase Auth...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Navbar */}
      <Navbar
        onOpenSetupGuide={() => setIsFirebaseSetupOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Email Verification Persistent Banner when logged in */}
      {user && <EmailVerificationBanner />}

      {/* Main Content Body */}
      <main className="flex-1">
        {user ? (
          /* Authenticated User View */
          <UserDashboard onOpenFirebaseGuide={() => setIsFirebaseSetupOpen(true)} />
        ) : (
          /* Unauthenticated Guest Landing & Forms */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Value Prop & Security Highlights */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>Powered by Firebase Auth & Cloud Firestore</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Secure Authentication & <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600">
                    Email Verification
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                  Enterprise-grade user registration and authentication flow. Automatically verifies email
                  addresses with one-time action links, enforces password entropy, and provides a real-time
                  user management console.
                </p>

                {/* Key feature pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MailCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Email Verification</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automatic verification link dispatch with spam detection tips and cooldown protection.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Password Entropy Guard</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Interactive password strength meter requiring 8+ chars, numbers, cases, and symbols.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">User Management</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Profile editing, password changes, token metadata, and audit log tracking.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Zero-Trust Security</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Strict Firestore ABAC security rules with verified email enforcement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Helpful Firebase Console prompt */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Target Firebase Project: <strong>ai-student-task-manager-e0a14</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsFirebaseSetupOpen(true)}
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Checklist</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Right Column: Active Form (Register or Login) */}
              <div className="lg:col-span-5">
                {activeTab === 'register' ? (
                  <RegisterForm
                    onSwitchToLogin={() => setActiveTab('login')}
                    onOpenFirebaseGuide={() => setIsFirebaseSetupOpen(true)}
                  />
                ) : (
                  <LoginForm
                    onSwitchToRegister={() => setActiveTab('register')}
                    onOpenForgotPassword={handleOpenForgotPassword}
                    onOpenFirebaseGuide={() => setIsFirebaseSetupOpen(true)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Secure Firebase Authentication & Identity Management System</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFirebaseSetupOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              Firebase Configuration Details
            </button>
            <span>•</span>
            <span>Project: ai-student-task-manager-e0a14</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={prefillForgotEmail}
      />

      <FirebaseSetupModal
        isOpen={isFirebaseSetupOpen}
        onClose={() => setIsFirebaseSetupOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
