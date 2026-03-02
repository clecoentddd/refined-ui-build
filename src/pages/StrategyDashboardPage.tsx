import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Target, Plus, ChevronRight, Loader2, Flag, ArrowLeft,
  Save, Clock, LayoutGrid
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import StepColumn, { STEPS, type StepKey } from '@/components/strategy/StepColumn';
import type { StrategyItem } from '@/components/strategy/ItemRow';
import StrategyBreadcrumb from '@/components/strategy/StrategyBreadcrumb';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Strategy {
  strategyId: string;
  teamId: string;
  organizationId: string;
  title: string;
  timeframe: string;
  status?: string;
}

interface Initiative {
  initiativeId: string;
  initiativeName: string;
  strategyId: string;
  teamId: string;
  organizationId: string;
}

interface InitiativeDetail {
  initiativeId: string;
  initiativeName: string;
  items: Record<StepKey, StrategyItem[]>;
}

function mapServerItems(raw: any[]): StrategyItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i: any) => i.status !== 'DELETED')
    .map((i: any) => ({
      itemId: i.id ?? crypto.randomUUID(),
      content: i.content ?? '',
      status: i.status ?? 'ACTIVE',
    }));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StrategyDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organization } = useAppState();

  const teamId = searchParams.get('teamId') ?? '';
  const teamName = searchParams.get('teamName') ?? '';
  const organizationId = searchParams.get('organizationId') ?? organization.orgId ?? '';

  // ── Strategies
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // ── Initiatives
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [initiativesLoading, setInitiativesLoading] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  // ── Initiative Detail
  const [detail, setDetail] = useState<InitiativeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const serverSnapshot = useRef<InitiativeDetail | null>(null);

  // ── Modals
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [strategySubmitting, setStrategySubmitting] = useState(false);
  const [initiativeSubmitting, setInitiativeSubmitting] = useState(false);
  const [newStrategy, setNewStrategy] = useState({ title: '', timeframe: '' });
  const [newInitiative, setNewInitiative] = useState({ name: '' });

  // ── Load strategies
  const loadStrategies = useCallback(async () => {
    if (!teamId || !organizationId) return;
    setStrategiesLoading(true);
    try {
      const r = await useAdminApi.getStrategiesByTeam(organizationId, teamId);
      const raw: any[] = Array.isArray(r) ? r : (r?.strategies ?? []);
      setStrategies(raw.map((s: any) => ({
        strategyId: s.strategyId,
        teamId: s.teamId,
        organizationId: s.organizationId,
        title: s.strategyName ?? s.title ?? '(untitled)',
        timeframe: s.strategyTimeframe ?? s.timeframe ?? '',
        status: s.status,
      })));
    } catch {
      setStrategies([]);
    }
    setStrategiesLoading(false);
  }, [teamId, organizationId]);

  useEffect(() => { loadStrategies(); }, [loadStrategies]);

  // ── Load initiatives
  const loadInitiatives = useCallback(async (strategy: Strategy) => {
    setInitiativesLoading(true);
    setSelectedInitiative(null);
    setDetail(null);
    serverSnapshot.current = null;
    try {
      const r = await useAdminApi.getInitiativesByStrategy(
        strategy.strategyId, strategy.teamId, strategy.organizationId
      );
      const list: Initiative[] = Array.isArray(r) ? r : (r?.initiatives ?? r?.items ?? []);
      setInitiatives(list);
    } catch {
      setInitiatives([]);
    }
    setInitiativesLoading(false);
  }, []);

  const selectStrategy = (s: Strategy) => {
    setSelectedStrategy(s);
    setSelectedInitiative(null);
    setDetail(null);
    setInitiatives([]);
    loadInitiatives(s);
  };

  const backToStrategies = () => {
    setSelectedStrategy(null);
    setSelectedInitiative(null);
    setDetail(null);
    setInitiatives([]);
  };

  const backToInitiatives = () => {
    setSelectedInitiative(null);
    setDetail(null);
  };

  // ── Load initiative detail
  const loadDetail = useCallback(async (initiative: Initiative) => {
    setDetailLoading(true);
    try {
      const r = await useAdminApi.getInitiativeById(initiative.initiativeId);
      const entity = r?.data ?? r;
      const parsed: InitiativeDetail = {
        initiativeId: initiative.initiativeId,
        initiativeName: initiative.initiativeName,
        items: {
          DIAGNOSTIC: mapServerItems(entity?.diagnostic),
          OVERALLAPPROACH: mapServerItems(entity?.overallPlan),
          COHERENTACTION: mapServerItems(entity?.coherentActions),
          PROXIMATEOBJECTIVE: mapServerItems(entity?.proximateObjectives),
        }
      };
      setDetail(parsed);
      serverSnapshot.current = JSON.parse(JSON.stringify(parsed));
    } catch {
      toast.error('Could not load initiative details');
      setDetail(null);
    }
    setDetailLoading(false);
  }, []);

  const selectInitiative = (i: Initiative) => {
    setSelectedInitiative(i);
    setDetail(null);
    loadDetail(i);
  };

  // ── Item helpers
  const stableSid = organization.sid ?? crypto.randomUUID();
  const userId = organization.adminId ?? '0000';
  const sid = stableSid;

  const itemErrorMsg = (e: any): string => {
    const msg: string = e?.message ?? '';
    if (msg.includes('500') || msg.includes('Internal')) {
      return 'Server error – the initiative aggregate may not exist in the event store. Try creating a fresh initiative through the UI.';
    }
    if (msg.includes('400')) return 'Bad request – check the payload fields.';
    if (msg.includes('missing') || msg.includes('header')) return 'Missing required header (x-user-id / x-session-id).';
    return `Could not save item: ${msg || 'unknown error'}`;
  };

  const markSaving = (id: string) => setSavingIds(prev => new Set(prev).add(id));
  const unmarkSaving = (id: string) => setSavingIds(prev => { const s = new Set(prev); s.delete(id); return s; });

  const isPersistedOnServer = (step: StepKey, itemId: string): boolean =>
    !!(serverSnapshot.current?.items[step].find(i => i.itemId === itemId));

  const handleSaveItem = async (step: StepKey, itemId: string, content: string) => {
    if (!detail) return;
    const persisted = isPersistedOnServer(step, itemId);
    const serverContent = serverSnapshot.current?.items[step].find(i => i.itemId === itemId)?.content;

    if (!persisted && !content.trim()) {
      setDetail(prev => {
        if (!prev) return prev;
        return { ...prev, items: { ...prev.items, [step]: prev.items[step].filter(i => i.itemId !== itemId) } };
      });
      return;
    }

    if (persisted && content === serverContent) return;

    markSaving(itemId);
    setDetail(prev => {
      if (!prev) return prev;
      return { ...prev, items: { ...prev.items, [step]: prev.items[step].map(i => i.itemId === itemId ? { ...i, content } : i) } };
    });
    try {
      await useAdminApi.changeInitiativeItem(
        detail.initiativeId,
        { initiativeId: detail.initiativeId, step, itemId, content, status: 'ACTIVE' },
        userId, sid
      );
      if (serverSnapshot.current) {
        const idx = serverSnapshot.current.items[step].findIndex(i => i.itemId === itemId);
        if (idx >= 0) {
          serverSnapshot.current.items[step][idx].content = content;
        } else {
          serverSnapshot.current.items[step].push({ itemId, content, status: 'ACTIVE' });
        }
      }
    } catch (e: any) {
      toast.error(itemErrorMsg(e));
      if (persisted && serverSnapshot.current) {
        setDetail(JSON.parse(JSON.stringify(serverSnapshot.current)));
      } else {
        setDetail(prev => {
          if (!prev) return prev;
          return { ...prev, items: { ...prev.items, [step]: prev.items[step].filter(i => i.itemId !== itemId) } };
        });
      }
    }
    unmarkSaving(itemId);
  };

  const handleAddItem = (step: StepKey) => {
    if (!detail) return;
    const itemId = crypto.randomUUID();
    setDetail(prev => {
      if (!prev) return prev;
      return { ...prev, items: { ...prev.items, [step]: [...prev.items[step], { itemId, content: '', status: 'ACTIVE' }] } };
    });
    setTimeout(() => {
      const rows = document.querySelectorAll<HTMLTextAreaElement>(`[data-step="${step}"] textarea`);
      if (rows.length > 0) rows[rows.length - 1].focus();
    }, 50);
  };

  const handleDeleteItem = async (step: StepKey, itemId: string) => {
    if (!detail) return;
    const target = detail.items[step].find(i => i.itemId === itemId);
    if (!isPersistedOnServer(step, itemId)) {
      setDetail(d => {
        if (!d) return d;
        return { ...d, items: { ...d.items, [step]: d.items[step].filter(i => i.itemId !== itemId) } };
      });
      return;
    }
    setDetail(d => {
      if (!d) return d;
      return { ...d, items: { ...d.items, [step]: d.items[step].filter(i => i.itemId !== itemId) } };
    });
    markSaving(itemId);
    try {
      await useAdminApi.changeInitiativeItem(
        detail.initiativeId,
        { initiativeId: detail.initiativeId, step, itemId, content: target?.content ?? '', status: 'DELETED' },
        userId, sid
      );
      if (serverSnapshot.current) {
        serverSnapshot.current.items[step] = serverSnapshot.current.items[step].filter(i => i.itemId !== itemId);
      }
    } catch (e: any) {
      toast.error(itemErrorMsg(e));
      if (target) {
        setDetail(d => {
          if (!d) return d;
          return { ...d, items: { ...d.items, [step]: [...d.items[step], target] } };
        });
      }
    }
    unmarkSaving(itemId);
  };

  const handleSaveAll = async () => {
    if (!detail) return;
    const dirty: { step: StepKey; item: StrategyItem }[] = [];
    for (const stepConfig of STEPS) {
      const step = stepConfig.key;
      const serverItems = serverSnapshot.current?.items[step] ?? [];
      for (const item of detail.items[step]) {
        const serverItem = serverItems.find(s => s.itemId === item.itemId);
        if (!serverItem || serverItem.content !== item.content) {
          dirty.push({ step, item });
        }
      }
    }
    if (dirty.length === 0) { toast.info('All items already saved'); return; }
    dirty.forEach(({ item }) => markSaving(item.itemId));
    const requests = dirty.map(({ step, item }) =>
      useAdminApi.changeInitiativeItem(
        detail.initiativeId,
        { initiativeId: detail.initiativeId, step, itemId: item.itemId, content: item.content, status: 'ACTIVE' },
        userId, sid
      ).then(() => {
        unmarkSaving(item.itemId);
        if (serverSnapshot.current) {
          const idx = serverSnapshot.current.items[step].findIndex(s => s.itemId === item.itemId);
          if (idx >= 0) serverSnapshot.current.items[step][idx].content = item.content;
          else serverSnapshot.current.items[step].push(item);
        }
      }).catch(() => {
        unmarkSaving(item.itemId);
        toast.error(`Failed to save item: "${item.content.slice(0, 30)}…"`);
      })
    );
    await Promise.all(requests);
    toast.success(`Saved ${dirty.length} item${dirty.length > 1 ? 's' : ''}`);
  };

  // ── Create strategy
  const createStrategy = async () => {
    if (!newStrategy.title.trim()) return toast.error('Title is required');
    if (!newStrategy.timeframe.trim()) return toast.error('Timeframe is required');
    setStrategySubmitting(true);
    try {
      await useAdminApi.createStrategyDraft(
        { teamId, organizationId, title: newStrategy.title, timeframe: newStrategy.timeframe },
        organization.adminId || '0000', organization.sid!
      );
      toast.success(`Strategy "${newStrategy.title}" created`);
      setStrategyModalOpen(false);
      setNewStrategy({ title: '', timeframe: '' });
      setTimeout(loadStrategies, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setStrategySubmitting(false);
  };

  // ── Create initiative
  const createInitiative = async () => {
    if (!newInitiative.name.trim()) return toast.error('Initiative name is required');
    if (!selectedStrategy) return toast.error('No strategy selected');
    const initiativeId = crypto.randomUUID();
    setInitiativeSubmitting(true);
    try {
      await useAdminApi.createInitiative(
        initiativeId,
        {
          initiativeId, initiativeName: newInitiative.name,
          organizationId: selectedStrategy.organizationId,
          strategyId: selectedStrategy.strategyId,
          teamId: selectedStrategy.teamId,
        },
        organization.adminId || '0000', organization.sid!
      );
      toast.success(`Initiative "${newInitiative.name}" created`);
      setInitiativeModalOpen(false);
      setNewInitiative({ name: '' });
      setTimeout(() => loadInitiatives(selectedStrategy), 1200);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setInitiativeSubmitting(false);
  };

  // ── Guard
  if (!teamId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar variant="organization" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={<Target className="w-8 h-8 opacity-20" />} message="No team selected. Open Strategy from within a team panel." />
        </div>
      </div>
    );
  }

  // ── Determine current view
  const view: 'strategies' | 'initiatives' | 'board' =
    selectedInitiative ? 'board' : selectedStrategy ? 'initiatives' : 'strategies';

  // ── Render
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="organization" />

      {/* ── Top bar with breadcrumb + actions ── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/organization')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <StrategyBreadcrumb
              teamName={teamName}
              strategyTitle={selectedStrategy?.title}
              initiativeName={selectedInitiative?.initiativeName}
              onBackToStrategies={backToStrategies}
              onBackToInitiatives={backToInitiatives}
            />
          </div>
          <div className="flex items-center gap-2">
            {view === 'strategies' && (
              <button
                onClick={() => setStrategyModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold text-xs hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Strategy
              </button>
            )}
            {view === 'initiatives' && (
              <button
                onClick={() => setInitiativeModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold text-xs hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Initiative
              </button>
            )}
            {view === 'board' && detail && (
              <button
                onClick={handleSaveAll}
                className="inline-flex items-center gap-2 border border-border bg-background text-foreground rounded-lg px-4 py-2 font-semibold text-xs hover:bg-muted/30 transition-all"
              >
                <Save className="w-3.5 h-3.5" /> Save All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-6">

          {/* ── STRATEGIES VIEW ── */}
          {view === 'strategies' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Strategies</h1>
                <p className="text-sm text-muted-foreground mt-1">Team: {teamName} · {strategies.length} strateg{strategies.length === 1 ? 'y' : 'ies'}</p>
              </div>
              {strategiesLoading ? (
                <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading strategies…" />
              ) : strategies.length === 0 ? (
                <EmptyState icon={<Target className="w-8 h-8 opacity-30" />} message="No strategies yet. Create one to get started." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {strategies.map(s => (
                    <button
                      key={s.strategyId}
                      onClick={() => selectStrategy(s)}
                      className="group text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-sm text-foreground truncate">{s.title}</h3>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {s.timeframe}
                          </div>
                          {s.status && (
                            <span className="inline-block mt-3 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border border-border bg-muted/30 text-muted-foreground">
                              {s.status}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── INITIATIVES VIEW ── */}
          {view === 'initiatives' && selectedStrategy && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Initiatives</h1>
                <p className="text-sm text-muted-foreground mt-1">Strategy: {selectedStrategy.title} · {initiatives.length} initiative{initiatives.length !== 1 ? 's' : ''}</p>
              </div>
              {initiativesLoading ? (
                <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading initiatives…" />
              ) : initiatives.length === 0 ? (
                <EmptyState icon={<Flag className="w-7 h-7 opacity-30" />} message="No initiatives yet. Create one to start planning." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {initiatives.map(i => (
                    <button
                      key={i.initiativeId}
                      onClick={() => selectInitiative(i)}
                      className="group text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <LayoutGrid className="w-4 h-4 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-sm text-foreground truncate">{i.initiativeName}</h3>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── BOARD VIEW (4-column Kanban) ── */}
          {view === 'board' && (
            <>
              {detailLoading ? (
                <EmptyState icon={<Loader2 className="w-8 h-8 animate-spin opacity-30" />} message="Loading initiative board…" />
              ) : detail ? (
                <>
                  <div className="mb-5">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">{detail.initiativeName}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {STEPS.reduce((sum, s) => sum + detail.items[s.key].length, 0)} items across 4 strategy pillars
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
                    {STEPS.map(step => (
                      <StepColumn
                        key={step.key}
                        step={step}
                        items={detail.items[step.key]}
                        savingIds={savingIds}
                        onSaveItem={handleSaveItem}
                        onDeleteItem={handleDeleteItem}
                        onAddItem={handleAddItem}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* ── Create Strategy Modal ── */}
      <Modal open={strategyModalOpen} onClose={() => setStrategyModalOpen(false)} title="New Strategy" subtitle={`For team: ${teamName}`}>
        <FormField label="Title">
          <FormInput value={newStrategy.title} onChange={e => setNewStrategy(p => ({ ...p, title: e.target.value }))} placeholder="2026 Growth Plan" />
        </FormField>
        <FormField label="Timeframe">
          <FormInput value={newStrategy.timeframe} onChange={e => setNewStrategy(p => ({ ...p, timeframe: e.target.value }))} placeholder="Q1–Q4 2026" />
        </FormField>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setStrategyModalOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createStrategy} disabled={strategySubmitting} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
            {strategySubmitting ? 'Creating…' : 'Create Strategy'}
          </button>
        </div>
      </Modal>

      {/* ── Create Initiative Modal ── */}
      <Modal open={initiativeModalOpen} onClose={() => setInitiativeModalOpen(false)} title="New Initiative" subtitle={selectedStrategy ? `For: ${selectedStrategy.title}` : ''}>
        <FormField label="Initiative Name">
          <FormInput value={newInitiative.name} onChange={e => setNewInitiative(p => ({ ...p, name: e.target.value }))} placeholder="Modernize Legacy Infrastructure" />
        </FormField>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setInitiativeModalOpen(false)} className="flex-1 border border-border bg-background text-muted-foreground rounded-lg py-2.5 font-semibold text-sm hover:text-foreground transition-all">Cancel</button>
          <button onClick={createInitiative} disabled={initiativeSubmitting} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
            {initiativeSubmitting ? 'Creating…' : 'Create Initiative'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
