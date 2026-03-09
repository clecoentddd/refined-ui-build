import { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevContent = useRef(item.content);

  // 1. Logic to auto-resize the textarea height based on content
  const adjustHeight = () => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    }
  };

  // Adjust height on initial mount and when content changes
  useLayoutEffect(() => {
    adjustHeight();
  }, [item.content]);

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
    <div className="group flex items-start gap-2 rounded-md border border-transparent hover:border-border/50 hover:bg-primary/5 px-2 py-1.5 transition-all">
      {/* Minimalist dot indicator */}
      <div className="mt-2 flex-shrink-0">
        <Circle className={`w-2 h-2 ${saving ? 'animate-pulse text-primary' : 'text-primary/30'}`} fill="currentColor" />
      </div>

      <textarea
        ref={textareaRef}
        className="flex-1 text-[13px] leading-snug bg-transparent border-0 resize-none outline-none text-foreground placeholder:text-muted-foreground/30 transition-colors min-h-[1.2rem] py-0.5 overflow-hidden"
        rows={1}
        value={draft}
        onChange={e => {
          setDraft(e.target.value);
          adjustHeight();
        }}
        onBlur={handleBlur}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            textareaRef.current?.blur();
          }
        }}
        placeholder="Describe strategy..."
      />

      <div className="flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0">
        {saving ? (
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
        ) : (
          <button
            onClick={() => onDelete(item.itemId)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-primary transition-all p-1"
            title="Delete item"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}