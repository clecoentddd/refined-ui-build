import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAppState } from '@/context/AppContext';
import { useAdminApi, GENESIS_ADMIN_ID } from '@/services/api';

export default function PlatformLoginPage() {
  const navigate = useNavigate();
  const { setSaas } = useAppState();
  const [username, setUsername] = useState('superadmin');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const sid = crypto.randomUUID();
    try {
      console.log(`[STRADAR] Initiating identification for ${username}...`);
      await useAdminApi.signInAdmin(username, sid);

      let resolved = false;
      let retries = 0;
      const maxRetries = 30;

      while (!resolved && retries < maxRetries) {
        try {
          const r = await useAdminApi.getSuperAdminAccount(sid);
          const accounts = Array.isArray(r.data) ? r.data : [r.data];
          const found = accounts.find((a: any) => a.adminAccountId === GENESIS_ADMIN_ID);

          if (found) {
            resolved = true;
            break;
          }
        } catch (e) {
          console.log(`[STRADAR] Polling read model... (${retries})`);
        }
        await new Promise(res => setTimeout(res, 200));
        retries++;
      }

      if (resolved) {
        setSaas({ sid, adminId: GENESIS_ADMIN_ID, email: username });
        navigate('/dashboard/platform');
        toast.success(`Identified as ${username}`);
      } else {
        toast.error('Identity resolution timed out. Please try again.');
      }
    } catch (e) {
      console.error('[STRADAR] Sign in failed', e);
      toast.error('Failed to initiate sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      <Navbar variant="home" />
      <div className="relative z-10 flex-1 flex items-center justify-center px-10 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] bg-card border border-border rounded-xl p-8 shadow-lg"
        >
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">Platform Administration</div>
              <h2 className="text-lg font-bold leading-tight">Identity Verification</h2>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Claim-Based Identity</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Establishing session as Genesis Administrator.<br />
                ID: <span className="text-foreground/70 font-mono text-[11px]">{GENESIS_ADMIN_ID.split('-')[0]}...</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-muted-foreground">Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <button
            onClick={signIn}
            disabled={loading || !username.trim()}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 px-5 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Resolving Identity...</span>
              </>
            ) : (
              'Identify as Admin'
            )}
          </button>

          <p className="mt-5 text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
            Secure Infrastructure Access
          </p>
        </motion.div>
      </div>
    </div>
  );
}
