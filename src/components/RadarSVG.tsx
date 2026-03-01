import { useState } from 'react';
import type { RadarElement } from '@/context/AppContext';
import { RotateCcw } from 'lucide-react';

const QUADRANTS: Record<string, { index: number; label: string }> = {
  BUSINESS: { index: 0, label: 'Business' },
  CAPABILITIES: { index: 1, label: 'Capabilities' },
  OPERATING_MODEL: { index: 2, label: 'Operating Model' },
  PEOPLE_KNOWLEDGE: { index: 3, label: 'People & Knowledge' },
};

const RINGS: Record<string, number> = { DETECTED: 0.88, ASSESSING: 0.63, ASSESSED: 0.4, RESPONDING: 0.2 };
const RING_LABELS = [
  { label: 'DETECT', r: 0.88 },
  { label: 'ASSESS', r: 0.63 },
  { label: 'RESPOND', r: 0.38 },
];
const IMPACT_SIZE: Record<string, number> = { LOW: 7, MEDIUM: 11, HIGH: 15 };

const RISK_COLOR: Record<string, string> = {
  HIGH: 'var(--radar-high)',
  MEDIUM: 'var(--radar-medium)',
  LOW: 'var(--radar-low)',
};

const TYPE_COLOR: Record<string, string> = {
  THREAT: 'var(--radar-threat)',
  OPPORTUNITY: 'var(--radar-opportunity)',
};

function cartesian(qIndex: number, ring: number, idx: number, total: number, R: number) {
  const start = (Math.PI / 2) * qIndex;
  const step = (Math.PI / 2) / (total + 1);
  const angle = start + step * (idx + 1);
  return { x: R * ring * Math.cos(angle), y: R * ring * Math.sin(angle) };
}

interface Props {
  elements: RadarElement[];
  onEdit: (el: RadarElement) => void;
}

