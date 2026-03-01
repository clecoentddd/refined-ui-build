import type { RadarElement } from '@/context/AppContext';
import { Pencil, Trash2 } from 'lucide-react';
import Pill from '@/components/Pill';

const TB: Record<string, 'destructive' | 'success'> = { THREAT: 'destructive', OPPORTUNITY: 'success' };
const DB: Record<string, 'default' | 'primary' | 'success' | 'warning'> = { DETECTED: 'default', ASSESSING: 'primary', ASSESSED: 'success', RESPONDING: 'warning' };
const IB: Record<string, 'success' | 'warning' | 'destructive'> = { LOW: 'success', MEDIUM: 'warning', HIGH: 'destructive' };

interface Props {
  element: RadarElement;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RadarElementCard({ element: el, onEdit, onDelete }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="font-semibold text-sm leading-snug">{el.title}</div>
        <Pill variant={TB[el.type] || 'default'}>{el.type}</Pill>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2.5">{(el.category || '').replace(/_/g, ' ')}</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Pill variant={DB[el.distance] || 'default'}>{el.distance}</Pill>
        <Pill variant={IB[el.impact] || 'default'}>Impact: {el.impact}</Pill>
        <Pill variant={IB[el.risk] || 'default'}>Risk: {el.risk}</Pill>
      </div>
      {el.assess && <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">{el.assess}</div>}
      <div className="flex gap-1.5">
        <button onClick={onEdit} className="inline-flex items-center gap-1 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all">
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-1 border border-destructive/20 bg-destructive/5 text-destructive px-2.5 py-1 rounded-lg text-[11px] font-medium hover:bg-destructive/10 transition-all">
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  );
}
