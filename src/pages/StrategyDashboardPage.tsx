import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Target, Plus, ChevronRight, Loader2, Flag, ArrowLeft,
    Trash2, CheckCircle2, Circle, AlertCircle, Save, X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { FormField, FormInput } from '@/components/FormElements';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';

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

interface StrategyItem {
    itemId: string;
    content: string;
    status: string;
}

type StepKey = 'DIAGNOSTIC' | 'OVERALLAPPROACH' | 'COHERENTACTION' | 'PROXIMATEOBJECTIVE';

interface InitiativeDetail {
    initiativeId: string;
    initiativeName: string;
    items: Record<StepKey, StrategyItem[]>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: { key: StepKey; label: string; subtitle: string; color: string; accent: string }[] = [
    {
        key: 'DIAGNOSTIC',
        label: 'The Diagnosis',
        subtitle: 'What is the core challenge?',
        color: 'from-violet-500/10 to-violet-500/5',
        accent: 'border-violet-500/20 text-violet-400',
    },
    {
        key: 'OVERALLAPPROACH',
        label: 'Guiding Policy',
        subtitle: 'How do we approach it?',
        color: 'from-blue-500/10 to-blue-500/5',
        accent: 'border-blue-500/20 text-blue-400',
    },
    {
        key: 'COHERENTACTION',
        label: 'Coherent Actions',
        subtitle: 'What do we actually do?',
        color: 'from-emerald-500/10 to-emerald-500/5',
        accent: 'border-emerald-500/20 text-emerald-400',
    },
    {
        key: 'PROXIMATEOBJECTIVE',
        label: 'Proximate Objectives',
        subtitle: 'Measurable near-term goals',
        color: 'from-amber-500/10 to-amber-500/5',
        accent: 'border-amber-500/20 text-amber-400',
    },
];

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

// ─── Editable Item Row ────────────────────────────────────────────────────────

interface ItemRowProps {
    item: StrategyItem;
    saving: boolean;
    onSave: (itemId: string, content: string) => void;
    onDelete: (itemId: string) => void;
}

function ItemRow({ item, saving, onSave, onDelete }: ItemRowProps) {
    const [draft, setDraft] = useState(item.content);
    const prevContent = useRef(item.content);

    // Sync draft if parent content changes (e.g. after a refresh)
    useEffect(() => {
        if (!saving) {
            setDraft(item.content);
            prevContent.current = item.content;
        }
    }, [item.content, saving]);

    const handleBlur = () => {
        const trimmed = draft.trim();
        if (trimmed === prevContent.current) return; // no change
        prevContent.current = trimmed;
        onSave(item.itemId, trimmed);
    };

    return (
        <div className="group flex items-start gap-2 py-1.5">
            <Circle className="w-3.5 h-3.5 mt-[5px] flex-shrink-0 text-muted-foreground/30" />
            <textarea
                className="flex-1 text-[13px] leading-relaxed bg-transparent border-0 border-b border-transparent focus:border-border resize-none outline-none text-foreground placeholder:text-muted-foreground/40 transition-colors min-h-[1.5rem]"
                rows={1}
                value={draft}
                onChange={e => {
                    setDraft(e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onBlur={handleBlur}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        (e.target as HTMLTextAreaElement).blur();
                    }
                }}
                placeholder="Add a note…"
            />
            {saving ? (
                <Loader2 className="w-3.5 h-3.5 mt-[5px] flex-shrink-0 animate-spin text-muted-foreground/50" />
            ) : (
                <button
                    onClick={() => onDelete(item.itemId)}
                    className="opacity-0 group-hover:opacity-100 mt-[4px] flex-shrink-0 text-muted-foreground/40 hover:text-destructive transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

// ─── Step Column ─────────────────────────────────────────────────────────────

interface StepColumnProps {
    step: typeof STEPS[0];
    items: StrategyItem[];
    savingIds: Set<string>;
    onSaveItem: (step: StepKey, itemId: string, content: string) => void;
    onDeleteItem: (step: StepKey, itemId: string) => void;
    onAddItem: (step: StepKey) => void;
}

function StepColumn({ step, items, savingIds, onSaveItem, onDeleteItem, onAddItem }: StepColumnProps) {
    return (
        <div className={`flex flex-col h-full border border-border rounded-xl bg-gradient-to-b ${step.color} overflow-hidden`}>
            {/* Column header */}
            <div className={`px-4 pt-4 pb-3 border-b ${step.accent.split(' ')[0]}`}>
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${step.accent} mb-1.5`}>
                    {STEPS.indexOf(step) + 1}. {step.key}
                </div>
                <div className="font-bold text-[15px] text-foreground">{step.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{step.subtitle}</div>
            </div>

            {/* Items */}
            <div data-step={step.key} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 min-h-0">
                {items.length === 0 && (
                    <p className="text-[12px] text-muted-foreground/40 italic py-1">No items yet…</p>
                )}
                {items.map(item => (
                    <ItemRow
                        key={item.itemId}
                        item={item}
                        saving={savingIds.has(item.itemId)}
                        onSave={(id, content) => onSaveItem(step.key, id, content)}
                        onDelete={(id) => onDeleteItem(step.key, id)}
                    />
                ))}
            </div>

            {/* Add button */}
            <div className="px-4 pb-4 pt-2 border-t border-border/50">
                <button
                    onClick={() => onAddItem(step.key)}
                    className="w-full flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add item
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StrategyDashboardPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { organization } = useAppState();

    const teamId = searchParams.get('teamId') ?? '';
    const teamName = searchParams.get('teamName') ?? '';
    const organizationId = searchParams.get('organizationId') ?? organization.orgId ?? '';

    // ── Strategies ──────────────────────────────────────────────────────────────
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [strategiesLoading, setStrategiesLoading] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

    // ── Initiatives ──────────────────────────────────────────────────────────────
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [initiativesLoading, setInitiativesLoading] = useState(false);
    const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

    // ── Initiative Detail ────────────────────────────────────────────────────────
    const [detail, setDetail] = useState<InitiativeDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    // Keep a snapshot of server state for rollback
    const serverSnapshot = useRef<InitiativeDetail | null>(null);

    // ── Modals ───────────────────────────────────────────────────────────────────
    const [strategyModalOpen, setStrategyModalOpen] = useState(false);
    const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
    const [strategySubmitting, setStrategySubmitting] = useState(false);
    const [initiativeSubmitting, setInitiativeSubmitting] = useState(false);
    const [newStrategy, setNewStrategy] = useState({ title: '', timeframe: '' });
    const [newInitiative, setNewInitiative] = useState({ name: '' });

    // ── Load strategies ──────────────────────────────────────────────────────────
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

    // ── Load initiatives ─────────────────────────────────────────────────────────
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
        setInitiatives([]);
        loadInitiatives(s);
    };

    // ── Load initiative detail ───────────────────────────────────────────────────
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

    // ── Item helpers ─────────────────────────────────────────────────────────────
    // Use a stable session ID: generate once per component mount, not per render.
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

    // Returns true if itemId exists in the server snapshot for a given step
    const isPersistedOnServer = (step: StepKey, itemId: string): boolean =>
        !!(serverSnapshot.current?.items[step].find(i => i.itemId === itemId));

    // Called onBlur (or Enter) by ItemRow – decides whether an API call is needed
    const handleSaveItem = async (step: StepKey, itemId: string, content: string) => {
        if (!detail) return;
        const persisted = isPersistedOnServer(step, itemId);
        const serverContent = serverSnapshot.current?.items[step].find(i => i.itemId === itemId)?.content;

        // New item with no content typed → just drop it from local state silently
        if (!persisted && !content.trim()) {
            setDetail(prev => {
                if (!prev) return prev;
                return { ...prev, items: { ...prev.items, [step]: prev.items[step].filter(i => i.itemId !== itemId) } };
            });
            return;
        }

        // No change vs server → skip
        if (persisted && content === serverContent) return;

        markSaving(itemId);
        // Update local state with final content
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
            // Update snapshot: add or update
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
            // Rollback to server state if it was already persisted; otherwise just remove
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

    // "+ Add item" → local state only, NO API call. API fires on blur via handleSaveItem.
    const handleAddItem = (step: StepKey) => {
        if (!detail) return;
        const itemId = crypto.randomUUID();
        setDetail(prev => {
            if (!prev) return prev;
            return { ...prev, items: { ...prev.items, [step]: [...prev.items[step], { itemId, content: '', status: 'ACTIVE' }] } };
        });
        // Focus the new textarea in the next tick
        setTimeout(() => {
            const rows = document.querySelectorAll<HTMLTextAreaElement>(`[data-step="${step}"] textarea`);
            if (rows.length > 0) rows[rows.length - 1].focus();
        }, 50);
    };

    const handleDeleteItem = async (step: StepKey, itemId: string) => {
        if (!detail) return;
        const target = detail.items[step].find(i => i.itemId === itemId);
        // If it's not yet on the server, just remove locally — no API call needed
        if (!isPersistedOnServer(step, itemId)) {
            setDetail(d => {
                if (!d) return d;
                return { ...d, items: { ...d.items, [step]: d.items[step].filter(i => i.itemId !== itemId) } };
            });
            return;
        }
        // Optimistic remove
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


    // ── Bulk Save All ────────────────────────────────────────────────────────────
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

    // ── Create strategy ──────────────────────────────────────────────────────────
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

    // ── Create initiative ────────────────────────────────────────────────────────
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

    // ── Guard ────────────────────────────────────────────────────────────────────
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

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar variant="organization" />

            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
                <aside className="w-[220px] flex-shrink-0 border-r border-border bg-card sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto p-5">
                    <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Navigation</div>
                    <button
                        onClick={() => navigate('/dashboard/organization')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Teams & Radar
                    </button>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm font-semibold text-primary mt-1">
                        <Target className="w-4 h-4" /> Strategy
                    </div>

                    <div className="mt-6">
                        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Team</div>
                        <div className="px-2 text-[13px] font-medium text-foreground">{teamName || teamId}</div>
                    </div>

                    <div className="mt-6">
                        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-2 mb-2">Session</div>
                        <div className="px-2 text-[12px] text-muted-foreground leading-relaxed">
                            Role: <span className="text-foreground font-medium">{organization.role || '—'}</span><br />
                            Org: <span className="text-foreground font-medium">{organization.orgName || '—'}</span>
                        </div>
                    </div>
                </aside>

                {/* ── Strategies panel ─────────────────────────────────────────────────── */}
                <div className="w-[240px] flex-shrink-0 border-r border-border overflow-y-auto p-5">
                    <PageHeader
                        title="Strategies"
                        subtitle={`Team: ${teamName}`}
                        actions={
                            <button
                                onClick={() => setStrategyModalOpen(true)}
                                className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-semibold text-xs hover:opacity-90 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> New
                            </button>
                        }
                    />
                    {strategiesLoading ? (
                        <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading…" />
                    ) : strategies.length === 0 ? (
                        <EmptyState icon={<Target className="w-8 h-8 opacity-30" />} message="No strategies yet." />
                    ) : (
                        <div className="space-y-2 mt-4">
                            {strategies.map(s => (
                                <button
                                    key={s.strategyId}
                                    onClick={() => selectStrategy(s)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedStrategy?.strategyId === s.strategyId
                                        ? 'border-primary/30 bg-primary/5 shadow-sm'
                                        : 'border-border bg-card hover:border-primary/10 hover:bg-muted/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-[13px] truncate">{s.title}</div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{s.timeframe}</div>
                                        </div>
                                        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 text-muted-foreground transition-transform ${selectedStrategy?.strategyId === s.strategyId ? 'rotate-90 text-primary' : ''}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Initiatives panel ─────────────────────────────────────────────────── */}
                {selectedStrategy && (
                    <div className="w-[220px] flex-shrink-0 border-r border-border overflow-y-auto p-5">
                        <PageHeader
                            title="Initiatives"
                            subtitle={selectedStrategy.title}
                            actions={
                                <button
                                    onClick={() => setInitiativeModalOpen(true)}
                                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-semibold text-xs hover:opacity-90 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" /> New
                                </button>
                            }
                        />
                        {initiativesLoading ? (
                            <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading…" />
                        ) : initiatives.length === 0 ? (
                            <EmptyState icon={<Flag className="w-7 h-7 opacity-30" />} message="No initiatives yet." />
                        ) : (
                            <div className="space-y-2 mt-4">
                                {initiatives.map(i => (
                                    <button
                                        key={i.initiativeId}
                                        onClick={() => selectInitiative(i)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedInitiative?.initiativeId === i.initiativeId
                                            ? 'border-primary/30 bg-primary/5 shadow-sm'
                                            : 'border-border bg-card hover:border-primary/10 hover:bg-muted/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="font-semibold text-[13px] leading-snug truncate">{i.initiativeName}</div>
                                            <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 text-muted-foreground transition-transform ${selectedInitiative?.initiativeId === i.initiativeId ? 'rotate-90 text-primary' : ''}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Initiative Detail: 4-column Kanban ───────────────────────────────── */}
                <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                    {!selectedStrategy ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState icon={<Target className="w-10 h-10 opacity-20" />} message="Select a strategy to get started" />
                        </div>
                    ) : !selectedInitiative ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState icon={<Flag className="w-10 h-10 opacity-20" />} message="Select an initiative to view its strategy board" />
                        </div>
                    ) : detailLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState icon={<Loader2 className="w-8 h-8 animate-spin opacity-30" />} message="Loading initiative…" />
                        </div>
                    ) : detail ? (
                        <>
                            {/* Board header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                                <div>
                                    <h2 className="font-bold text-[16px] text-foreground">{detail.initiativeName}</h2>
                                    <p className="text-[12px] text-muted-foreground mt-0.5">
                                        {STEPS.reduce((sum, s) => sum + detail.items[s.key].length, 0)} items across 4 thinking steps
                                    </p>
                                </div>
                                <button
                                    onClick={handleSaveAll}
                                    className="inline-flex items-center gap-2 border border-border bg-background text-foreground rounded-lg px-4 py-2 font-semibold text-sm hover:bg-muted/30 transition-all"
                                >
                                    <Save className="w-4 h-4" /> Save All
                                </button>
                            </div>

                            {/* 4-column grid */}
                            <div className="flex-1 overflow-hidden p-5">
                                <div className="grid grid-cols-4 gap-4 h-full">
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
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            {/* ── Create Strategy Modal ─────────────────────────────────────────────── */}
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

            {/* ── Create Initiative Modal ───────────────────────────────────────────── */}
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
