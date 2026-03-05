import { useState, useRef } from 'react';
import type { RadarElement } from '@/context/AppContext';
import { RotateCcw, X } from 'lucide-react';

// =============================================================================
// CONFIGURATION — the single source of truth for all geometry and appearance.
// Every label, position, zoom, and dot placement derives from these tables.
// =============================================================================

/**
 * Each quadrant has:
 *   geom  — the angular slot (0–3).  Slot N occupies the arc from N*90° to (N+1)*90°
 *           measured from the positive-X axis (standard math convention).
 *           Because SVG Y grows *downward*, the screen positions are:
 *             geom 0 → angle   0°– 90° → screen bottom-right
 *             geom 1 → angle  90°–180° → screen bottom-left
 *             geom 2 → angle 180°–270° → screen top-left
 *             geom 3 → angle 270°–360° → screen top-right
 *   label — display string
 */
const QUADRANTS: Record<string, { geom: number; label: string }> = {
  PEOPLE_KNOWLEDGE: { geom: 3, label: 'People & Knowledge' }, // top-right
  OPERATING_MODEL: { geom: 2, label: 'Operating Model' }, // top-left
  BUSINESS: { geom: 1, label: 'Business' }, // bottom-left
  CAPABILITIES: { geom: 0, label: 'Capabilities' }, // bottom-right
};

/**
 * Ring fractional radii (0–1, relative to R).
 * DETECTED = 1.0 so those dots sit right on the outer border.
 * The dashed concentric circles are drawn at exactly these fractions.
 */
const RINGS: Record<string, number> = {
  DETECTED: 1.00,
  ASSESSING: 0.72,
  ASSESSED: 0.48,
  RESPONDING: 0.26,
};

/**
 * Ring label text + the fractional radius it sits on.
 * Must match RINGS values so labels align with the dashed circles.
 */
const RING_LABELS: { label: string; r: number }[] = [
  { label: 'DETECT', r: RINGS.DETECTED },
  { label: 'ASSESS', r: RINGS.ASSESSING },
  { label: 'RESPOND', r: RINGS.ASSESSED },
  { label: 'ACT', r: RINGS.RESPONDING },
];

/** Dot radius (SVG units) per impact level */
const IMPACT_SIZE: Record<string, number> = { LOW: 6, MEDIUM: 9, HIGH: 13 };

/** Fill color per risk level */
const RISK_FILL: Record<string, string> = {
  HIGH: 'hsl(var(--radar-high))',
  MEDIUM: 'hsl(var(--radar-medium))',
  LOW: 'hsl(var(--radar-low))',
};

// =============================================================================
// GEOMETRY HELPERS
// =============================================================================

/**
 * Convert (quadrant slot, ring fraction, slot index, total in slot) → SVG {x,y}.
 * Dots are spread evenly across the 90° arc, with a small margin from the
 * separator lines and a tiny deterministic jitter for an organic feel.
 */
function cartesian(
  geom: number,
  ring: number,
  slotIndex: number,
  totalSlots: number,
  R: number,
): { x: number; y: number } {
  const marginDeg = 8;
  const marginRad = (marginDeg * Math.PI) / 180;
  const arcStart = (Math.PI / 2) * geom + marginRad;
  const arcSpan = Math.PI / 2 - 2 * marginRad;
  const step = arcSpan / (totalSlots + 1);
  const angle = arcStart + step * (slotIndex + 1);
  const jitter = ((slotIndex * 7 + geom * 13) % 5 - 2) * 0.015;
  const r = R * ring + ((slotIndex * 11 + geom * 7) % 7 - 3) * 2;
  return { x: r * Math.cos(angle + jitter), y: r * Math.sin(angle + jitter) };
}

/** SVG path for a diamond shape (used for THREAT elements) */
function diamondPath(cx: number, cy: number, size: number): string {
  const s = size * 1.2;
  return `M${cx},${cy - s} L${cx + s},${cy} L${cx},${cy + s} L${cx - s},${cy} Z`;
}

