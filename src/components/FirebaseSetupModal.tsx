import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Flame,
  Copy,
  Check,
  Server,
  Key,
  Globe,
  MailCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { defaultFirebaseConfig, db } from '../firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestingPing(true);
    setPingStatus(null);
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      setPingStatus({
        success: true,
        message: 'Successfully reached Firebase Cloud Firestore & Auth servers!',
      });
    } catch (err: any) {
      if (err instanceof Error && err.message.includes('the client is offline')) {
        setPingStatus({
          success: false,
          message: 'Client is offline. Please check your network and Firebase config.',
        });
      } else {
        // Even if permission is denied on /test/connection, it proves the server responded!
        setPingStatus({
          success: true,
          message: `Connected to Firebase project "${defaultFirebaseConfig.projectId}"! (Server responded: ${err?.code || 'OK'})`,
        });
      }
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Firebase Configuration & Checklist</h3>
            <p className="text-xs text-slate-500">Connected to your project: {defaultFirebaseConfig.projectId}</p>
          </div>
        </div>

        {/* Connection Status Tester */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Connection Health Check</span>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testingPing}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-400 text-indigo-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${testingPing ? 'animate-spin' : ''}`} />
              <span>{testingPing ? 'Pinging...' : 'Test Connection'}</span>
            </button>
          </div>

          {pingStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                pingStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {pingStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{pingStatus.message}</span>
            </div>
          )}
        </div>

        {/* Console Checklist */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Firebase Console Activation Checklist
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 font-semibold block">1. Enable Email/Password Provider</strong>
                    <p className="text-slate-500 mt-0.5">
                      In the Firebase Console, go to <em>Authentication &gt; Sign-in method</em>, click on
                      <strong> Email/Password</strong>, and toggle it to <strong>Enabled</strong>.
                    </p>
                  </div>
                </div>
                <a
                  href={`https://console.firebase.google.com/project/${defaultFirebaseConfig.projectId}/authentication/providers`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 p-1"
                  title="Open Providers in Firebase Console"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MailCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 font-semibold block">2. Customize Email Verification Templates</strong>
                    <p className="text-slate-500 mt-0.5">
                      Under <em>Authentication &gt; Templates</em>, customize the subject, sender name, and action URL for verification and password reset emails.
                    </p>
                  </div>
                </div>
                <a
                  href={`https://console.firebase.google.com/project/${defaultFirebaseConfig.projectId}/authentication/emails`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 p-1"
                  title="Open Email Templates"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 font-semibold block">3. Authorized Domains</strong>
                    <p className="text-slate-500 mt-0.5">
                      Verify under <em>Authentication &gt; Settings &gt; Authorized domains</em> that <code>localhost</code> and your hosting domain are allowed.
                    </p>
                  </div>
                </div>
                <a
                  href={`https://console.firebase.google.com/project/${defaultFirebaseConfig.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 p-1"
                  title="Open Auth Settings"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Summary */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Loaded Project Parameters
          </h4>
          <div className="bg-slate-900 rounded-xl p-3 text-slate-300 font-mono text-[11px] space-y-1">
            <div className="flex justify-between items-center">
              <span>projectId: "{defaultFirebaseConfig.projectId}"</span>
              <button
                onClick={() => copyToClipboard(defaultFirebaseConfig.projectId, 'projectId')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'projectId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span>authDomain: "{defaultFirebaseConfig.authDomain}"</span>
              <button
                onClick={() => copyToClipboard(defaultFirebaseConfig.authDomain, 'authDomain')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'authDomain' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>appId: "{defaultFirebaseConfig.appId.substring(0, 16)}..."</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
