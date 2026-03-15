import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

export default function OrganizationLoginPage() {
  const navigate = useNavigate();
  const { setOrganization } = useAppState();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!usernameOrEmail || !password) {
      return toast.error('Username/email and password are required');
    }

    setLoading(true);
    const sid = crypto.randomUUID();

    try {
      const account = await useAdminApi.signInToOrganization(
        usernameOrEmail,
        password,
        sid
      );

      // 3️⃣ Update context state
      setOrganization({
        sid,
        email: account.email || null,
        orgId: account.organizationId,
        orgName: null,        // not returned by backend
        role: null,           // not returned by backend
        adminId: account.personId,
        username: account.username,
        userId: account.personId,
        teamId: null          // not returned by backend
      });

      navigate('/dashboard/organization');
      toast.success(`Signed in successfully to ${account.organizationId}`);
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
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] bg-card border border-border rounded-xl p-8 shadow-lg"
        >
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                Organization Access
              </div>
              <h2 className="text-lg font-bold leading-tight">Sign in to your Organization</h2>
            </div>
          </div>

          <FormField label="Username or Email">
            <FormInput
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter your username or email"
            />
          </FormField>

          <FormField label="Password">
            <FormInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </FormField>

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 px-5 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In to Organization'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}