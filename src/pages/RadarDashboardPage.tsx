import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { List, Target, Plus, Radio, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import RadarElementCard from '@/components/RadarElementCard';
import RadarSVG from '@/components/RadarPanel';
import DetectElementModal from '@/components/DetectElementModal';
import UpdateElementModal from '@/components/UpdateElementModal';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import type { RadarElement } from '@/context/AppContext';
import OrgSidebar from '@/components/OrgSidebar';

export default function RadarDashboardPage() {
  const [params] = useSearchParams();
  const teamId = params.get('teamId') || '';
  const teamName = decodeURIComponent(params.get('teamName') || 'Team');
  const organizationId = params.get('organizationId') || '';

  const { organization } = useAppState();
  const [elements, setElements] = useState<RadarElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Best Practice: Track error state
  const [view, setView] = useState<'radar' | 'list'>('radar');
  const [detectOpen, setDetectOpen] = useState(false);
  const [updateEl, setUpdateEl] = useState<RadarElement | null>(null);

  useEffect(() => { loadRadar(); }, [teamId]);

  const loadRadar = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await useAdminApi.getEnvironmentalChangesForTeam(
        teamId,
        organization.orgId!,
        organization.userId!
      );

      // Best Practice: Extract the list from the DTO wrapper
      // If the backend returns our ReadModel, we need r.elements. 
      // If it fails or is empty, we fall back to an empty array.
      const list = r?.elements || [];
      setElements(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load radar data');
      setElements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElement = async (eid: string) => {
    if (!confirm('Delete this radar element?')) return;
    try {
      await useAdminApi.deleteEnvironmentalChange(eid, {
        environmentalChangeId: eid,
        teamId,
        organizationId,
      }, organization.sid!, organization.userId!);
      toast.success('Element deleted');
      setTimeout(loadRadar, 1000);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
  };

  // ── Render Helpers ───────────────────────────────────────────────────

  const renderContent = () => {
    // 1. Error State
    if (error) {
      return (
        <EmptyState
          icon={<AlertCircle className="w-6 h-6 text-destructive" />}
          message={error}
          action={<button onClick={loadRadar} className="text-primary underline">Try again</button>}
        />
      );
    }

    // 2. Loading State
    if (loading) {
      return <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading radar..." />;
    }

    // 3. Empty State
    if (elements.length === 0) {
      return <EmptyState icon={<Radio className="w-6 h-6 opacity-30" />} message="No elements yet. Detect the first one." />;
    }

    // 4. Success State (Radar or List View)
    if (view === 'radar') {
      return <RadarSVG elements={elements} onEdit={(el) => setUpdateEl(el)} />;
    }

    return (
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {elements.map(el => (
          <RadarElementCard
            key={el.environmentalChangeId}
            element={el}
            onEdit={() => setUpdateEl(el)}
            onDelete={() => handleDeleteElement(el.environmentalChangeId)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="organization" />
      <main className="flex-1 p-7 max-w-7xl mx-auto w-full">
        <PageHeader
          title={`${teamName} — Radar`}
          subtitle="Environmental changes detected by this team"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setView('radar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${view === 'radar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                ><Target className="w-3.5 h-3.5" /> Radar</button>
                <button
                  onClick={() => setView('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                ><List className="w-3.5 h-3.5" /> List</button>
              </div>
              <button onClick={() => setDetectOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-all">
                <Plus className="w-4 h-4" /> Detect
              </button>
            </div>
          }
        />

        {renderContent()}
      </main>

      <DetectElementModal open={detectOpen} onClose={() => setDetectOpen(false)} teamId={teamId} teamName={teamName} onSuccess={loadRadar} />
      {updateEl && <UpdateElementModal open={!!updateEl} onClose={() => setUpdateEl(null)} element={updateEl} teamId={teamId} onSuccess={loadRadar} />}
    </div>
  );
}