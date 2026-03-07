import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Users, Plus, Crown, Briefcase, Building2, Network, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import TeamPanel from '@/components/TeamPanel';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import type { Team } from '@/context/AppContext';

const LEVEL_META: Record<number, { label: string; icon: React.ReactNode; accent: string }> = {
  0: { label: 'Board of Directors', icon: <Crown className="w-4 h-4" />, accent: 'from-warning/20 to-warning/5 border-warning/20 text-warning' },
  1: { label: 'CEO', icon: <Briefcase className="w-4 h-4" />, accent: 'from-primary/20 to-primary/5 border-primary/20 text-primary' },
  2: { label: 'CxO / VP', icon: <Building2 className="w-4 h-4" />, accent: 'from-success/20 to-success/5 border-success/20 text-success' },
  3: { label: 'Directors', icon: <Network className="w-4 h-4" />, accent: 'from-destructive/15 to-destructive/5 border-destructive/15 text-destructive' },
};

function getLevelMeta(level: number) {
  if (LEVEL_META[level]) return LEVEL_META[level];
  return { label: `Level ${level}`, icon: <Users className="w-4 h-4" />, accent: 'from-muted to-muted/50 border-border text-muted-foreground' };
}

interface LevelGroupProps {
  level: number;
  teams: Team[];
  onRefresh: () => void;
  isFirst: boolean;
}

function LevelGroup({ level, teams, onRefresh, isFirst }: LevelGroupProps) {
  const meta = getLevelMeta(level);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isFirst && (
        <div className="absolute left-1/2 -top-8 w-px h-8 bg-border" />
      )}

      {/* Level header pill */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-gradient-to-r font-semibold text-xs tracking-wide uppercase transition-all hover:shadow-md ${meta.accent}`}
        >
          {meta.icon}
          {meta.label}
          <span className="ml-1 bg-background/60 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums">
            {teams.length}
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>

      {/* Teams grid — adapts to count */}
      {!collapsed && (
        <div className={`grid gap-3 ${teams.length === 1 ? 'max-w-2xl mx-auto' : teams.length === 2 ? 'grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {teams.map(team => (
            <TeamPanel key={team.teamId} team={team} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // Group teams by level, sorted ascending
  const levelGroups = useMemo(() => {
    const grouped: Record<number, Team[]> = {};
    teams.forEach(t => {
      const lvl = t.level ?? 1;
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(t);
    });
    return Object.entries(grouped)
      .map(([lvl, t]) => ({ level: Number(lvl), teams: t }))
      .sort((a, b) => a.level - b.level);
  }, [teams]);

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
            title="Organization Hierarchy"
            subtitle="Teams organized by leadership level — from board to operational"
            actions={
              <button onClick={() => setTeamModalOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-5 py-2 font-semibold text-sm hover:opacity-90 transition-all">
                <Plus className="w-4 h-4" /> New Team
              </button>
            }
          />

          {teams.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8 opacity-30" />} message="No teams yet. Create the first one." />
          ) : (
            <div className="space-y-8 py-4">
              {levelGroups.map((group, idx) => (
                <LevelGroup
                  key={group.level}
                  level={group.level}
                  teams={group.teams}
                  onRefresh={loadTeams}
                  isFirst={idx === 0}
                />
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
          <FormField label="Level"><FormInput type="number" value={newTeam.level} onChange={e => setNewTeam(p => ({ ...p, level: e.target.value }))} min={0} max={10} /></FormField>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setTeamModalOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createTeam} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all">Create Team</button>
        </div>
      </Modal>
    </div>
  );
}
