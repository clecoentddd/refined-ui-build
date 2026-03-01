import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Pill from '@/components/Pill';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

export default function PlatformDashboardPage() {
  const { saas, orgs, setOrgs } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgUsername, setNewOrgUsername] = useState('');

  useEffect(() => { loadOrgs(); }, []);

  const loadOrgs = async () => {
    try { const r = await useAdminApi.getOrganizationList(); setOrgs(r.data || []); }
    catch { setOrgs([]); }
  };

  const createOrg = async () => {
    if (!newOrgName.trim() || !newOrgUsername.trim()) return toast.error('Name and Username required');

    const organizationId = crypto.randomUUID();
    const personId = crypto.randomUUID();

    try {
      await useAdminApi.defineOrganization({
        organizationId,
        personId,
        username: newOrgUsername.trim(),
        organizationName: newOrgName.trim()
      }, saas.sid!, saas.adminId!);

      setModalOpen(false);
      setNewOrgName(''); setNewOrgUsername('');
      toast.success(`Organization "${newOrgName}" created`);
      setTimeout(loadOrgs, 1200);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="platform" />
      <div className="flex-1 grid grid-cols-[240px_1fr] min-h-0">
        <aside className="border-r border-border bg-card sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto p-5">
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Platform</div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm font-semibold text-primary cursor-pointer">
            <Building2 className="w-4 h-4" /> Organizations
          </div>
        </aside>

        <main className="p-7 overflow-y-auto">
          <PageHeader
            title="Organizations"
            subtitle="All organizations on the platform"
            actions={
              <button onClick={() => setModalOpen(true)} className="bg-primary text-primary-foreground rounded-lg px-5 py-2 font-semibold text-sm hover:opacity-90 transition-all">
                + New Organization
              </button>
            }
          />

          <div className="grid grid-cols-3 gap-3 mb-7">
            <StatCard value={orgs.length} label="Total Organizations" />
            <StatCard value="Active" label="Platform Status" />
            <StatCard value={new Date().toLocaleTimeString()} label="Last Refresh" />
          </div>

          {orgs.length === 0 ? (
            <EmptyState icon={<Building2 className="w-8 h-8 opacity-30" />} message="No organizations yet. Create the first one." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {orgs.map((o) => (
                <div key={o.organizationId} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[15px]">{o.organizationName || 'Unnamed'}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">ID: <span className="font-mono">{o.organizationId || '—'}</span></div>
                      <div className="text-[11px] text-muted-foreground">Admin: <span className="font-mono">{o.adminAccountId || '—'}</span></div>
                    </div>
                    <Pill variant="success">ACTIVE</Pill>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Organization" subtitle="Provision a new company on the platform">
        <FormField label="Organization Name"><FormInput value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Acme Corp" /></FormField>
        <FormField label="Admin Username"><FormInput value={newOrgUsername} onChange={e => setNewOrgUsername(e.target.value)} placeholder="admin@acme.com" /></FormField>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setModalOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createOrg} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all">Create Organization</button>
        </div>
      </Modal>
    </div>
  );
}
