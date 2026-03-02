import { useState, useEffect, useRef } from 'react';
import { Circle, Loader2, Trash2 } from 'lucide-react';

export interface StrategyItem {
  itemId: string;
  content: string;
  status: string;
}

interface ItemRowProps {
  item: StrategyItem;
  saving: boolean;
  onSave: (itemId: string, content: string) => void;
  onDelete: (itemId: string) => void;
}

export default function ItemRow({ item, saving, onSave, onDelete }: ItemRowProps) {
  const [draft, setDraft] = useState(item.content);
  const prevContent = useRef(item.content);

  useEffect(() => {
    if (!saving) {
      setDraft(item.content);
      prevContent.current = item.content;
    }
  }, [item.content, saving]);

  const handleBlur = () => {
    const trimmed = draft.trim();
    if (trimmed === prevContent.current) return;
    prevContent.current = trimmed;
    onSave(item.itemId, trimmed);
  };

  return (
    <div className="group flex items-start gap-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 px-3 py-2.5 transition-all">
      <Circle className="w-3 h-3 mt-[6px] flex-shrink-0 text-muted-foreground/40" />
      <textarea
        className="flex-1 text-sm leading-relaxed bg-transparent border-0 resize-none outline-none text-foreground placeholder:text-muted-foreground/40 transition-colors min-h-[1.5rem]"
        rows={1}
        value={draft}
        onChange={e => {
          setDraft(e.target.value);
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
        placeholder="Type something…"
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