/**
 * Zoom viewBox for a given geom slot.
 * Each slot occupies one quadrant of the SVG coordinate plane:
 *   geom 0 → +x / +y (SVG bottom-right) → viewBox starts at (0, 0)
 *   geom 1 → −x / +y (SVG bottom-left)  → viewBox starts at (−half, 0)
 *   geom 2 → −x / −y (SVG top-left)     → viewBox starts at (−half, −half)
 *   geom 3 → +x / −y (SVG top-right)    → viewBox starts at (0, −half)
 */
function zoomedViewBox(geom: number, R: number, pad: number): string {
  const half = R + pad;
  const size = half; // show one quadrant: half the full width
  switch (geom) {
    case 0: return `0        0        ${size} ${size}`;
    case 1: return `${-half} 0        ${size} ${size}`;
    case 2: return `${-half} ${-half} ${size} ${size}`;
    case 3: return `0        ${-half} ${size} ${size}`;
    default: return `${-(R + pad)} ${-(R + pad)} ${(R + pad) * 2} ${(R + pad) * 2}`;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

interface Props {
  elements: RadarElement[];
  onEdit: (el: RadarElement) => void;
}

export default function RadarSVG({ elements, onEdit }: Props) {
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [selectedEl, setSelectedEl] = useState<RadarElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG dimensions — all downstream values derive from these two constants
  const R = 300;
  const PAD = 80; // clearance outside the circle for quadrant labels

  const fullViewBox = `${-(R + PAD)} ${-(R + PAD)} ${(R + PAD) * 2} ${(R + PAD) * 2}`;
  const activeViewBox = activeQ !== null ? zoomedViewBox(activeQ, R, PAD) : fullViewBox;

  // ── Build dot list ─────────────────────────────────────────────────────────
  const groups: Record<string, RadarElement[]> = {};
  for (const el of elements) {
    const key = `${el.category}__${el.distance}`;
    (groups[key] ??= []).push(el);
  }

  const dots = Object.values(groups).flatMap(group =>
    group.map((el, i) => {
      const q = QUADRANTS[el.category];
      const ring = RINGS[el.distance] ?? RINGS.DETECTED;
      const { x, y } = cartesian(q?.geom ?? 0, ring, i, group.length, R);
      return { ...el, x, y, size: IMPACT_SIZE[el.impact] ?? 8, geom: q?.geom ?? 0 };
    }),
  );

  // When zoomed, only show dots for the active quadrant
  const visible = activeQ !== null ? dots.filter(d => d.geom === activeQ) : dots;

  // ── Quadrant label positions ───────────────────────────────────────────────
  // Labels sit outside the circle at the 45° midpoint of each arc.
  // Because each geom slot starts at geom*90°, the midpoint is geom*90° + 45°.
  const LABEL_R = R + PAD * 0.55;
  const quadrantLabels = Object.entries(QUADRANTS)
    .sort((a, b) => a[1].geom - b[1].geom)
    .map(([key, q]) => {
      const angle = (Math.PI / 2) * q.geom + Math.PI / 4;
      return { key, geom: q.geom, label: q.label, x: LABEL_R * Math.cos(angle), y: LABEL_R * Math.sin(angle) };
    });

  return (
    <div className="flex flex-col lg:flex-row gap-5 py-4">

      {/* ── Radar SVG ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <div className="relative w-full" style={{ maxWidth: (R + PAD) * 2 + 'px' }}>
          <svg
            ref={svgRef}
            viewBox={activeViewBox}
            className="w-full h-auto"
            style={{ transition: 'viewBox 0.4s ease', filter: 'drop-shadow(0 0 40px hsl(var(--primary) / 0.06))' }}
          >
            <defs>
              <radialGradient id="radar-bg-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.06" />
                <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
              </linearGradient>
              <filter id="glow-high" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-med" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <clipPath id="radar-clip"><circle r={R} /></clipPath>
            </defs>

            {/* Background + outer border */}
            <circle r={R} fill="url(#radar-bg-grad)" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeWidth="2" />

            {/* Concentric rings — drawn at exactly the RINGS fractions */}
            {Object.values(RINGS).filter(f => f < 1).map(f => (
              <circle key={f} r={R * f} fill="none" stroke="hsl(var(--primary))"
                strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            {/* Quadrant separator lines (from centre to edge) */}
            {[0, 1, 2, 3].map(i => {
              const a = (Math.PI / 2) * i;
              return (
                <line key={i} x1={0} y1={0} x2={R * Math.cos(a)} y2={R * Math.sin(a)}
                  stroke="hsl(var(--primary))" strokeOpacity="0.12" strokeWidth="1" />
              );
            })}

            {/* Animated sweep */}
            <g clipPath="url(#radar-clip)">
              <g className="animate-radar-sweep" style={{ transformOrigin: '0 0' }}>
                <path d={`M0,0 L${R},0 A${R},${R} 0 0,1 ${R * Math.cos(Math.PI / 6)},${R * Math.sin(Math.PI / 6)} Z`}
                  fill="url(#sweep-grad)" opacity="0.6" />
                <line x1={0} y1={0} x2={R} y2={0}
                  stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="1.5" />
              </g>
            </g>

            {/* Ring labels — centered ON each arc, along the vertical (−Y) axis */}
            {RING_LABELS.map(({ label, r }) => (
              <g key={label}>
                <rect x={-24} y={-(R * r) - 8} width={48} height={16} rx={4}
                  fill="hsl(var(--background))" fillOpacity="0.85" />
                <text x={0} y={-(R * r) + 4}
                  textAnchor="middle"
                  fontSize={9} fontWeight={700} fontFamily="'IBM Plex Mono', monospace"
                  fill="hsl(var(--muted-foreground))" fillOpacity="0.7" letterSpacing="1.5"
                >
                  {label}
                </text>
              </g>
            ))}

            {/* Quadrant labels — outside the circle at each arc midpoint */}
            {quadrantLabels.map(q => {
              const words = q.label.split(' ');
              const mid = Math.ceil(words.length / 2);
              const line1 = words.slice(0, mid).join(' ');
              const line2 = words.length > 1 ? words.slice(mid).join(' ') : null;
              return (
                <text
                  key={q.key} x={q.x} y={q.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight={700} fontFamily="'Inter', sans-serif"
                  fill="hsl(var(--primary))"
                  fillOpacity={activeQ === q.geom ? 1 : 0.55}
                  className="cursor-pointer select-none uppercase"
                  letterSpacing="2"
                  onClick={() => setActiveQ(activeQ === q.geom ? null : q.geom)}
                >
                  {line2 ? (
                    <><tspan x={q.x} dy="-6">{line1}</tspan><tspan x={q.x} dy="14">{line2}</tspan></>
                  ) : (
                    <tspan>{line1}</tspan>
                  )}
                </text>
              );
            })}

            {/* Pulsing ambient rings */}
            {[0.3, 0.55, 0.8].map((f, i) => (
              <circle key={i} r={R * f} fill="none" stroke="hsl(var(--primary))"
                strokeOpacity="0.04" strokeWidth="18"
                className="radar-ring-pulse" style={{ animationDelay: `${i * 1.3}s` }} />
            ))}

            {/* ── Element dots ───────────────────────────────────────────────── */}
            {visible.map((dot, i) => {
              const fill = RISK_FILL[dot.risk] ?? RISK_FILL.LOW;
              const isSelected = selectedEl?.environmentalChangeId === dot.environmentalChangeId;
              const isThreat = dot.type === 'THREAT';
              const glowFilter = dot.risk === 'HIGH' ? 'url(#glow-high)'
                : dot.risk === 'MEDIUM' ? 'url(#glow-med)' : undefined;

              return (
                <g key={dot.environmentalChangeId || i} className="cursor-pointer"
                  onClick={() => setSelectedEl(isSelected ? null : dot)}
                  filter={isSelected ? glowFilter : undefined}
                >
                  {isThreat ? (
                    <path d={diamondPath(dot.x, dot.y, dot.size)} fill={fill} opacity={0.85}
                      stroke={isSelected ? fill : 'none'} strokeWidth={isSelected ? 2 : 0} />
                  ) : (
                    <circle cx={dot.x} cy={dot.y} r={dot.size} fill={fill} opacity={0.85}
                      stroke={isSelected ? fill : 'none'} strokeWidth={isSelected ? 2 : 0} />
                  )}

                  {isSelected && (isThreat ? (
                    <path d={diamondPath(dot.x, dot.y, dot.size + 5)} fill="none" stroke={fill}
                      strokeWidth={1.5} opacity={0.5} strokeDasharray="3 3">
                      <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1.5s" repeatCount="indefinite" />
                    </path>
                  ) : (
                    <circle cx={dot.x} cy={dot.y} r={dot.size + 5} fill="none" stroke={fill}
                      strokeWidth={1.5} opacity={0.5} strokeDasharray="3 3">
                      <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  ))}

                  <text x={dot.x} y={dot.y + dot.size + 13}
                    textAnchor="middle" fontSize={7} fontFamily="'Inter', sans-serif"
                    fontWeight={isSelected ? 700 : 500}
                    fill={isSelected ? fill : 'hsl(var(--muted-foreground))'}
                    fillOpacity={isSelected ? 1 : 0.6}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {dot.title.length > 14 ? dot.title.slice(0, 13) + '…' : dot.title}
                  </text>
                </g>
              );
            })}

            {/* Centre dot */}
            <circle r={5} fill="hsl(var(--primary))" opacity={0.15} />
            <circle r={2} fill="hsl(var(--primary))" opacity={0.4} />
          </svg>
        </div>
      </div>

      {/* ── Side panel ─────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-3">

        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">Quadrant</div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
          {/* Sort buttons by geom so order matches the visual radar */}
          {Object.entries(QUADRANTS)
            .sort((a, b) => a[1].geom - b[1].geom)
            .map(([key, q]) => (
              <button key={key}
                onClick={() => setActiveQ(activeQ === q.geom ? null : q.geom)}
                className={`text-left px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${activeQ === q.geom
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
              >
                {q.label}
              </button>
            ))}
        </div>

        {activeQ !== null && (
          <button onClick={() => setActiveQ(null)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground text-[12px] hover:text-foreground transition-all">
            <RotateCcw className="w-3 h-3" /> Show All
          </button>
        )}

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">Shape = Type</div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="5" fill="hsl(var(--muted-foreground))" opacity="0.5" />
            </svg>
            Opportunity
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8,2 L14,8 L8,14 L2,8 Z" fill="hsl(var(--muted-foreground))" opacity="0.5" />
            </svg>
            Threat
          </div>

          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mt-2">Color = Risk</div>
          {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
            <div key={level} className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: RISK_FILL[level] }} />
              {level.charAt(0) + level.slice(1).toLowerCase()}
            </div>
          ))}

          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mt-2">Size = Impact</div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
              <div key={level} className="flex items-center gap-1">
                <div className="rounded-full bg-muted-foreground/30"
                  style={{ width: IMPACT_SIZE[level] * 2, height: IMPACT_SIZE[level] * 2 }} />
                <span>{level.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected element detail */}
        {selectedEl ? (
          <div className="bg-card border border-border rounded-xl p-4 shadow-md mt-2 animate-fade-in">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-sm leading-snug flex-1">{selectedEl.title}</div>
              <button onClick={() => setSelectedEl(null)}
                className="p-0.5 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {([
              ['Type', selectedEl.type],
              ['Category', (selectedEl.category ?? '').replace(/_/g, ' ')],
              ['Distance', selectedEl.distance],
              ['Impact', selectedEl.impact],
              ['Risk', selectedEl.risk],
            ] as [string, string][]).map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between gap-2 mb-1 text-[12px]">
                <span className="text-muted-foreground">{lbl}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
            {selectedEl.assess && (
              <div className="text-[11px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">
                {selectedEl.assess}
              </div>
            )}
            <button onClick={() => onEdit(selectedEl)}
              className="w-full mt-3 bg-primary text-primary-foreground hover:opacity-90 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-all">
              Edit Element
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/40 text-center py-4 mt-2 border border-dashed border-border rounded-xl">
            Click a dot to view details
          </div>
        )}
      </div>
    </div>
  );
}