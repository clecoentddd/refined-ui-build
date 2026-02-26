import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { company, radarIds, setRadarId } = useAppState();
  const [open, setOpen] = useState(false);
  const [elements, setElements] = useState<RadarElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'radar'>('list');
  const [detectOpen, setDetectOpen] = useState(false);
  const [updateEl, setUpdateEl] = useState<RadarElement | null>(null);
  const [elementCount, setElementCount] = useState<number | null>(null);
  const radarId = radarIds[team.teamId];

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadRadar();
  };

  const loadRadar = async () => {
    if (!radarId) { setElements([]); return; }
    setLoading(true);
    try {
      const r = await useAdminApi.getRadarView(radarId);
      if (!r || !r.radarId) { setElements([]); setElementCount(0); setLoading(false); return; }
      const els = r.elements || [];
      setElements(els);
      setElementCount(els.length);
    } catch { setElements([]); setElementCount(0); }
    setLoading(false);
  };

  const handleCreateRadar = async () => {
    const newRadarId = crypto.randomUUID();
    try {
      await useAdminApi.createRadar(newRadarId, team.teamId, company.orgId!, company.sid!);
      setRadarId(team.teamId, newRadarId);
      toast.success('Radar created — ACTIVE');
      setTimeout(loadRadar, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  const handleDelete = async (eid: string) => {
    if (!confirm('Delete this radar element?')) return;
    if (!radarId) return toast.error('Radar ID not found');
    try {
      await useAdminApi.deleteRadarElement(eid, { radarId, radarElementId: eid, teamId: team.teamId, organizationId: company.orgId }, company.sid!);
      toast.success('Element deleted');
      setTimeout(loadRadar, 1000);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden shadow-sm transition-all ${open ? 'border-primary/30' : 'border-border hover:border-primary/20'}`}>
      <div onClick={toggle} className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface2 transition-colors select-none">
        <div className="flex items-center gap-3.5">
          <span className={`text-muted-foreground text-[11px] transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          <div>
            <div className="font-bold text-[15px]">{team.name || 'Unnamed'}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
              Level {team.level || 1}{team.context ? ` · ${team.context}` : ''}{team.purpose ? ` · ${team.purpose}` : ''}
            </div>
          </div>
        </div>
        <Pill variant={elementCount !== null && elementCount > 0 ? 'success' : radarId ? 'default' : 'destructive'}>
          {elementCount !== null ? `${elementCount} element${elementCount !== 1 ? 's' : ''}` : radarId ? '— check radar' : '— no radar'}
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
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">📡 Radar</span>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setView('list')}
                      className={`px-3 py-1 rounded-md border font-mono text-[11px] transition-all ${view === 'list' ? 'bg-primary/10 border-primary/30 text-primary font-bold' : 'border-border bg-card text-muted-foreground'}`}
                    >☰ List</button>
                    <button
                      onClick={() => setView('radar')}
                      className={`px-3 py-1 rounded-md border font-mono text-[11px] transition-all ${view === 'radar' ? 'bg-primary/10 border-primary/30 text-primary font-bold' : 'border-border bg-card text-muted-foreground'}`}
                    >◎ Radar</button>
                  </div>
                  {radarId && (
                    <button onClick={() => setDetectOpen(true)} className="border border-border-strong bg-card text-muted-foreground hover:text-foreground px-3 py-1 rounded-md font-bold text-[11px] transition-all">
                      + Detect
                    </button>
                  )}
                </div>
              </div>

              {!radarId ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2.5">📡</div>
                  <div className="font-mono text-xs text-muted-foreground mb-3.5">No radar exists for this team yet.</div>
                  <button onClick={handleCreateRadar} className="bg-primary text-primary-foreground rounded-lg px-5 py-2 font-bold text-sm hover:opacity-90 transition-all shadow-md">
                    📡 Create Radar
                  </button>
                </div>
              ) : loading ? (
                <EmptyState icon="⏳" message="Loading..." />
              ) : view === 'list' ? (
                elements.length === 0 ? (
                  <EmptyState icon="📡" message="No elements yet. Detect the first one." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {elements.map(el => (
                      <RadarElementCard key={el.radarElementId} element={el} onEdit={() => setUpdateEl(el)} onDelete={() => handleDelete(el.radarElementId)} />
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
