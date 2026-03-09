import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2, Loader2, TrendingUp, Radar, ArrowRight } from 'lucide-react';
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
  const [editTeam, setEditTeam] = useState({
    name: team.name,
    purpose: team.purpose || '',
    context: team.context || '',
    level: String(team.level ?? 1)
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTeam({
      name: team.name,
      purpose: team.purpose || '',
      context: team.context || '',
      level: String(team.level ?? 1)
    });
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
        level: editTeam.level === "" ? 1 : parseInt(editTeam.level, 10),
      }, organization.sid!, organization.userId!);

      toast.success(`Team "${editTeam.name}" updated`);
      setEditOpen(false);
      setTimeout(onRefresh, 1500);
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
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
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
    setDeleting(false);
  };

  const buildParams = () =>
    `teamId=${team.teamId}&organizationId=${team.organizationId}&teamName=${encodeURIComponent(team.name)}`;

  const goToRadar = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/radar?${buildParams()}`);
  };

  const goToStrategy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/strategy?${buildParams()}`);
  };

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 hover:shadow-md transition-all">
      {/* Card header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base text-foreground leading-tight">{team.name || 'Unnamed'}</h3>
          {/* Edit/Delete — hover only */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={openEdit} title="Edit" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDeleteTeam} disabled={deleting} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:opacity-40">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Purpose / Context */}
        {team.purpose && (
          <p className="text-[12px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{team.purpose}</p>
        )}
        {team.context && !team.purpose && (
          <p className="text-[12px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{team.context}</p>
        )}
      </div>

      {/* Card footer — navigation actions */}
      <div className="flex border-t border-border">
        <button
          onClick={goToRadar}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border-r border-border"
        >
          <Radar className="w-3.5 h-3.5" /> Radar
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
        <button
          onClick={goToStrategy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5" /> Strategy
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Team" subtitle="Update team details">
        <FormField label="Team Name">
          <FormInput
            value={editTeam.name}
            onChange={e => setEditTeam(p => ({ ...p, name: e.target.value }))}
            placeholder="Strategy Team"
          />
        </FormField>

        <FormField label="Purpose">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={editTeam.purpose}
            onChange={e => setEditTeam(p => ({ ...p, purpose: e.target.value }))}
            placeholder="Drive strategic initiatives"
          />
        </FormField>

        <FormField label="Context">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={editTeam.context}
            onChange={e => setEditTeam(p => ({ ...p, context: e.target.value }))}
            placeholder="Executive"
          />
        </FormField>

        <div className="pt-3 border-t border-border mt-4">
          <FormField label="Hierarchy Level">
            <FormInput
              type="number"
              value={editTeam.level}
              onChange={e => setEditTeam(p => ({ ...p, level: e.target.value }))}
              min={0}
              max={10}
              className="max-w-[100px]"
            />
          </FormField>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => setEditOpen(false)}
            className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateTeam}
            disabled={saving}
            className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}