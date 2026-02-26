import type { RadarElement } from '@/context/AppContext';
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
    <div className="bg-card border border-border rounded-lg p-3.5 hover:border-primary/30 transition-all shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div className="font-bold text-sm leading-snug">{el.title}</div>
        <Pill variant={TB[el.type] || 'default'}>{el.type}</Pill>
      </div>
      <div className="font-mono text-[10px] text-muted-foreground mb-2">{(el.category || '').replace(/_/g, ' ')}</div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <Pill variant={DB[el.distance] || 'default'}>{el.distance}</Pill>
        <Pill variant={IB[el.impact] || 'default'}>↑ {el.impact}</Pill>
        <Pill variant={IB[el.risk] || 'default'}>⚠ {el.risk}</Pill>
      </div>
      {el.assess && <div className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-2.5">{el.assess}</div>}
      <div className="flex gap-1.5">
        <button onClick={onEdit} className="border border-border-strong bg-card text-muted-foreground hover:text-foreground px-2.5 py-1 rounded text-[11px] font-bold transition-all">Edit</button>
        <button onClick={onDelete} className="border border-destructive/30 bg-destructive/5 text-destructive px-2.5 py-1 rounded text-[11px] font-bold hover:bg-destructive/10 transition-all">Delete</button>
      </div>
    </div>
  );
}
