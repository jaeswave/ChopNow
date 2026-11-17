import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../ui';

// Resend the "verify your email" link. Same call and messages as the banner at the top of the site.
export default function useResendVerification() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const resend = async () => {
    setBusy(true);
    try {
      await api('/auth/resend-verification', { method: 'POST' });
      toast('Verification email sent. Check your inbox and spam folder.');
    } catch (e) {
      toast(e.message, 'err');
    }
    setBusy(false);
  };
  return { resend, busy };
}
