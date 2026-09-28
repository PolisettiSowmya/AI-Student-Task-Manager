import React, { useState } from 'react';
import {
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Mail,
  KeyRound,
  Edit3,
  Calendar,
  Clock,
  Fingerprint,
  RefreshCw,
  Send,
  Database,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Trash2,
  Lock,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';

interface UserDashboardProps {
  onOpenFirebaseGuide: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onOpenFirebaseGuide }) => {
  const {
    user,
    profile,
    isEmailVerified,
    activities,
    clearActivities,
    refreshUser,
    sendVerificationEmail,
    sendPasswordReset,
    updateDisplayName,
    logActivity,
  } = useAuth();

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || user?.displayName || '');
  const [updatingName, setUpdatingName] = useState(false);

  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Feedback notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  // Firestore sync test state
  const [testingDb, setTestingDb] = useState(false);
  const [dbResult, setDbResult] = useState<string | null>(null);

  // Verification cooldown
  const [verCooldown, setVerCooldown] = useState(0);
  const [resendingVer, setResendingVer] = useState(false);
  const [refreshingAuth, setRefreshingAuth] = useState(false);

  React.useEffect(() => {
    let t: NodeJS.Timeout;
    if (verCooldown > 0) {
      t = setTimeout(() => setVerCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [verCooldown]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setUpdatingName(true);
    const res = await updateDisplayName(newName.trim());
    setUpdatingName(false);
    if (res.success) {
      setIsEditingName(false);
      showToast('Profile name updated successfully.');
    } else {
      const friendly = getFriendlyAuthErrorMessage(res.error);
      showToast(`${friendly.title}: ${friendly.message}`, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (!auth.currentUser) return;

    setPasswordLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      logActivity('PROFILE_UPDATE', 'Password Updated', 'Account password was changed successfully');
      showToast('Password changed successfully!');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err);
      showToast(`${friendly.title}: ${friendly.message}`, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    const res = await sendPasswordReset(user.email);
    if (res.success) {
      showToast(`Password reset link sent to ${user.email}`);
    } else {
      const friendly = getFriendlyAuthErrorMessage(res.error);
      showToast(`${friendly.title}: ${friendly.message}`, 'error');
    }
  };

  const handleManualVerificationSend = async () => {
    if (verCooldown > 0 || resendingVer) return;
    setResendingVer(true);
    const res = await sendVerificationEmail();
    setResendingVer(false);
    if (res.success) {
      setVerCooldown(60);
      showToast(`Verification email resent to ${user?.email}`);
    } else {
      const friendly = getFriendlyAuthErrorMessage(res.error);
      showToast(`${friendly.title}: ${friendly.message}`, 'error');
    }
  };

  const handleManualRefresh = async () => {
    setRefreshingAuth(true);
    try {
      await refreshUser();
      showToast(
        user?.emailVerified
          ? 'Email is verified!'
          : 'Refreshed! Email is still unverified. Please check your email.',
        user?.emailVerified ? 'success' : 'info'
      );
    } catch {
      showToast('Failed to reload user from Firebase.', 'error');
    } finally {
      setRefreshingAuth(false);
    }
  };

  const handleTestFirestore = async () => {
    if (!user) return;
    setTestingDb(true);
    setDbResult(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Write profile update
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName || 'User',
          email: user.email || '',
          emailVerified: user.emailVerified,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Read back
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setDbResult(`Verified! Document exists with keys: ${Object.keys(snap.data()).join(', ')}`);
        showToast('Firestore user document synced successfully!');
      } else {
        setDbResult('Document written but could not be read.');
      }
    } catch (err: any) {
      console.error(err);
      setDbResult(`Firestore Notice: ${err.message || 'Check firestore permissions/rules'}`);
      showToast('Firestore test finished with note.', 'info');
    } finally {
      setTestingDb(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast alert */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between shadow-lg transition-all animate-in slide-in-from-top duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs uppercase font-bold tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg shadow-indigo-500/20 shrink-0">
              {profile?.displayName ? profile.displayName[0] : (user?.email ? user.email[0] : 'U')}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {profile?.displayName || user?.displayName || 'Secure User'}
                </h1>

                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                  title="Edit Display Name"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Email Verification Status Pill */}
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Email Not Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-slate-700 font-medium">{user?.email}</strong>
                </span>

                <span className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  <Fingerprint className="w-3 h-3 text-slate-400" />
                  <span>UID: {user?.uid.substring(0, 12)}...</span>
                  <button
                    onClick={copyUid}
                    title="Copy full UID"
                    className="hover:text-slate-900 ml-1"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Verification Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {!isEmailVerified && (
              <button
                onClick={handleManualVerificationSend}
                disabled={verCooldown > 0 || resendingVer}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${resendingVer ? 'animate-pulse' : ''}`} />
                <span>
                  {verCooldown > 0
                    ? `Cooldown (${verCooldown}s)`
                    : resendingVer
                    ? 'Sending...'
                    : 'Resend Verification'}
                </span>
              </button>
            )}

            <button
              onClick={handleManualRefresh}
              disabled={refreshingAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh auth token and verification flag from Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingAuth ? 'animate-spin' : ''}`} />
              <span>{refreshingAuth ? 'Reloading...' : 'Reload Status'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Security & Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Security Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Email Verification Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isEmailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Email Verification Protocol</h2>
                  <p className="text-xs text-slate-500">Firebase Auth identity proof status</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isEmailVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isEmailVerified ? 'Protocol Satisfied' : 'Pending Verification'}
              </span>
            </div>

            <div className="pt-4 text-xs text-slate-600 space-y-3">
              <p>
                Firebase Authentication uses a cryptographically signed one-time link delivered directly
                to your registered inbox to verify domain ownership and prevent identity hijacking.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Status on Token:</span>
                  <span className={`font-mono text-xs ${isEmailVerified ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}`}>
                    email_verified: {String(user?.emailVerified)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Target Address:</span>
                  <span className="text-slate-800 truncate block">{user?.email}</span>
                </div>
              </div>

              {!isEmailVerified && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Did not receive the verification email?</span>
                    <span className="text-[11px] text-amber-800">
                      Check your <strong>Spam / Bulk</strong> folder, or click "Resend Verification" above.
                      Once clicked in your email, press "Reload Status" to instantly synchronize.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Security & Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Security Credentials & Metadata</h2>
                <p className="text-xs text-slate-500">Firebase Auth session tokens & providers</p>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span className="font-medium">Auth Providers</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {user?.providerData.map((p) => (
                    <span
                      key={p.providerId}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-semibold text-slate-700 shadow-xs"
                    >
                      {p.providerId === 'password' ? 'Email / Password' : p.providerId}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">Created On</span>
                </div>
                <p className="font-semibold text-slate-800">
                  {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">Last Sign-In</span>
                </div>
                <p className="font-semibold text-slate-800">
                  {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Database className="w-3.5 h-3.5" />
                  <span className="font-medium">Firestore Profile Sync</span>
                </div>
                <button
                  onClick={handleTestFirestore}
                  disabled={testingDb}
                  className="mt-1 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingDb ? 'animate-spin' : ''}`} />
                  <span>{testingDb ? 'Syncing...' : 'Test Sync /users/{uid}'}</span>
                </button>
              </div>
            </div>

            {dbResult && (
              <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-mono text-indigo-900">
                {dbResult}
              </div>
            )}

            {/* Quick Actions Row */}
            <div className="pt-5 mt-5 border-t border-slate-100 flex flex-wrap gap-2.5">
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>

              <button
                onClick={handleSendResetEmail}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Password Reset Email</span>
              </button>

              <button
                onClick={onOpenFirebaseGuide}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Firebase Console Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security Audit Log</h3>
                <p className="text-[11px] text-slate-400">Recent auth event trail</p>
              </div>
            </div>

            {activities.length > 0 && (
              <button
                onClick={clearActivities}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                title="Clear activity log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-3 pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <span>No audit events recorded yet.</span>
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-1 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {act.details && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{act.details}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Update Display Name</h3>
            <p className="text-xs text-slate-500 mb-4">
              This name will be attached to your Firebase Auth identity.
            </p>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingName}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {updatingName && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Change Account Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter a new secure password (minimum 8 characters).
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
