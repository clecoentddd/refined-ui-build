import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, List, Target, Plus, Radio, Loader2, Pencil, Trash2, TrendingUp, Radar } from 'lucide-react';
import type { Team, RadarElement } from '@/context/AppContext';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import EmptyState from '@/components/EmptyState';
import RadarElementCard from '@/components/RadarElementCard';
import RadarSVG from '@/components/RadarPanel';
import DetectElementModal from '@/components/DetectElementModal';
import UpdateElementModal from '@/components/UpdateElementModal';
import Modal from '@/components/Modal';
import { FormField, FormInput } from '@/components/FormElements';

interface TeamPanelProps {
  team: Team;
  onRefresh: () => void;
}

export default function TeamPanel({ team, onRefresh }: TeamPanelProps) {
  const navigate = useNavigate();
  const { organization } = useAppState();
  const [open, setOpen] = useState(false);
  const [elements, setElements] = useState<RadarElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'radar'>('list');
  const [detectOpen, setDetectOpen] = useState(false);
  const [updateEl, setUpdateEl] = useState<RadarElement | null>(null);
  const [elementCount, setElementCount] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTeam, setEditTeam] = useState({ name: team.name, purpose: team.purpose || '', context: team.context || '', level: String(team.level ?? 1) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (organization.orgId) loadRadar();
  }, [organization.orgId, team.teamId]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadRadar();
  };

  const loadRadar = async () => {
    setLoading(true);
    try {
      const r = await useAdminApi.getEnvironmentalChangesForTeam(team.teamId, organization.orgId!, organization.userId!);
      const els = r || [];
      setElements(els);
      setElementCount(els.length);
    } catch { setElements([]); setElementCount(0); }
    setLoading(false);
  };

  const handleDeleteElement = async (eid: string) => {
    if (!confirm('Delete this radar element?')) return;
    try {
      await useAdminApi.deleteEnvironmentalChange(eid, {
        environmentalChangeId: eid,
        teamId: team.teamId,
        organizationId: organization.orgId
      }, organization.sid!, organization.userId!);
      toast.success('Element deleted');
      setTimeout(loadRadar, 1000);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTeam({ name: team.name, purpose: team.purpose || '', context: team.context || '', level: String(team.level ?? 1) });
    setEditOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!editTeam.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await useAdminApi.updateTeam(team.teamId, {
        teamId: team.teamId,
        organizationId: team.organizationId,
        name: editTeam.name,
        purpose: editTeam.purpose,
        context: editTeam.context,
        level: parseInt(editTeam.level) || 1,
      }, organization.sid!, organization.userId!);
      toast.success(`Team "${editTeam.name}" updated`);
      setEditOpen(false);
      setTimeout(onRefresh, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setSaving(false);
  };

  const handleDeleteTeam = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await useAdminApi.deleteTeam(team.teamId, {
        teamId: team.teamId,
        organizationId: team.organizationId,
      }, organization.sid!, organization.userId!);
      toast.success(`Team "${team.name}" deleted`);
      setTimeout(onRefresh, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setDeleting(false);
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${open ? 'border-primary/20 shadow-sm' : 'border-border hover:border-primary/10'}`}>
      {/* Header row — compact, info-dense */}
      <div onClick={toggle} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors select-none group">
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />

        {/* Team info — takes all available space */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{team.name || 'Unnamed'}</div>
          {(team.context || team.purpose) && (
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {[team.context, team.purpose].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* Element count badge */}
        {elementCount !== null && (
          <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-md px-2 py-0.5 tabular-nums shrink-0">
            {elementCount} element{elementCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Actions — icon-only, visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/strategy?teamId=${team.teamId}&organizationId=${team.organizationId}&teamName=${encodeURIComponent(team.name)}`); }}
            title="Strategy"
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={openEdit} title="Edit" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDeleteTeam} disabled={deleting} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:opacity-40">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
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
            <div className="px-4 pb-4 border-t border-border">
              <div className="flex items-center justify-between py-3">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Radio className="w-3 h-3" /> Radar Elements
                </span>
                <div className="flex gap-1.5 items-center">
                  <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                    <button
                      onClick={() => setView('list')}
                      className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      title="List view"
                    ><List className="w-3 h-3" /></button>
                    <button
                      onClick={() => setView('radar')}
                      className={`p-1.5 rounded-md transition-all ${view === 'radar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Radar view"
                    ><Target className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => setDetectOpen(true)} className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg font-medium text-[11px] hover:opacity-90 transition-all">
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
                  <div className="rounded-xl border border-border overflow-hidden bg-card">
                    {elements.map(el => (
                      <RadarElementCard key={el.environmentalChangeId} element={el} onEdit={() => setUpdateEl(el)} onDelete={() => handleDeleteElement(el.environmentalChangeId)} />
                    ))}
                  </div>
                )
              ) : (
                <RadarSVG elements={elements} onEdit={(el) => setUpdateEl(el)} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DetectElementModal open={detectOpen} onClose={() => setDetectOpen(false)} teamId={team.teamId} teamName={team.name} onSuccess={loadRadar} />
      {updateEl && <UpdateElementModal open={!!updateEl} onClose={() => setUpdateEl(null)} element={updateEl} teamId={team.teamId} onSuccess={loadRadar} />}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Team" subtitle="Update team details">
        <FormField label="Team Name"><FormInput value={editTeam.name} onChange={e => setEditTeam(p => ({ ...p, name: e.target.value }))} placeholder="Strategy Team" /></FormField>
        <FormField label="Purpose"><FormInput value={editTeam.purpose} onChange={e => setEditTeam(p => ({ ...p, purpose: e.target.value }))} placeholder="Drive strategic initiatives" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Context"><FormInput value={editTeam.context} onChange={e => setEditTeam(p => ({ ...p, context: e.target.value }))} placeholder="Executive" /></FormField>
          <FormField label="Level"><FormInput type="number" value={editTeam.level} onChange={e => setEditTeam(p => ({ ...p, level: e.target.value }))} min={0} max={10} /></FormField>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setEditOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={handleUpdateTeam} disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
