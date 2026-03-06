import { ChevronRight, TrendingUp, Flag, LayoutGrid } from 'lucide-react';

interface BreadcrumbProps {
  teamName: string;
  strategyTitle?: string;
  initiativeName?: string;
  onBackToStrategies: () => void;
  onBackToInitiatives: () => void;
}

export default function StrategyBreadcrumb({
  teamName,
  strategyTitle,
  initiativeName,
  onBackToStrategies,
  onBackToInitiatives,
}: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <button
        onClick={onBackToStrategies}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${!strategyTitle ? 'text-foreground font-semibold' : 'hover:text-foreground hover:bg-muted/40'
          }`}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        Strategies
      </button>

      {strategyTitle && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <button
            onClick={onBackToInitiatives}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors truncate max-w-[200px] ${!initiativeName ? 'text-foreground font-semibold' : 'hover:text-foreground hover:bg-muted/40'
              }`}
          >
            <Flag className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{strategyTitle}</span>
          </button>
        </>
      )}

      {initiativeName && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="flex items-center gap-1.5 px-2 py-1 text-foreground font-semibold truncate max-w-[200px]">
            <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{initiativeName}</span>
          </span>
        </>
      )}
    </nav>
  );
}
