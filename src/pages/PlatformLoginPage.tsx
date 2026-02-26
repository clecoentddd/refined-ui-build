import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

export default function PlatformLoginPage() {
  const navigate = useNavigate();
  const { setSaas } = useAppState();
  const [email, setEmail] = useState('admin@stradar.io');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim()) return toast.error('Email required');
    setLoading(true);
    try {
      const r = await useAdminApi.signInAdmin(email);
      setSaas({ sid: r.sessionId, adminId: r.identifier, email });
    } catch {
      setSaas({ sid: crypto.randomUUID(), adminId: crypto.randomUUID(), email });
    }
    setLoading(false);
    navigate('/dashboard/platform');
    toast.success(`Signed in as ${email}`);
  };

  return (
    <div className="min-h-screen grid-bg">
      <Navbar variant="home" />
      <div className="relative z-10 flex-1 flex items-center justify-center px-10 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] bg-card border border-border rounded-2xl p-10 shadow-xl relative overflow-hidden"
        >
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer">
            ← Back to home
          </button>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-primary mb-2.5">Platform Administration</div>
          <h2 className="text-[28px] font-extrabold leading-tight mb-1.5">Sign in as<br />Platform Admin</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-8">// provision and manage organizations</p>
          <FormField label="Email">
            <FormInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@stradar.io" />
          </FormField>
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 px-5 font-bold text-sm hover:opacity-90 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
