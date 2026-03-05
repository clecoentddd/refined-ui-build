import { Plus } from 'lucide-react';
import ItemRow, { type StrategyItem } from './ItemRow';

export type StepKey = 'DIAGNOSTIC' | 'OVERALLAPPROACH' | 'COHERENTACTION' | 'PROXIMATEOBJECTIVE';

export interface StepConfig {
  key: StepKey;
  label: string;
  subtitle: string;
  icon: string;
  accentClass: string;
}

export const STEPS: StepConfig[] = [
  {
    key: 'DIAGNOSTIC',
    label: 'The Diagnosis',
    subtitle: 'What is the core challenge?',
    icon: '1',
    accentClass: 'border-t-primary/60',
  },
  {
    key: 'OVERALLAPPROACH',
    label: 'Guiding Policy',
    subtitle: 'How do we approach it?',
    icon: '2',
    accentClass: 'border-t-primary/60',
  },
  {
    key: 'COHERENTACTION',
    label: 'Coherent Actions',
    subtitle: 'What combined actions can we take?',
    icon: '3',
    accentClass: 'border-t-primary/60',
  },
  {
    key: 'PROXIMATEOBJECTIVE',
    label: 'Proximate Objectives',
    subtitle: 'Measurable near-term goals',
    icon: '4',
    accentClass: 'border-t-primary/60',
  },
];

interface StepColumnProps {
  step: StepConfig;
  items: StrategyItem[];
  savingIds: Set<string>;
  onSaveItem: (step: StepKey, itemId: string, content: string) => void;
  onDeleteItem: (step: StepKey, itemId: string) => void;
  onAddItem: (step: StepKey) => void;
}

export default function StepColumn({ step, items, savingIds, onSaveItem, onDeleteItem, onAddItem }: StepColumnProps) {
  return (
    <div className={`flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden border-t-[3px] ${step.accentClass}`}>
      {/* Column header */}
      <div className="px-4 pt-4 pb-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {step.icon}
          </span>
          <span className="font-semibold text-sm text-foreground">{step.label}</span>
        </div>
        <p className="text-xs text-muted-foreground pl-8">{step.subtitle}</p>
        <div className="mt-2 ml-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background rounded-md px-2 py-0.5 border border-border">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Items */}
      <div data-step={step.key} className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground/50 italic py-6 text-center">No items yet</p>
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
      <div className="px-4 pb-3 pt-2 border-t border-border/50">
        <button
          onClick={() => onAddItem(step.key)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg py-2 transition-all border border-dashed border-border hover:border-foreground/20"
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      </div>
    </div>
  );
}
