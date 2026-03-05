import type { RadarElement } from '@/context/AppContext';
import { Pencil, Trash2, ShieldAlert, Sparkles, Diamond, Circle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMPACT_ICON: Record<string, typeof TrendingUp> = { HIGH: TrendingUp, MEDIUM: Minus, LOW: TrendingDown };
const RISK_LABEL: Record<string, string> = { HIGH: 'High risk', MEDIUM: 'Med risk', LOW: 'Low risk' };
const DISTANCE_LABEL: Record<string, string> = { DETECTED: 'Detected', ASSESSING: 'Assessing', ASSESSED: 'Assessed', RESPONDING: 'Responding' };

interface Props {
  element: RadarElement;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RadarElementCard({ element: el, onEdit, onDelete }: Props) {
  const ImpactIcon = IMPACT_ICON[el.impact] || Minus;
  const isThreat = el.type === 'THREAT';

  return (
    <div className="group relative flex items-center gap-4 px-5 py-3.5 bg-card hover:bg-muted/40 border-b border-border last:border-b-0 transition-colors">
      {/* Type indicator */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
        isThreat ? 'bg-destructive/10' : 'bg-success/10'
      )}>
        {isThreat
          ? <ShieldAlert className="w-4 h-4 text-destructive" />
          : <Sparkles className="w-4 h-4 text-success" />
        }
      </div>

      {/* Title & category */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight truncate">{el.title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {(el.category || '').replace(/_/g, ' ')}
        </div>
      </div>

      {/* Metrics row */}
      <div className="hidden md:flex items-center gap-5 flex-shrink-0">
        {/* Distance / Stage */}
        <div className="text-center min-w-[72px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Stage</div>
          <div className="text-xs font-semibold mt-0.5">{DISTANCE_LABEL[el.distance] || el.distance}</div>
        </div>

        {/* Impact */}
        <div className="text-center min-w-[64px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Impact</div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <ImpactIcon className={cn('w-3.5 h-3.5', el.impact === 'HIGH' ? 'text-destructive' : el.impact === 'MEDIUM' ? 'text-warning' : 'text-success')} />
            <span className="text-xs font-semibold">{el.impact}</span>
          </div>
        </div>

        {/* Risk */}
        <div className="text-center min-w-[64px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk</div>
          <div className={cn(
            'text-xs font-semibold mt-0.5',
            el.risk === 'HIGH' ? 'text-destructive' : el.risk === 'MEDIUM' ? 'text-warning' : 'text-success'
          )}>
            {el.risk}
          </div>
        </div>
      </div>

      {/* Actions — icon-only, appear on hover */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
