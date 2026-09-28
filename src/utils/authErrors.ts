/**
 * Authentication error message parser and password security helper.
 */

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 6) score++;
  if (hasMinLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber && hasSpecial) score++;

  if (score > 4) score = 4;

  const scoreMap: Record<number, { label: PasswordStrength['label']; color: string }> = {
    0: { label: 'Very Weak', color: 'bg-rose-500' },
    1: { label: 'Weak', color: 'bg-orange-500' },
    2: { label: 'Fair', color: 'bg-amber-500' },
    3: { label: 'Good', color: 'bg-blue-500' },
    4: { label: 'Strong', color: 'bg-emerald-500' },
  };

  return {
    score,
    label: scoreMap[score].label,
    color: scoreMap[score].color,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

export function getFriendlyAuthErrorMessage(error: any): { title: string; message: string; actionHint?: string } {
  const code = error?.code || '';
  const rawMessage = error?.message || '';

  switch (code) {
    case 'auth/invalid-credential':
      return {
        title: 'Invalid Credentials',
        message: 'The email or password you entered does not match our records.',
        actionHint: 'Double-check your email and password, or use "Forgot Password" to reset it.',
      };
    case 'auth/email-already-in-use':
      return {
        title: 'Email Already Registered',
        message: 'An account is already associated with this email address.',
        actionHint: 'Try logging in instead, or reset your password if you forgot it.',
      };
    case 'auth/wrong-password':
      return {
        title: 'Incorrect Password',
        message: 'The password you entered is incorrect.',
        actionHint: 'Click "Forgot Password?" below to receive a secure password reset link.',
      };
    case 'auth/user-not-found':
      return {
        title: 'Account Not Found',
        message: 'No registered user found with this email address.',
        actionHint: 'Please check for typos or register a new account.',
      };
    case 'auth/weak-password':
      return {
        title: 'Weak Password',
        message: 'Firebase requires passwords to be at least 6 characters.',
        actionHint: 'Use 8 or more characters with uppercase, lowercase, numbers, and symbols.',
      };
    case 'auth/invalid-email':
      return {
        title: 'Invalid Email Format',
        message: 'The email address entered is not valid.',
        actionHint: 'Ensure your email follows the format name@example.com.',
      };
    case 'auth/too-many-requests':
      return {
        title: 'Too Many Attempts',
        message: 'Access to this account has been temporarily disabled due to many failed login attempts.',
        actionHint: 'Please wait a few minutes, or reset your password immediately.',
      };
    case 'auth/user-disabled':
      return {
        title: 'Account Disabled',
        message: 'This user account has been disabled by an administrator.',
        actionHint: 'Please contact support if you believe this is in error.',
      };
    case 'auth/operation-not-allowed':
      return {
        title: 'Provider Not Enabled in Firebase',
        message: 'Email/Password sign-in is not yet enabled in your Firebase Console.',
        actionHint: 'Go to Firebase Console > Authentication > Sign-in method, click "Email/Password" and toggle it to Enabled.',
      };
    case 'auth/popup-closed-by-user':
      return {
        title: 'Sign-in Cancelled',
        message: 'The Google authentication popup was closed before completing.',
        actionHint: 'Click the button again and keep the popup open until sign-in completes.',
      };
    case 'auth/popup-blocked':
      return {
        title: 'Popup Blocked',
        message: 'Your browser blocked the sign-in popup window.',
        actionHint: 'Allow popups for this site in your browser URL bar settings.',
      };
    case 'auth/requires-recent-login':
      return {
        title: 'Re-authentication Required',
        message: 'This action is sensitive and requires a fresh login session.',
        actionHint: 'Please sign out and sign back in, then retry.',
      };
    case 'auth/network-request-failed':
      return {
        title: 'Network Error',
        message: 'Unable to reach Firebase authentication servers.',
        actionHint: 'Check your internet connection and verify that third-party cookies/domains are not blocked.',
      };
    default:
      return {
        title: 'Authentication Error',
        message: rawMessage || 'An unexpected error occurred during authentication.',
        actionHint: code ? `Error code: ${code}` : undefined,
      };
  }
}
