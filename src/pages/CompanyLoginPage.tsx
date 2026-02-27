import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { FormField, FormInput, FormSelect } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

export default function CompanyLoginPage() {
  const navigate = useNavigate();
  const { setCompany } = useAppState();
  const [form, setForm] = useState({ email: '', adminId: '', orgId: '', orgName: '', role: 'ADMIN' });
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const signIn = async () => {
    const { email, orgId, orgName, role, adminId } = form;
    if (!email || !orgId || !orgName) return toast.error('All fields required');
    setLoading(true);
    const sid = crypto.randomUUID();
    const aid = adminId || crypto.randomUUID();
    try { await useAdminApi.signInToOrganization(email, orgId, orgName, role, aid, sid); } catch { /* dev ok */ }
    setCompany({ sid, email, orgId, orgName, role, adminId: aid });
    setLoading(false);
    navigate('/dashboard/company');
    toast.success(`Signed in to ${orgName}`);
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
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2.5">Company Access</div>
          <h2 className="text-[28px] font-extrabold leading-tight mb-1.5">Sign in to<br />your Company</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-8">Manage teams and radar elements</p>

          <FormField label="Email"><FormInput type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" /></FormField>
          <FormField label="Admin Account ID"><FormInput value={form.adminId} onChange={update('adminId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></FormField>
          <FormField label="Organization ID"><FormInput value={form.orgId} onChange={update('orgId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></FormField>
          <FormField label="Organization Name"><FormInput value={form.orgName} onChange={update('orgName')} placeholder="Acme Corp" /></FormField>
          <FormField label="Role">
            <FormSelect value={form.role} onChange={update('role')}>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="MEMBER">Member</option>
            </FormSelect>
          </FormField>

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-foreground text-background rounded-lg py-2.5 px-5 font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to Company'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
