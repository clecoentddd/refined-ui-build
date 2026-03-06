import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import TeamPanel from '@/components/TeamPanel';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

export default function OrganizationDashboardPage() {
  const { organization, teams, setTeams } = useAppState();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', purpose: '', context: '', level: '1' });

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const r = await useAdminApi.getTeamListByOrg(organization.orgId!, organization.userId!);
      setTeams(r.teams || []);
    } catch { setTeams([]); }
  };

  const createTeam = async () => {
    if (!newTeam.name.trim()) return toast.error('Name required');
    const payload = {
      organizationId: organization.orgId,
      adminAccountId: organization.adminId,
      organizationName: organization.orgName,
      name: newTeam.name,
      purpose: newTeam.purpose,
      context: newTeam.context,
      level: parseInt(newTeam.level) || 1,
    };
    try {
      await useAdminApi.createTeam(payload, organization.sid!, organization.userId!);
      setTeamModalOpen(false);
      setNewTeam({ name: '', purpose: '', context: '', level: '1' });
      toast.success(`Team "${newTeam.name}" created`);
      setTimeout(loadTeams, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="organization" />
      <div className="flex-1 grid grid-cols-[240px_1fr] min-h-0">
        <aside className="border-r border-border bg-card sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto p-5">
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Organization</div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm font-semibold text-primary cursor-pointer">
            <Users className="w-4 h-4" /> Teams & Radar
          </div>
          <div className="mt-6">
            <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Session</div>
            <div className="px-2 text-[12px] text-muted-foreground leading-relaxed">
              Role: <span className="text-foreground font-medium">{organization.role || '—'}</span><br />
              Org: <span className="text-foreground font-medium">{organization.orgName || '—'}</span>
            </div>
          </div>
        </aside>

        <main className="p-7 overflow-y-auto">
          <PageHeader
            title="Teams & Radar"
            subtitle="Click a team to view and manage its radar elements"
            actions={
              <button onClick={() => setTeamModalOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-5 py-2 font-semibold text-sm hover:opacity-90 transition-all">
                <Plus className="w-4 h-4" /> New Team
              </button>
            }
          />

          {teams.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8 opacity-30" />} message="No teams yet. Create the first one." />
          ) : (
            <div className="space-y-3">
              {teams.map(team => (
                <TeamPanel key={team.teamId} team={team} onRefresh={() => { loadTeams(); }} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="New Team" subtitle="Add a team to your organization">
        <FormField label="Team Name"><FormInput value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} placeholder="Strategy Team" /></FormField>
        <FormField label="Purpose"><FormInput value={newTeam.purpose} onChange={e => setNewTeam(p => ({ ...p, purpose: e.target.value }))} placeholder="Drive strategic initiatives" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Context"><FormInput value={newTeam.context} onChange={e => setNewTeam(p => ({ ...p, context: e.target.value }))} placeholder="Executive" /></FormField>
          <FormField label="Level"><FormInput type="number" value={newTeam.level} onChange={e => setNewTeam(p => ({ ...p, level: e.target.value }))} min={1} max={10} /></FormField>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setTeamModalOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createTeam} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all">Create Team</button>
        </div>
      </Modal>
    </div>
  );
}
