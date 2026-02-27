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
      const opacity = el.risk === 'HIGH' ? 1 : el.risk === 'MEDIUM' ? 0.7 : 0.45;
      return { ...el, x, y, size: IMPACT_SIZE[el.impact] || 10, opacity, qIndex: q?.index ?? 0 };
    })
  );
  const visible = activeQ !== null ? dots.filter(d => d.qIndex === activeQ) : dots;

  return (
    <div className="flex gap-6 py-5">
      {/* Side controls */}
      <div className="w-[200px] flex-shrink-0 flex flex-col gap-2">
        <div className="font-mono text-[9px] text-muted-foreground/50 tracking-[2px] uppercase mb-1">Quadrant</div>
        {Object.entries(QUADRANTS).map(([key, q]) => (
          <button
            key={key}
            onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
            className={`w-full text-left px-3 py-2 rounded-lg border font-mono text-[11px] transition-all ${
              activeQ === q.index
                ? 'border-foreground/20 text-foreground bg-foreground/5 font-bold'
                : 'border-border bg-card text-muted-foreground hover:border-foreground/10 hover:text-foreground'
            }`}
          >
            {q.label}
          </button>
        ))}
        {activeQ !== null && (
          <button onClick={() => setActiveQ(null)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground font-mono text-[11px] mt-1 hover:text-foreground transition-all">
            <RotateCcw className="w-3 h-3" /> Show All
          </button>
        )}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
          <div className="font-mono text-[9px] text-muted-foreground/50 tracking-[2px] uppercase mb-1">Legend</div>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <svg width="16" height="16"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="2" fill="currentColor" /></svg>
            <span>Opportunity</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <svg width="16" height="16"><circle cx="8" cy="8" r="5" fill="currentColor" opacity="0.8" /></svg>
            <span>Threat</span>
          </div>
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="font-mono text-[9px] text-muted-foreground/50 tracking-[2px] uppercase">Opacity = Risk</div>
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-foreground opacity-100 flex-shrink-0" /><span>High</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-foreground opacity-[0.5] flex-shrink-0" /><span>Medium</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-foreground opacity-[0.25] flex-shrink-0" /><span>Low</span>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredEl ? (
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg mt-4">
            <div className="font-bold text-sm mb-2">{hoveredEl.title}</div>
            {[['Type', hoveredEl.type], ['Category', (hoveredEl.category || '').replace(/_/g, ' ')], ['Distance', hoveredEl.distance], ['Impact', hoveredEl.impact], ['Risk', hoveredEl.risk]].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between gap-2 mb-1 text-[11px]">
                <span className="font-mono text-muted-foreground text-[10px] uppercase tracking-wide">{lbl}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
            {hoveredEl.assess && <div className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">{hoveredEl.assess}</div>}
            <button onClick={() => onEdit(hoveredEl)} className="w-full mt-3 border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all">
              Edit Element
            </button>
          </div>
        ) : (
          <div className="font-mono text-[10px] text-muted-foreground/30 text-center py-6 mt-4">Hover a dot for details</div>
        )}
      </div>

      {/* SVG Radar */}
      <div className="flex-1 min-w-0 overflow-hidden radar-glow">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.02" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${cx},${cy})`}>
            {/* Background glow */}
            <circle r={R} fill="url(#radar-bg)" />

            {/* Concentric rings */}
            {[0.25, 0.5, 0.75, 1].map((r, i) => (
              <circle
                key={r}
                r={R * r}
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeOpacity={r === 1 ? 0.12 : 0.06}
                strokeWidth={r === 1 ? 1.5 : 1}
                strokeDasharray={r < 1 ? '2 4' : 'none'}
              />
            ))}

            {/* Animated pulse ring */}
            <circle r={R * 0.75} fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.04" strokeWidth="20" className="radar-ring-pulse" />

            {/* Cross lines */}
            {[0, 1, 2, 3].map(i => {
              const a = (Math.PI / 2) * i;
              return <line key={i} x1={0} y1={0} x2={R * Math.cos(a)} y2={R * Math.sin(a)} stroke="hsl(var(--foreground))" strokeOpacity="0.06" strokeWidth={1} />;
            })}

            {/* Ring labels */}
            {RING_LABELS.map(({ label, r }) => (
              <text key={label} x={8} y={-(R * r) + 4} fill="hsl(var(--muted-foreground))" fillOpacity="0.5" fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing={2}>{label}</text>
            ))}

            {/* Quadrant labels */}
            {Object.entries(QUADRANTS).map(([key, q]) => {
              const a = (Math.PI / 2) * q.index + Math.PI / 4;
              return (
                <text
                  key={key}
                  x={(R + 40) * Math.cos(a)}
                  y={(R + 40) * Math.sin(a)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fill={activeQ === q.index ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                  fillOpacity={activeQ === q.index ? 1 : 0.6}
                  className="cursor-pointer select-none"
                  onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
                  style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                  {q.label}
                </text>
              );
            })}

            {/* Element dots */}
            {visible.map((dot, i) => (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredEl(dot)} onMouseLeave={() => setHoveredEl(null)} filter={hoveredEl?.radarElementId === dot.radarElementId ? 'url(#glow)' : undefined}>
                {dot.type === 'OPPORTUNITY' ? (
                  <>
                    <circle cx={dot.x} cy={dot.y} r={dot.size} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1.5} opacity={dot.opacity} />
                    <circle cx={dot.x} cy={dot.y} r={dot.size * 0.4} fill="hsl(var(--foreground))" opacity={dot.opacity} />
                  </>
                ) : (
                  <circle cx={dot.x} cy={dot.y} r={dot.size} fill="hsl(var(--foreground))" opacity={dot.opacity} />
                )}
                {/* Hover ring */}
                {hoveredEl?.radarElementId === dot.radarElementId && (
                  <circle cx={dot.x} cy={dot.y} r={dot.size + 5} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1} opacity={0.3} />
                )}
              </g>
            ))}

            {/* Center dot */}
            <circle r={3} fill="hsl(var(--foreground))" opacity={0.2} />
          </g>
        </svg>
      </div>
    </div>
  );
}
