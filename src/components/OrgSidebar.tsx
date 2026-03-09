import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Radar, TrendingUp, ChevronDown, Building2 } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import type { Team } from '@/context/AppContext';

interface OrgSidebarProps {
  activeTeamId?: string;
  activePage?: 'radar' | 'strategy';
}

export default function OrgSidebar({ activeTeamId, activePage }: OrgSidebarProps) {
  const navigate = useNavigate();
  const { organization, teams, setTeams } = useAppState();
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (teams.length === 0 && organization.orgId) {
      useAdminApi.getTeamListByOrg(organization.orgId, organization.userId!)
        .then(r => setTeams(r.teams || []))
        .catch(() => {});
    }
  }, [organization.orgId]);

  // Auto-expand the level containing the active team
  useEffect(() => {
    if (activeTeamId && teams.length > 0) {
      const team = teams.find(t => t.teamId === activeTeamId);
      if (team) {
        setExpandedLevels(prev => new Set(prev).add(team.level ?? 1));
      }
    }
  }, [activeTeamId, teams]);

  const grouped = teams.reduce<Record<number, Team[]>>((acc, t) => {
    const lvl = t.level ?? 1;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(t);
    return acc;
  }, {});

  const levels = Object.entries(grouped)
    .map(([lvl, t]) => ({ level: Number(lvl), teams: t }))
    .sort((a, b) => a.level - b.level);

  const toggleLevel = (lvl: number) => {
    setExpandedLevels(prev => {
      const s = new Set(prev);
      s.has(lvl) ? s.delete(lvl) : s.add(lvl);
      return s;
    });
  };

  const goTo = (page: 'radar' | 'strategy', team: Team) => {
    const params = `teamId=${team.teamId}&organizationId=${team.organizationId}&teamName=${encodeURIComponent(team.name)}`;
    navigate(`/dashboard/${page}?${params}`);
  };

  return (
    <aside className="border-r border-border bg-card w-[220px] shrink-0 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto flex flex-col">
      {/* Back to org */}
      <button
        onClick={() => navigate('/dashboard/organization')}
        className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border-b border-border"
      >
        <Building2 className="w-3.5 h-3.5" />
        {organization.orgName || 'Organization'}
      </button>

      <div className="flex-1 py-2 px-2 space-y-1">
        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Teams</div>

        {levels.map(({ level, teams: levelTeams }) => {
          const isOpen = expandedLevels.has(level);
          return (
            <div key={level}>
              <button
                onClick={() => toggleLevel(level)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/30"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                <Users className="w-3 h-3" />
                Level {level}
                <span className="ml-auto text-[10px] opacity-60">{levelTeams.length}</span>
              </button>

              {isOpen && (
                <div className="ml-3 mt-0.5 space-y-px border-l border-border/50 pl-2">
                  {levelTeams.map(team => {
                    const isActive = team.teamId === activeTeamId;
                    return (
                      <div key={team.teamId} className="space-y-px">
                        <div className={`text-[11px] font-medium px-2 py-1 rounded-md truncate ${isActive ? 'text-primary bg-primary/5' : 'text-foreground/70'}`}>
                          {team.name}
                        </div>
                        <div className="flex gap-0.5 px-1">
                          <button
                            onClick={() => goTo('radar', team)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                              isActive && activePage === 'radar'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                          >
                            <Radar className="w-3 h-3" /> Radar
                          </button>
                          <button
                            onClick={() => goTo('strategy', team)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                              isActive && activePage === 'strategy'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                          >
                            <TrendingUp className="w-3 h-3" /> Strategy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Session info */}
      <div className="border-t border-border px-4 py-3">
        <div className="text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground">{organization.username || organization.email || '—'}</span>
          <br />
          {organization.role || 'member'}
        </div>
      </div>
    </aside>
  );
}
