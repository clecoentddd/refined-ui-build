import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, List, Target, Plus, Radio, Loader2 } from 'lucide-react';
import type { Team, RadarElement } from '@/context/AppContext';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import Pill from '@/components/Pill';
import EmptyState from '@/components/EmptyState';
import RadarElementCard from '@/components/RadarElementCard';
import RadarSVG from '@/components/RadarSVG';
import DetectElementModal from '@/components/DetectElementModal';
import UpdateElementModal from '@/components/UpdateElementModal';

interface TeamPanelProps {
  team: Team;
  onRefresh: () => void;
}

export default function TeamPanel({ team, onRefresh }: TeamPanelProps) {
  const { organization } = useAppState();
  const [open, setOpen] = useState(false);
  const [elements, setElements] = useState<RadarElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'radar'>('list');
  const [detectOpen, setDetectOpen] = useState(false);
  const [updateEl, setUpdateEl] = useState<RadarElement | null>(null);
  const [elementCount, setElementCount] = useState<number | null>(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadRadar();
  };

  const loadRadar = async () => {
    setLoading(true);
    try {
      const r = await useAdminApi.getEnvironmentalChangesForTeam(team.teamId);
      const els = r || [];
      setElements(els);
      setElementCount(els.length);
    } catch { setElements([]); setElementCount(0); }
    setLoading(false);
  };

  const handleDelete = async (eid: string) => {
    if (!confirm('Delete this radar element?')) return;
    try {
      await useAdminApi.deleteEnvironmentalChange(eid, {
        environmentalChangeId: eid,
        teamId: team.teamId,
        organizationId: organization.orgId
      }, organization.sid!);
      toast.success('Element deleted');
      setTimeout(loadRadar, 1000);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${open ? 'border-foreground/15' : 'border-border hover:border-foreground/10'}`}>
      <div onClick={toggle} className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface2/50 transition-colors select-none">
        <div className="flex items-center gap-3">
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
          <div>
            <div className="font-bold text-[15px]">{team.name || 'Unnamed'}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
              Level {team.level || 1}{team.context ? ` · ${team.context}` : ''}{team.purpose ? ` · ${team.purpose}` : ''}
            </div>
          </div>
        </div>
        <Pill variant={elementCount !== null && elementCount > 0 ? 'primary' : 'default'}>
          {elementCount !== null ? `${elementCount} element${elementCount !== 1 ? 's' : ''}` : 'loading...'}
        </Pill>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border">
              <div className="flex items-center justify-between py-4">
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase flex items-center gap-1.5">
                  <Radio className="w-3 h-3" /> Radar
                </span>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setView('list')}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-all ${view === 'list' ? 'bg-foreground/5 border-foreground/15 text-foreground font-bold' : 'border-border bg-card text-muted-foreground'
                        }`}
                    ><List className="w-3 h-3" /> List</button>
                    <button
                      onClick={() => setView('radar')}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-all ${view === 'radar' ? 'bg-foreground/5 border-foreground/15 text-foreground font-bold' : 'border-border bg-card text-muted-foreground'
                        }`}
                    ><Target className="w-3 h-3" /> Radar</button>
                  </div>
                  <button onClick={() => setDetectOpen(true)} className="inline-flex items-center gap-1 border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20 px-3 py-1.5 rounded-lg font-medium text-[11px] transition-all">
                    <Plus className="w-3 h-3" /> Detect
                  </button>
                </div>
              </div>

              {loading ? (
                <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading..." />
              ) : view === 'list' ? (
                elements.length === 0 ? (
                  <EmptyState icon={<Radio className="w-6 h-6 opacity-30" />} message="No elements yet. Detect the first one." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {elements.map(el => (
                      <RadarElementCard key={el.environmentalChangeId} element={el} onEdit={() => setUpdateEl(el)} onDelete={() => handleDelete(el.environmentalChangeId)} />
                    ))}
                  </div>
                )
              ) : (
                <RadarSVG elements={elements} onEdit={setUpdateEl} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DetectElementModal
        open={detectOpen}
        onClose={() => setDetectOpen(false)}
        teamId={team.teamId}
        teamName={team.name}
        onSuccess={loadRadar}
      />

      {updateEl && (
        <UpdateElementModal
          open={!!updateEl}
          onClose={() => setUpdateEl(null)}
          element={updateEl}
          teamId={team.teamId}
          onSuccess={loadRadar}
        />
      )}
    </div>
  );
}