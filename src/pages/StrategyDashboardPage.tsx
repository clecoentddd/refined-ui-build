import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp, Plus, ChevronRight, ChevronDown, Loader2, Flag, ArrowLeft,
  Save, Clock, LayoutGrid, Pencil, Trash2, Check, X, Link, Search
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { FormField, FormInput } from '@/components/FormElements';
import Pill from '@/components/Pill';
import { useAppState } from '@/context/AppContext';
import { useAdminApi } from '@/services/api';
import StepColumn, { STEPS, type StepKey } from '@/components/strategy/StepColumn';
import type { StrategyItem } from '@/components/strategy/ItemRow';
import StrategyBreadcrumb from '@/components/strategy/StrategyBreadcrumb';
import OrgSidebar from '@/components/OrgSidebar';

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
  organizationId: string;
  items: Record<StepKey, StrategyItem[]>;
}

interface EnvChange { id: string; name: string; category: string; status: string; }

const ENV_QUADRANTS = [
  { key: 'BUSINESS', label: 'Business' },
  { key: 'CAPABILITIES', label: 'Capabilities' },
  { key: 'PEOPLE_KNOWLEDGE', label: 'People & Knowledge' },
  { key: 'OPERATING_MODEL', label: 'Operating Model' },
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
  const [expandedStrategyIds, setExpandedStrategyIds] = useState<Set<string>>(new Set());
  const [initiativesByStrategy, setInitiativesByStrategy] = useState<Record<string, Initiative[]>>({});
  const [loadingInitiativeIds, setLoadingInitiativeIds] = useState<Set<string>>(new Set());

  // ── Initiatives
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  // ── Initiative Detail
  const [detail, setDetail] = useState<InitiativeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const serverSnapshot = useRef<InitiativeDetail | null>(null);

  // ── Env Links
  const [envChanges, setEnvChanges] = useState<EnvChange[]>([]);
  const [linkedEnvIds, setLinkedEnvIds] = useState<Set<string>>(new Set());
  const [envLinksLoading, setEnvLinksLoading] = useState(false);
  const [envLinksSaving, setEnvLinksSaving] = useState(false);
  const [envSearch, setEnvSearch] = useState('');
  const [envLinksModalOpen, setEnvLinksModalOpen] = useState(false);
  // draft selection inside the modal (discarded on Cancel)
  const [draftLinkedIds, setDraftLinkedIds] = useState<Set<string>>(new Set());

  // ── Initiative Links (initiative-to-initiative)
  const [linkedInitiativeIds, setLinkedInitiativeIds] = useState<Set<string>>(new Set());
  const [iLinksLoading, setILinksLoading] = useState(false);
  const [iLinksSaving, setILinksSaving] = useState(false);
  const [iLinksModalOpen, setILinksModalOpen] = useState(false);
  const [iLinksSearch, setILinksSearch] = useState('');
  const [draftLinkedInitiativeIds, setDraftLinkedInitiativeIds] = useState<Set<string>>(new Set());

  // -- Load initiatives for an organization
  const [orgInitiatives, setOrgInitiatives] = useState<Initiative[]>([]);
  const [orgInitiativesLoading, setOrgInitiativesLoading] = useState(false);

  // ── Modals
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [strategySubmitting, setStrategySubmitting] = useState(false);
  const [initiativeSubmitting, setInitiativeSubmitting] = useState(false);
  const [newStrategy, setNewStrategy] = useState({ title: '', timeframe: '' });
  const [newInitiative, setNewInitiative] = useState({ name: '' });

  // ── Rename/delete initiative
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);


  // ── Load strategies
  const loadStrategies = useCallback(async () => {
    if (!teamId || !organizationId) return;
    setStrategiesLoading(true);
    try {
      const r = await useAdminApi.getStrategiesByTeam(organizationId, organization.userId!, teamId);
      const raw: any[] = Array.isArray(r) ? r : (r?.strategies ?? []);
      setStrategies(raw.map((s: any) => ({
        strategyId: s.strategyId,
        teamId: s.teamId,
        organizationId: s.organizationId,
        title: s.strategyName ?? s.title ?? '(untitled)',
        timeframe: s.strategyTimeframe ?? s.timeframe ?? '',
        status: s.status,
      })));
    } catch (e: any) {
      toast.error(`Could not load strategies: ${e.message || 'Unknown error'}`);
      setStrategies([]);
    }
    setStrategiesLoading(false);
  }, [teamId, organizationId]);

  useEffect(() => { loadStrategies(); }, [loadStrategies]);

  // ── Load initiatives
  const loadInitiatives = useCallback(async (strategy: Strategy) => {
    setLoadingInitiativeIds(prev => new Set(prev).add(strategy.strategyId));
    try {
      const r = await useAdminApi.getInitiativesByStrategy(
        strategy.strategyId, strategy.teamId, strategy.organizationId, organization.userId!
      );
      const list: Initiative[] = Array.isArray(r) ? r : (r?.initiatives ?? r?.items ?? []);
      setInitiativesByStrategy(prev => ({ ...prev, [strategy.strategyId]: list }));
      setInitiatives(list); // keep legacy state for board view
    } catch (e: any) {
      toast.error(`Could not load initiatives: ${e.message || 'Unknown error'}`);
      setInitiativesByStrategy(prev => ({ ...prev, [strategy.strategyId]: [] }));
      setInitiatives([]);
    }
    setLoadingInitiativeIds(prev => { const s = new Set(prev); s.delete(strategy.strategyId); return s; });
  }, []);

  const toggleStrategy = (s: Strategy) => {
    setExpandedStrategyIds(prev => {
      const next = new Set(prev);
      if (next.has(s.strategyId)) {
        next.delete(s.strategyId);
      } else {
        next.add(s.strategyId);
        if (!initiativesByStrategy[s.strategyId]) {
          loadInitiatives(s);
        }
      }
      return next;
    });
  };

  const selectStrategy = (s: Strategy) => {
    setSelectedStrategy(s);
    setSelectedInitiative(null);
    setDetail(null);
    setInitiatives(initiativesByStrategy[s.strategyId] ?? []);
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
      const r = await useAdminApi.getInitiativeById(initiative.initiativeId, initiative.organizationId, organization.userId!);
      const entity = r?.data ?? r;
      const allItems: any[] = entity?.allItems ?? [];
      const parsed: InitiativeDetail = {
        initiativeId: initiative.initiativeId,
        initiativeName: initiative.initiativeName,
        organizationId: initiative.organizationId,
        items: {
          DIAGNOSTIC: mapServerItems(allItems.filter((i: any) => i.step === 'DIAGNOSTIC')),
          OVERALLAPPROACH: mapServerItems(allItems.filter((i: any) => i.step === 'OVERALLAPPROACH')),
          COHERENTACTION: mapServerItems(allItems.filter((i: any) => i.step === 'COHERENTACTION')),
          PROXIMATEOBJECTIVE: mapServerItems(allItems.filter((i: any) => i.step === 'PROXIMATEOBJECTIVE')),
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
    setLinkedEnvIds(new Set());
    setEnvChanges([]);
    setLinkedInitiativeIds(new Set());
    loadDetail(i);
    loadEnvLinks(i);
    loadInitiativeLinks(i);
    loadOrgInitiatives();
  };

  // ── Item helpers
  const stableSid = organization.sid ?? crypto.randomUUID();
  const userId = organization.adminId ?? '0000';
  const sid = stableSid;

  // ── Env links helpers
  const loadEnvLinks = useCallback(async (initiative: Initiative) => {
    setEnvLinksLoading(true);
    const orgId = initiative.organizationId || organizationId;

    try {
      const [changesRaw, linksRaw] = await Promise.all([
        useAdminApi.getEnvironmentalChangesForTeam(initiative.teamId, orgId, organization.userId!),
        useAdminApi.getEnvLinks(initiative.initiativeId, orgId, organization.userId!),
      ]);

      console.log("[DEBUG] Raw Changes Response:", changesRaw);
      console.log("[DEBUG] Raw Links Response:", linksRaw);

      // FIX: The log shows the data is inside .elements
      const rawList = Array.isArray(changesRaw)
        ? changesRaw
        : (changesRaw?.elements ?? changesRaw?.items ?? []);

      console.log("[DEBUG] Extracted List:", rawList);

      const changes: EnvChange[] = rawList.map((c: any) => ({
        // Use environmentalChangeId as seen in your log
        id: c.environmentalChangeId ?? c.id,
        name: c.title ?? c.name ?? 'Untitled',
        category: c.category ?? '',
        status: c.distance ?? c.status ?? '',
      }));

      const linked: string[] = (Array.isArray(linksRaw) ? linksRaw : [])
        .map((l: any) => (typeof l === 'string' ? l : (l.environmentalChangeId ?? l.id)));

      console.log("[DEBUG] Final Processed Changes:", changes);
      console.log("[DEBUG] Final Linked IDs:", linked);

      setEnvChanges(changes);
      setLinkedEnvIds(new Set(linked));
    } catch (e) {
      console.error("Failed to sync environmental links:", e);
    } finally {
      setEnvLinksLoading(false);
    }
  }, [organizationId, organization.userId]);

  const handleSaveEnvLinks = async () => {
    if (!selectedInitiative) return;
    setEnvLinksSaving(true);
    const orgId = selectedInitiative.organizationId || organizationId;
    const links = envChanges
      .filter(c => draftLinkedIds.has(c.id))
      .map(c => ({ id: c.id, name: c.name }));
    try {
      await useAdminApi.updateEnvLinks(selectedInitiative.initiativeId, links, orgId, organization.userId!);
      setLinkedEnvIds(new Set(draftLinkedIds)); // commit draft to real state
      setEnvLinksModalOpen(false);
      toast.success(`${links.length} environmental link${links.length !== 1 ? 's' : ''} saved`);
    } catch (e: any) {
      toast.error(`Could not save env links: ${e.message}`);
    }
    setEnvLinksSaving(false);
  };

  const openEnvLinksModal = () => {
    setDraftLinkedIds(new Set(linkedEnvIds)); // copy current selection into draft
    setEnvSearch('');
    setEnvLinksModalOpen(true);
  };

  const toggleDraftEnvLink = (id: string) =>
    setDraftLinkedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ── Initiative links helpers
  const loadInitiativeLinks = useCallback(async (initiative: Initiative) => {
    setILinksLoading(true);
    const orgId = initiative.organizationId || organizationId;
    try {
      const raw = await useAdminApi.getInitiativeLinks(initiative.initiativeId, orgId, organization.userId!);
      const ids: string[] = (Array.isArray(raw) ? raw : []).map((l: any) => l.id?.toString() ?? l.id);
      setLinkedInitiativeIds(new Set(ids));
    } catch { /* non-fatal */ }
    setILinksLoading(false);
  }, [organizationId]);

  const openILinksModal = () => {
    setDraftLinkedInitiativeIds(new Set(linkedInitiativeIds));
    setILinksSearch('');

    // Fetch all initiatives:
    loadOrgInitiatives();

    setILinksModalOpen(true);
  };

  const toggleDraftILink = (id: string) =>
    setDraftLinkedInitiativeIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleSaveInitiativeLinks = async () => {
    if (!selectedInitiative) return;
    setILinksSaving(true);

    const orgId = selectedInitiative.organizationId || organizationId;

    // CHANGE 'initiatives' TO 'orgInitiatives' HERE
    const links = orgInitiatives
      .filter(i => draftLinkedInitiativeIds.has(i.initiativeId) && i.initiativeId !== selectedInitiative.initiativeId)
      .map(i => ({ id: i.initiativeId, name: i.initiativeName }));

    console.log("[STRADAR] Saving links:", links);

    try {
      await useAdminApi.updateInitiativeLinks(selectedInitiative.initiativeId, links, orgId, organization.userId!);
      setLinkedInitiativeIds(new Set(draftLinkedInitiativeIds));
      setILinksModalOpen(false);
      toast.success(`${links.length} initiative link${links.length !== 1 ? 's' : ''} saved`);
    } catch (e: any) {
      toast.error(`Could not save initiative links: ${e.message}`);
    }
    setILinksSaving(false);
  };

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
        userId, sid, detail.organizationId || organizationId
      );
      toast.success(persisted ? 'Item updated' : 'Item added');
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
      toast.success('Item deleted');
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
        userId, sid, detail.organizationId || organizationId
      );
      if (serverSnapshot.current) {
        serverSnapshot.current.items[step] = serverSnapshot.current.items[step].filter(i => i.itemId !== itemId);
      }
      toast.success('Item deleted');
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
        userId, sid, detail.organizationId || organizationId
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
        organization.userId || '0000', organization.sid!
      );
      toast.success(`Strategy "${newStrategy.title}" created`);
      setStrategyModalOpen(false);
      setNewStrategy({ title: '', timeframe: '' });
      setTimeout(loadStrategies, 1500);
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    setStrategySubmitting(false);
  };

  // ── Rename initiative
  const handleRenameInitiative = async (initiative: Initiative) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === initiative.initiativeName) { setRenamingId(null); return; }
    const prev = initiative.initiativeName;
    setInitiatives(list => list.map(i => i.initiativeId === initiative.initiativeId ? { ...i, initiativeName: trimmed } : i));
    setRenamingId(null);
    try {
      await useAdminApi.changeInitiative(
        initiative.initiativeId,
        { initiativeId: initiative.initiativeId, initiativeName: trimmed, organizationId: initiative.organizationId, status: 'ACTIVE' },
        organization.userId!, organization.sid!
      );
      toast.success('Initiative renamed');
    } catch (e: any) {
      setInitiatives(list => list.map(i => i.initiativeId === initiative.initiativeId ? { ...i, initiativeName: prev } : i));
      toast.error(`Could not rename initiative: ${e.message}`);
    }
  };

  // ── Delete initiative
  const handleDeleteInitiative = async (initiative: Initiative) => {
    setDeletingId(initiative.initiativeId);
    const snapshot = initiatives;
    setInitiatives(list => list.filter(i => i.initiativeId !== initiative.initiativeId));
    try {
      await useAdminApi.changeInitiative(
        initiative.initiativeId,
        { initiativeId: initiative.initiativeId, initiativeName: initiative.initiativeName, organizationId: initiative.organizationId, status: 'DELETED' },
        organization.userId!, organization.sid!
      );
      toast.success('Initiative deleted');
    } catch (e: any) {
      setInitiatives(snapshot);
      toast.error(`Could not delete initiative: ${e.message}`);
    }
    setDeletingId(null);
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
        organization.userId || '0000', organization.sid!
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
          <EmptyState icon={<TrendingUp className="w-8 h-8 opacity-20" />} message="No team selected. Open Strategy from within a team panel." />
        </div>
      </div>
    );
  }

  // ── Status pill variant
  const statusVariant = (s?: string): 'default' | 'primary' | 'success' | 'warning' | 'destructive' => {
    if (!s) return 'default';
    const low = s.toLowerCase();
    if (low === 'active') return 'success';
    if (low === 'draft') return 'warning';
    if (low === 'archived' || low === 'deleted') return 'destructive';
    return 'primary';
  };

  // ── Determine current view
  const view: 'list' | 'board' = selectedInitiative ? 'board' : 'list';

  const loadOrgInitiatives = useCallback(async () => {
    if (!organizationId) return;
    setOrgInitiativesLoading(true);
    try {
      const res = await useAdminApi.getInitiativesByOrganization(organizationId, organization.userId!);

      // Use 'res.items' because OrganizationInitiativeListResponse has organizationId and items field
      const list = res?.items || (Array.isArray(res) ? res : []);

      setOrgInitiatives(list);
    } catch (e) {
      console.error("Linker Load Error:", e);
    } finally {
      setOrgInitiativesLoading(false);
    }
  }, [organizationId, organization.userId]);

  // ── Render
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="organization" />
      <div className="flex-1 flex min-h-0">
        <OrgSidebar activeTeamId={teamId} activePage="strategy" />
        <div className="flex-1 flex flex-col min-w-0">

          {/* ── Top bar ── */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {view === 'board' && (
                  <button
                    onClick={() => backToStrategies()}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Strategies</span>
                  </button>
                )}
                {view === 'board' && selectedStrategy && selectedInitiative && (
                  <>
                    <div className="w-px h-5 bg-border" />
                    <StrategyBreadcrumb
                      teamName={teamName}
                      strategyTitle={selectedStrategy.title}
                      initiativeName={selectedInitiative.initiativeName}
                      onBackToStrategies={backToStrategies}
                      onBackToInitiatives={backToInitiatives}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {view === 'list' && (
                  <button
                    onClick={() => setStrategyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold text-xs hover:opacity-90 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Strategy
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
            <div className="px-6 py-6">

              {/* ── STRATEGIES + INITIATIVES (accordion list) ── */}
              {view === 'list' && (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategies</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {teamName} · {strategies.length} strateg{strategies.length === 1 ? 'y' : 'ies'}
                    </p>
                  </div>

                  {strategiesLoading ? (
                    <EmptyState icon={<Loader2 className="w-6 h-6 animate-spin opacity-30" />} message="Loading strategies…" />
                  ) : strategies.length === 0 ? (
                    <EmptyState icon={<TrendingUp className="w-8 h-8 opacity-30" />} message="No strategies yet. Create one to get started." />
                  ) : (
                    <div className="space-y-3">
                      {strategies.map(s => {
                        const isExpanded = expandedStrategyIds.has(s.strategyId);
                        const sInitiatives = initiativesByStrategy[s.strategyId] ?? [];
                        const isLoadingInit = loadingInitiativeIds.has(s.strategyId);

                        return (
                          <div
                            key={s.strategyId}
                            className={`rounded-xl border transition-all overflow-hidden ${isExpanded
                              ? 'border-primary/30 bg-card shadow-md'
                              : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
                              }`}
                          >
                            {/* Strategy header row */}
                            <button
                              onClick={() => toggleStrategy(s)}
                              className="w-full flex items-center gap-4 px-5 py-4 text-left group"
                            >
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                <TrendingUp className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-0.5">
                                  <h3 className="font-semibold text-foreground truncate">{s.title}</h3>
                                  {s.status && <Pill variant={statusVariant(s.status)}>{s.status}</Pill>}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.timeframe}</span>
                                  {initiativesByStrategy[s.strategyId] && (
                                    <span className="flex items-center gap-1">
                                      <Flag className="w-3 h-3" />
                                      {sInitiatives.length} initiative{sInitiatives.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''
                                }`} />
                            </button>

                            {/* Expanded initiatives */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-border bg-muted/20 px-5 py-4">
                                    {isLoadingInit ? (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading initiatives…
                                      </div>
                                    ) : sInitiatives.length === 0 ? (
                                      <p className="text-sm text-muted-foreground/50 italic py-2">No initiatives yet</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {sInitiatives.map(i => (
                                          <div
                                            key={i.initiativeId}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-background transition-colors"
                                          >
                                            {renamingId === i.initiativeId ? (
                                              <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                                <LayoutGrid className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                <input
                                                  autoFocus
                                                  className="flex-1 bg-transparent border-b border-primary text-sm font-medium text-foreground outline-none min-w-0"
                                                  value={renameValue}
                                                  onChange={e => setRenameValue(e.target.value)}
                                                  onKeyDown={e => { if (e.key === 'Enter') handleRenameInitiative(i); if (e.key === 'Escape') setRenamingId(null); }}
                                                />
                                                <button onClick={() => handleRenameInitiative(i)} className="text-primary hover:opacity-70"><Check className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setRenamingId(null)} className="text-muted-foreground hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
                                              </div>
                                            ) : (
                                              <>
                                                <button
                                                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                                                  onClick={() => {
                                                    setSelectedStrategy(s);
                                                    setInitiatives(sInitiatives);
                                                    selectInitiative(i);
                                                  }}
                                                >
                                                  <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                  <span className="text-sm font-medium text-foreground truncate">{i.initiativeName}</span>
                                                </button>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                  <button
                                                    onClick={e => { e.stopPropagation(); setRenamingId(i.initiativeId); setRenameValue(i.initiativeName); }}
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Rename"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={e => { e.stopPropagation(); handleDeleteInitiative(i); }}
                                                    disabled={deletingId === i.initiativeId}
                                                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                                                    title="Delete"
                                                  >
                                                    {deletingId === i.initiativeId
                                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                                      : <Trash2 className="w-3 h-3" />}
                                                  </button>
                                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-1" />
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Add initiative button */}
                                    <button
                                      onClick={() => { setSelectedStrategy(s); setInitiativeModalOpen(true); }}
                                      className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5"
                                    >
                                      <Plus className="w-3 h-3" /> Add initiative
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
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
                      </div>

                      {/* ── Links row ── */}
                      <div className="mb-5 rounded-lg border border-border bg-muted/20 divide-y divide-border overflow-hidden">
                        {/* Environmental changes */}
                        <div className="flex items-center gap-3 px-3 py-2 min-h-[36px]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[130px] flex-shrink-0">
                            Env Changes
                          </span>
                          <button
                            onClick={openEnvLinksModal}
                            disabled={envLinksLoading}
                            title="Edit environmental change links"
                            className="w-6 h-6 flex-shrink-0 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                          >
                            {envLinksLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link className="w-3 h-3" />}
                          </button>
                          <div className="flex flex-wrap gap-1.5 min-w-0">
                            {envChanges.filter(c => linkedEnvIds.has(c.id)).map(c => (
                              <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20 whitespace-nowrap">
                                {c.name || c.id.slice(0, 8)}
                              </span>
                            ))}
                            {linkedEnvIds.size === 0 && !envLinksLoading && (
                              <span className="text-[11px] text-muted-foreground/30 italic">none linked</span>
                            )}
                          </div>
                        </div>
                        {/* Related initiatives */}
                        <div className="flex items-center gap-3 px-3 py-2 min-h-[36px]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[130px] flex-shrink-0">
                            Related Initiatives
                          </span>
                          <button
                            onClick={openILinksModal}
                            disabled={iLinksLoading}
                            title="Edit initiative links"
                            className="w-6 h-6 flex-shrink-0 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-500 transition-all"
                          >
                            {iLinksLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link className="w-3 h-3" />}
                          </button>
                          <div className="flex flex-wrap gap-1.5 min-w-0">
                            {orgInitiatives.filter(i => linkedInitiativeIds.has(i.initiativeId)).map(i => (
                              <span key={i.initiativeId} className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium border border-amber-500/20 whitespace-nowrap">
                                {i.initiativeName}
                              </span>
                            ))}
                            {linkedInitiativeIds.size === 0 && !iLinksLoading && (
                              <span className="text-[11px] text-muted-foreground/30 italic">none linked</span>
                            )}
                          </div>
                        </div>
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
          {/* ── Env Links Selector Modal ── */}
          <Dialog open={envLinksModalOpen} onOpenChange={v => !v && setEnvLinksModalOpen(false)}>
            <DialogContent className="max-w-4xl w-full bg-card border-border rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold">Select Environmental Changes</DialogTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter changes…"
                        value={envSearch}
                        onChange={e => setEnvSearch(e.target.value)}
                        className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-none focus:border-primary/50 w-52 transition-colors"
                        autoFocus
                      />
                    </div>
                    {draftLinkedIds.size > 0 && (
                      <span className="text-[11px] font-semibold text-primary">{draftLinkedIds.size} selected</span>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* 4-quadrant grid */}
              <div className="grid grid-cols-2 xl:grid-cols-4 divide-x divide-border min-h-[320px] max-h-[55vh] overflow-y-auto">
                {ENV_QUADRANTS.map(quad => {
                  const q = envSearch.trim().toLowerCase();
                  const items = envChanges
                    .filter(c => c.category === quad.key)
                    .filter(c => c.status !== 'RESPONDED' || draftLinkedIds.has(c.id))
                    .filter(c => !q || c.name.toLowerCase().includes(q));
                  return (
                    <div key={quad.key} className="p-4 border-b border-border xl:border-b-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        {quad.label}
                        {items.length > 0 && (
                          <span className="ml-1.5 opacity-50">({items.length})</span>
                        )}
                      </div>
                      {items.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/35 italic">None</p>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {items.map(c => {
                            const selected = draftLinkedIds.has(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleDraftEnvLink(c.id)}
                                className={`flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg text-xs font-medium transition-all ${selected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                  }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                  }`}>
                                  {selected && <Check className="w-2 h-2 text-primary-foreground" />}
                                </span>
                                <span className="truncate">{c.name || c.id.slice(0, 8)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setEnvLinksModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEnvLinks}
                  disabled={envLinksSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {envLinksSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save {draftLinkedIds.size > 0 ? `(${draftLinkedIds.size})` : ''}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ── Initiative Links Selector Modal ── */}
          <Dialog open={iLinksModalOpen} onOpenChange={v => !v && setILinksModalOpen(false)}>
            <DialogContent className="max-w-lg w-full bg-card border-border rounded-2xl p-0 overflow-hidden text-foreground">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold">Link Initiatives</DialogTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search initiatives…"
                        value={iLinksSearch}
                        onChange={e => setILinksSearch(e.target.value)}
                        className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-none focus:border-primary/50 w-48 transition-colors"
                        autoFocus
                      />
                    </div>
                    {draftLinkedInitiativeIds.size > 0 && (
                      <span className="text-[11px] font-semibold text-primary">{draftLinkedInitiativeIds.size} selected</span>
                    )}
                  </div>
                </div>
                {/* Fixes the 'Missing Description' accessibility warning */}
                <DialogDescription className="sr-only">
                  Search and select initiatives from across the entire organization to link them.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
                {/* Show a loader if the organization-wide data is still fetching */}
                {orgInitiativesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                    <p className="text-xs text-muted-foreground animate-pulse">Loading initiatives...</p>
                  </div>
                ) : (
                  <>
                    {orgInitiatives
                      .filter(i => i.initiativeId !== selectedInitiative?.initiativeId)
                      .filter(i => !iLinksSearch.trim() || i.initiativeName.toLowerCase().includes(iLinksSearch.trim().toLowerCase()))
                      .map(i => {
                        const selected = draftLinkedInitiativeIds.has(i.initiativeId);
                        return (
                          <button
                            key={i.initiativeId}
                            onClick={() => toggleDraftILink(i.initiativeId)}
                            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selected
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              }`}
                          >
                            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                              }`}>
                              {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                            </span>
                            <div className="flex flex-col">
                              <span>{i.initiativeName}</span>
                            </div>
                          </button>
                        );
                      })}

                    {/* Empty State: Shows if the list is empty OR all items were filtered out */}
                    {orgInitiatives.filter(i => i.initiativeId !== selectedInitiative?.initiativeId).length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-xs text-muted-foreground/40 italic">
                          No other initiatives found in this organization.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
                <button
                  onClick={() => setILinksModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInitiativeLinks}
                  disabled={iLinksSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {iLinksSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save {draftLinkedInitiativeIds.size > 0 ? `(${draftLinkedInitiativeIds.size})` : ''}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