export default function RadarSVG({ elements, onEdit }: Props) {
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [hoveredEl, setHoveredEl] = useState<RadarElement | null>(null);
  const R = 260;
  const size = R * 2 + 180;
  const cx = size / 2;
  const cy = size / 2;

  const groups: Record<string, RadarElement[]> = {};
  for (const el of elements) {
    const key = el.category + '__' + el.distance;
    groups[key] = groups[key] || [];
    groups[key].push(el);
  }
  const dots = Object.values(groups).flatMap(group =>
    group.map((el, i) => {
      const q = QUADRANTS[el.category];
      const ring = RINGS[el.distance] || 0.88;
      const { x, y } = cartesian(q?.index ?? 0, ring, i, group.length, R);
      return { ...el, x, y, size: IMPACT_SIZE[el.impact] || 10, qIndex: q?.index ?? 0 };
    })
  );
  const visible = activeQ !== null ? dots.filter(d => d.qIndex === activeQ) : dots;

  return (
    <div className="flex gap-6 py-5">
      {/* Side controls */}
      <div className="w-[200px] flex-shrink-0 flex flex-col gap-2">
        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mb-1">Quadrant</div>
        {Object.entries(QUADRANTS).map(([key, q]) => (
          <button
            key={key}
            onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${activeQ === q.index ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
          >
            {q.label}
          </button>
        ))}
        {activeQ !== null && (
          <button onClick={() => setActiveQ(null)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground text-[12px] mt-1 hover:text-foreground transition-all">
            <RotateCcw className="w-3 h-3" /> Show All
          </button>
        )}

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-3">
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mb-1">Type</div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded-full bg-radar-opportunity flex-shrink-0" />
            <span>Opportunity</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded-full bg-radar-threat flex-shrink-0" />
            <span>Threat</span>
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mt-2">Risk Level</div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'hsl(var(--radar-high))' }} /><span>High</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'hsl(var(--radar-medium))' }} /><span>Medium</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'hsl(var(--radar-low))' }} /><span>Low</span>
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mt-2">Size = Impact</div>
        </div>

        {/* Tooltip */}
        {hoveredEl ? (
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg mt-4 animate-fade-in">
            <div className="font-semibold text-sm mb-2">{hoveredEl.title}</div>
            {[['Type', hoveredEl.type], ['Category', (hoveredEl.category || '').replace(/_/g, ' ')], ['Distance', hoveredEl.distance], ['Impact', hoveredEl.impact], ['Risk', hoveredEl.risk]].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between gap-2 mb-1 text-[12px]">
                <span className="text-muted-foreground">{lbl}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
            {hoveredEl.assess && <div className="text-[11px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">{hoveredEl.assess}</div>}
            <button onClick={() => onEdit(hoveredEl)} className="w-full mt-3 border border-border bg-background text-foreground hover:bg-muted px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all">
              Edit Element
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/40 text-center py-6 mt-4">Hover a dot for details</div>
        )}
      </div>

      {/* SVG Radar */}
      <div className="flex-1 min-w-0 overflow-hidden radar-glow">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.03" />
              <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.01" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <filter id="glow-green">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-red">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-amber">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g transform={`translate(${cx},${cy})`}>
            {/* Background glow */}
            <circle r={R} fill="url(#radar-bg)" />

            {/* Concentric rings */}
            {[0.25, 0.5, 0.75, 1].map((r) => (
              <circle
                key={r}
                r={R * r}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeOpacity={r === 1 ? 0.15 : 0.08}
                strokeWidth={r === 1 ? 1.5 : 1}
                strokeDasharray={r < 1 ? '3 6' : 'none'}
              />
            ))}

            {/* Animated pulse ring */}
            <circle r={R * 0.75} fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.05" strokeWidth="24" className="radar-ring-pulse" />

            {/* Cross lines */}
            {[0, 1, 2, 3].map(i => {
              const a = (Math.PI / 2) * i;
              return <line key={i} x1={0} y1={0} x2={R * Math.cos(a)} y2={R * Math.sin(a)} stroke="hsl(var(--primary))" strokeOpacity="0.08" strokeWidth={1} />;
            })}

            {/* Ring labels */}
            {RING_LABELS.map(({ label, r }) => (
              <text key={label} x={10} y={-(R * r) + 4} fill="hsl(var(--muted-foreground))" fillOpacity="0.5" fontSize={10} fontFamily="'Inter', sans-serif" fontWeight={600} letterSpacing={1.5}>{label}</text>
            ))}

            {/* Quadrant labels */}
            {Object.entries(QUADRANTS).map(([key, q]) => {
              const a = (Math.PI / 2) * q.index + Math.PI / 4;
              return (
                <text
                  key={key}
                  x={(R + 45) * Math.cos(a)}
                  y={(R + 45) * Math.sin(a)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="'Inter', sans-serif"
                  fill={activeQ === q.index ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  fillOpacity={activeQ === q.index ? 1 : 0.6}
                  className="cursor-pointer select-none"
                  onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
                  style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
                >
                  {q.label}
                </text>
              );
            })}

            {/* Element dots */}
            {visible.map((dot, i) => {
              const typeColor = `hsl(${TYPE_COLOR[dot.type] || TYPE_COLOR.THREAT})`;
              const riskColor = `hsl(${RISK_COLOR[dot.risk] || RISK_COLOR.LOW})`;
              const isHovered = hoveredEl?.environmentalChangeId === dot.environmentalChangeId;
              const glowFilter = dot.risk === 'HIGH' ? 'url(#glow-red)' : dot.risk === 'MEDIUM' ? 'url(#glow-amber)' : 'url(#glow-green)';

              return (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredEl(dot)} onMouseLeave={() => setHoveredEl(null)} filter={isHovered ? glowFilter : undefined}>
                  {dot.type === 'OPPORTUNITY' ? (
                    <>
                      <circle cx={dot.x} cy={dot.y} r={dot.size} fill="none" stroke={typeColor} strokeWidth={2} opacity={0.9} />
                      <circle cx={dot.x} cy={dot.y} r={dot.size * 0.45} fill={typeColor} opacity={0.9} />
                    </>
                  ) : (
                    <circle cx={dot.x} cy={dot.y} r={dot.size} fill={typeColor} opacity={0.85} />
                  )}
                  {/* Risk ring indicator */}
                  <circle cx={dot.x} cy={dot.y} r={dot.size + 3} fill="none" stroke={riskColor} strokeWidth={1.5} opacity={0.5} strokeDasharray="2 2" />
                  {/* Hover ring */}
                  {isHovered && (
                    <circle cx={dot.x} cy={dot.y} r={dot.size + 8} fill="none" stroke={typeColor} strokeWidth={1.5} opacity={0.4} />
                  )}
                </g>
              );
            })}

            {/* Center dot */}
            <circle r={4} fill="hsl(var(--primary))" opacity={0.3} />
            <circle r={1.5} fill="hsl(var(--primary))" opacity={0.6} />
          </g>
        </svg>
      </div>
    </div>
  );
}
