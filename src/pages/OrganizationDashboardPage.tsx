import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Users, Plus, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import TeamPanel from '@/components/TeamPanel';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import type { Team } from '@/context/AppContext';

interface LevelGroupProps {
  level: number;
  teams: Team[];
  onRefresh: () => void;
  isFirst: boolean;
}

function LevelGroup({ level, teams, onRefresh, isFirst }: LevelGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative">
      {!isFirst && (
        <div className="absolute left-1/2 -top-4 w-px h-4 bg-border" />
      )}

      {/* Level separator */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          Level {level}
        </button>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground tabular-nums">{teams.length} team{teams.length !== 1 ? 's' : ''}</span>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className={`grid gap-3 ${teams.length === 1 ? 'max-w-3xl' : teams.length === 2 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
              {teams.map(team => (
                <TeamPanel key={team.teamId} team={team} onRefresh={onRefresh} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      level: isNaN(parseInt(newTeam.level)) ? 1 : parseInt(newTeam.level),
    };
    try {
      await useAdminApi.createTeam(payload, organization.sid!, organization.userId!);
      setTeamModalOpen(false);
      setNewTeam({ name: '', purpose: '', context: '', level: '1' });
      toast.success(`Team "${newTeam.name}" created`);
      setTimeout(loadTeams, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

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
            subtitle="Teams organized by level"
            actions={
              <button onClick={() => setTeamModalOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-5 py-2 font-semibold text-sm hover:opacity-90 transition-all">
                <Plus className="w-4 h-4" /> New Team
              </button>
            }
          />

          {teams.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8 opacity-30" />} message="No teams yet. Create the first one." />
          ) : (
            <div className="space-y-8 py-2">
              {levelGroups.map((group, idx) => (
                <LevelGroup key={group.level} level={group.level} teams={group.teams} onRefresh={loadTeams} isFirst={idx === 0} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="New Team" subtitle="Add a team to your organization">
        {/* Name - Single Line */}
        <FormField label="Team Name">
          <FormInput
            value={newTeam.name}
            onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))}
            placeholder="Strategy Team"
          />
        </FormField>

        {/* Purpose - Multi Line (TEXT) */}
        <FormField label="Purpose">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={newTeam.purpose}
            onChange={e => setNewTeam(p => ({ ...p, purpose: e.target.value }))}
            placeholder="What is the primary mission of this team?"
          />
        </FormField>

        {/* Context - Multi Line (TEXT) */}
        <FormField label="Context">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={newTeam.context}
            onChange={e => setNewTeam(p => ({ ...p, context: e.target.value }))}
            placeholder="Describe the operational context..."
          />
        </FormField>

        {/* Level - Moved to bottom, spans full width or partial */}
        <div className="pt-2 border-t border-border mt-4">
          <FormField label="Hierarchy Level">
            <FormInput
              type="number"
              value={newTeam.level}
              onChange={e => setNewTeam(p => ({ ...p, level: e.target.value }))}
              min={0}
              max={10}
              className="max-w-[120px]"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Level 0 is top-tier (Executive), higher numbers represent sub-levels.
            </p>
          </FormField>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setTeamModalOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createTeam} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all">Create Team</button>
        </div>
      </Modal>
    </div>
  );
}
