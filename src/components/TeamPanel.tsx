import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2, Loader2, TrendingUp, Radar } from 'lucide-react';
import type { Team } from '@/context/AppContext';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import Modal from '@/components/Modal';
import { FormField, FormInput } from '@/components/FormElements';

interface TeamPanelProps {
  team: Team;
  onRefresh: () => void;
}

export default function TeamPanel({ team, onRefresh }: TeamPanelProps) {
  const navigate = useNavigate();
  const { organization } = useAppState();

  const [editOpen, setEditOpen] = useState(false);
  const [editTeam, setEditTeam] = useState({ name: team.name, purpose: team.purpose || '', context: team.context || '', level: String(team.level ?? 1) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const goToRadar = () => {
    navigate(`/dashboard/radar?teamId=${team.teamId}&organizationId=${team.organizationId}&teamName=${encodeURIComponent(team.name)}`);
  };

  const goToStrategy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/strategy?teamId=${team.teamId}&organizationId=${team.organizationId}&teamName=${encodeURIComponent(team.name)}`);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/10 transition-all">
      <div className="flex items-center gap-3 px-4 py-3 group">
        {/* Team info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{team.name || 'Unnamed'}</div>
          {(team.context || team.purpose) && (
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {[team.context, team.purpose].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={goToRadar}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 text-[11px] font-medium transition-all"
        >
          <Radar className="w-3.5 h-3.5" /> Radar
        </button>
        <button
          onClick={goToStrategy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 text-[11px] font-medium transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5" /> Strategy
        </button>

        {/* Edit/Delete — hover only */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={openEdit} title="Edit" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDeleteTeam} disabled={deleting} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:opacity-40">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

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
