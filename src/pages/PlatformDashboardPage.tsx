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
  const [newOrgAdmin, setNewOrgAdmin] = useState('');

  useEffect(() => { loadOrgs(); }, []);

  const loadOrgs = async () => {
    try { const r = await useAdminApi.getOrganizationList(); setOrgs(r.data || []); }
    catch { setOrgs([]); }
  };

  const createOrg = async () => {
    if (!newOrgName.trim()) return toast.error('Name required');
    const adminId = newOrgAdmin.trim() || crypto.randomUUID();
    try {
      await useAdminApi.defineOrganization(newOrgName, adminId, saas.sid!);
      setModalOpen(false);
      setNewOrgName(''); setNewOrgAdmin('');
      toast.success(`Organization "${newOrgName}" created`);
      setTimeout(loadOrgs, 1200);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="platform" />
      <div className="flex-1 grid grid-cols-[220px_1fr] min-h-0">
        <aside className="border-r border-border bg-card sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto p-5">
          <div className="font-mono text-[9px] text-muted-foreground/50 tracking-[2px] uppercase px-2 mb-2">Platform</div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-foreground/5 border border-foreground/10 text-sm font-semibold cursor-pointer">
            <Building2 className="w-4 h-4" /> Organizations
          </div>
        </aside>

        <main className="p-7 overflow-y-auto">
          <PageHeader
            title="Organizations"
            subtitle="All companies on the platform"
            actions={
              <button onClick={() => setModalOpen(true)} className="bg-foreground text-background rounded-lg px-5 py-2.5 font-bold text-sm hover:opacity-90 transition-all">
                + New Organization
              </button>
            }
          />

          <div className="grid grid-cols-3 gap-3.5 mb-7">
            <StatCard value={orgs.length} label="Organizations" />
            <StatCard value="—" label="Platform Status" />
            <StatCard value={new Date().toLocaleTimeString()} label="Last Refresh" />
          </div>

          {orgs.length === 0 ? (
            <EmptyState icon={<Building2 className="w-8 h-8 opacity-30" />} message="No organizations yet. Create the first one." />
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {orgs.map((o) => (
                <div key={o.organizationId} className="bg-card border border-border rounded-xl p-5 hover:border-foreground/15 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-[15px]">{o.organizationName || 'Unnamed'}</div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-1">ID: {o.organizationId || '—'}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">Admin: {o.adminAccountId || '—'}</div>
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
        <FormField label="Admin Account ID" optional><FormInput value={newOrgAdmin} onChange={e => setNewOrgAdmin(e.target.value)} placeholder="auto-generated" /></FormField>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setModalOpen(false)} className="flex-1 border border-border bg-card text-muted-foreground rounded-lg py-2.5 font-bold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createOrg} className="flex-1 bg-foreground text-background rounded-lg py-2.5 font-bold text-sm hover:opacity-90 transition-all">Create Organization</button>
        </div>
      </Modal>
    </div>
  );
}
