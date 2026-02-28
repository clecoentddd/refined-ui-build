import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

export default function OrganizationLoginPage() {
  const navigate = useNavigate();
  const { setOrganization } = useAppState();
  const [personId, setPersonId] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!personId) return toast.error('Person ID required');
    setLoading(true);
    const sid = crypto.randomUUID();
    try {
      await useAdminApi.signInToOrganization(personId, sid);
      const account = await useAdminApi.getPersonAccount(personId);
      setOrganization({
        sid,
        email: account.email || null,
        orgId: account.organizationId,
        orgName: account.organizationName,
        role: account.role,
        adminId: account.personId,
        username: account.username,
        teamId: account.teamId
      });
      navigate('/dashboard/organization');
      toast.success(`Signed in to ${account.organizationName}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
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
            <ArrowLeft className="w-3 h-3" /> Back to home
          </button>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2.5">Organization Access</div>
          <h2 className="text-[28px] font-extrabold leading-tight mb-1.5">Sign in to<br />your Organization</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-8">Manage teams and radar elements</p>

          <FormField label="Person ID">
            <FormInput
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </FormField>

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-foreground text-background rounded-lg py-2.5 px-5 font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In to Organization'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
