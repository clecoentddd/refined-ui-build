import { useState } from 'react';
import type { RadarElement } from '@/context/AppContext';
import { RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Configuration — change these to reshape the radar without touching logic
// ---------------------------------------------------------------------------

const QUADRANTS: Record<string, { index: number; label: string }> = {
  BUSINESS: { index: 2, label: 'Business' },
  CAPABILITIES: { index: 3, label: 'Capabilities' },
  OPERATING_MODEL: { index: 1, label: 'Operating Model' },
  PEOPLE_KNOWLEDGE: { index: 0, label: 'People & Knowledge' },
};

// Each ring value is the fractional radius (0–1) where items are plotted
const RINGS: Record<string, number> = {
  DETECTED: 0.88,
  ASSESSING: 0.63,
  ASSESSED: 0.40,
  RESPONDING: 0.20,
};

// Labels painted on the ring arcs (r = fractional radius of the label)
const RING_LABELS: { label: string; r: number }[] = [
  { label: 'DETECT', r: 0.88 },
  { label: 'ASSESS', r: 0.63 },
  { label: 'RESPOND', r: 0.38 },
];

// Dot radius in SVG units for each impact level
const IMPACT_SIZE: Record<string, number> = {
  LOW: 7,
  MEDIUM: 11,
  HIGH: 15,
};

// CSS custom-property references for colors
const RISK_COLOR: Record<string, string> = { HIGH: 'var(--radar-high)', MEDIUM: 'var(--radar-medium)', LOW: 'var(--radar-low)' };
const TYPE_COLOR: Record<string, string> = { THREAT: 'var(--radar-threat)', OPPORTUNITY: 'var(--radar-opportunity)' };

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Convert a (quadrantIndex, ringFraction, slotIndex, totalSlots) to SVG {x,y}.
 *
 * Each quadrant occupies a 90° arc starting at  qIndex * 90°  (measured from
 * the positive-X axis, i.e. standard math convention).  Items in the same
 * ring+quadrant bucket are spread evenly across that 90° arc.
 */
function cartesian(
  qIndex: number,
  ring: number,
  slotIndex: number,
  totalSlots: number,
  R: number,
): { x: number; y: number } {
  const arcStart = (Math.PI / 2) * qIndex;
  const step = (Math.PI / 2) / (totalSlots + 1);
  const angle = arcStart + step * (slotIndex + 1);
  return { x: R * ring * Math.cos(angle), y: R * ring * Math.sin(angle) };
}

/**
 * Return the SVG viewBox string that zooms into quadrant `qIndex`.
 *
 * The SVG coordinate system is centred on (0,0).  Each quadrant lives in one
 * of the four half-plane intersections:
 *
 *   index 0 → +X / –Y  → PEOPLE_KNOWLEDGE  (top-right in screen space)
 *   index 1 → –X / –Y  → OPERATING_MODEL   (top-left)
 *   index 2 → –X / +Y  → BUSINESS          (bottom-left)
 *   index 3 → +X / +Y  → CAPABILITIES      (bottom-right)
 *
 * We add a small `pad` so dots on the boundary aren't clipped.
 */
function quadrantViewBox(qIndex: number, R: number, pad = 20): string {
  const half = R + pad;
  switch (qIndex) {
    case 0: return `${-pad} ${-pad} ${half} ${half}`;
    case 1: return `${-half + pad} ${-pad} ${half} ${half}`;
    case 2: return `${-half + pad} ${-half + pad} ${half} ${half}`;
    case 3: return `${-pad} ${-half + pad} ${half} ${half}`;
    default: return `${-R} ${-R} ${R * 2} ${R * 2}`;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  elements: RadarElement[];
  onEdit: (el: RadarElement) => void;
}

export default function RadarSVG({ elements, onEdit }: Props) {
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [hoveredEl, setHoveredEl] = useState<RadarElement | null>(null);

  // Radar geometry constants (derived, not magic)
  const R = 260;
  const PAD = 160;              // outer label clearance — wide enough for longest label
  const SIZE = R * 2 + PAD * 2; // full SVG canvas

  // ---- Build dot list --------------------------------------------------------
  // Group elements by (category × distance) so we can spread them across the arc
  const groups: Record<string, RadarElement[]> = {};
  for (const el of elements) {
    const key = `${el.category}__${el.distance}`;
    (groups[key] ??= []).push(el);
  }

  const dots = Object.values(groups).flatMap(group =>
    group.map((el, i) => {
      const q = QUADRANTS[el.category];
      const ring = RINGS[el.distance] ?? RINGS.DETECTED;
      const { x, y } = cartesian(q?.index ?? 0, ring, i, group.length, R);
      return {
        ...el,
        x,
        y,
        size: IMPACT_SIZE[el.impact] ?? 10,
        qIndex: q?.index ?? 0,
      };
    }),
  );

  // When a quadrant is active, only show its dots
  const visible = activeQ !== null ? dots.filter(d => d.qIndex === activeQ) : dots;

  // ---- ViewBox ---------------------------------------------------------------
  const fullViewBox = `${-R - PAD} ${-R - PAD} ${(R + PAD) * 2} ${(R + PAD) * 2}`;
  const viewBox = activeQ !== null ? quadrantViewBox(activeQ, R) : fullViewBox;

  // ---- Quadrant separator lines (from centre to edge) ------------------------
  const separatorAngles = [0, 1, 2, 3].map(i => (Math.PI / 2) * i);

  return (
    <div className="flex gap-6 py-5">
      {/* ── Side panel ─────────────────────────────────────────────────────── */}
      <div className="w-[200px] flex-shrink-0 flex flex-col gap-2">
        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mb-1">
          Quadrant
        </div>

        {Object.entries(QUADRANTS).map(([key, q]) => (
          <button
            key={key}
            onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${activeQ === q.index
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
          >
            {q.label}
          </button>
        ))}

        {activeQ !== null && (
          <button
            onClick={() => setActiveQ(null)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground text-[12px] mt-1 hover:text-foreground transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Show All
          </button>
        )}

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-3">
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mb-1">
            Type
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded-full bg-radar-opportunity flex-shrink-0" />
            <span>Opportunity</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded-full bg-radar-threat flex-shrink-0" />
            <span>Threat</span>
          </div>

          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mt-2">
            Risk Level
          </div>
          {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
            <div key={level} className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
              <div
                className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: `hsl(${RISK_COLOR[level]})` }}
              />
              <span>{level.charAt(0) + level.slice(1).toLowerCase()}</span>
            </div>
          ))}

          <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase mt-2">
            Size = Impact
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredEl ? (
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg mt-4 animate-fade-in">
            <div className="font-semibold text-sm mb-2">{hoveredEl.title}</div>
            {(
              [
                ['Type', hoveredEl.type],
                ['Category', (hoveredEl.category ?? '').replace(/_/g, ' ')],
                ['Distance', hoveredEl.distance],
                ['Impact', hoveredEl.impact],
                ['Risk', hoveredEl.risk],
              ] as [string, string][]
            ).map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between gap-2 mb-1 text-[12px]">
                <span className="text-muted-foreground">{lbl}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
            {hoveredEl.assess && (
              <div className="text-[11px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">
                {hoveredEl.assess}
              </div>
            )}
            <button
              onClick={() => onEdit(hoveredEl)}
              className="w-full mt-3 border border-border bg-background text-foreground hover:bg-muted px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            >
              Edit Element
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/40 text-center py-6 mt-4">
            Hover a dot for details
          </div>
        )}
      </div>

      {/* ── SVG Radar ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-hidden radar-glow">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={viewBox}
          style={{ transition: 'viewBox 0.4s ease', maxWidth: '100%' }}
        >
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.03" />
              <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.01" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>

            {(['green', 'red', 'amber'] as const).map(name => (
              <filter key={name} id={`glow-${name}`}>
                <feGaussianBlur stdDeviation={name === 'amber' ? 3 : 4} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Background glow */}
          <circle r={R} fill="url(#radar-bg)" />

          {/* Concentric rings */}
          {[0.25, 0.5, 0.75, 1].map(fraction => (
            <circle
              key={fraction}
              r={R * fraction}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeOpacity={fraction === 1 ? 0.15 : 0.08}
              strokeWidth={fraction === 1 ? 1.5 : 1}
              strokeDasharray={fraction < 1 ? '3 6' : undefined}
            />
          ))}

          {/* Animated pulse ring */}
          <circle
            r={R * 0.75}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.05"
            strokeWidth="24"
            className="radar-ring-pulse"
          />

          {/* Quadrant separator lines */}
          {separatorAngles.map((angle, i) => (
            <line
              key={i}
              x1={0} y1={0}
              x2={R * Math.cos(angle)}
              y2={R * Math.sin(angle)}
              stroke="hsl(var(--primary))"
              strokeOpacity="0.08"
              strokeWidth={1}
            />
          ))}

          {/* Ring labels */}
          {RING_LABELS.map(({ label, r }) => (
            <text
              key={label}
              x={10}
              y={-(R * r) + 4}
              fill="hsl(var(--muted-foreground))"
              fillOpacity="0.5"
              fontSize={10}
              fontFamily="'Inter', sans-serif"
              fontWeight={600}
              letterSpacing={1.5}
            >
              {label}
            </text>
          ))}

          {/* Quadrant labels — placed at mid-arc angle, pushed outside the ring.
               Top-half labels shift up, bottom-half labels shift down so they
               never clip against the ring boundary or each other.
               Labels with an '&' or space-heavy names wrap onto two lines. */}
          {Object.entries(QUADRANTS).map(([key, q]) => {
            const midAngle = (Math.PI / 2) * q.index + Math.PI / 4;
            const labelR = R + PAD * 0.55;
            const lx = labelR * Math.cos(midAngle);
            const ly = labelR * Math.sin(midAngle);
            const isTop = ly < 0;
            // Split label into two lines at a natural word boundary if long
            const words = q.label.split(' ');
            const mid = Math.ceil(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.length > 1 ? words.slice(mid).join(' ') : null;
            const lineH = 13; // px between lines
            // Shift the whole label block away from the ring edge
            const baseY = ly + (isTop ? -PAD * 0.18 : PAD * 0.18);

            return (
              <text
                key={key}
                x={lx}
                y={baseY}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fontFamily="'Inter', sans-serif"
                fill={activeQ === q.index ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                fillOpacity={activeQ === q.index ? 1 : 0.6}
                className="cursor-pointer select-none"
                onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
                style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
              >
                {line2 ? (
                  <>
                    <tspan x={lx} dy={isTop ? -lineH / 2 : -lineH / 2}>{line1}</tspan>
                    <tspan x={lx} dy={lineH}>{line2}</tspan>
                  </>
                ) : (
                  <tspan dominantBaseline="middle">{line1}</tspan>
                )}
              </text>
            );
          })}

          {/* Element dots */}
          {visible.map((dot, i) => {
            const typeColor = `hsl(${TYPE_COLOR[dot.type] ?? TYPE_COLOR.THREAT})`;
            const riskColor = `hsl(${RISK_COLOR[dot.risk] ?? RISK_COLOR.LOW})`;
            const isHovered = hoveredEl?.environmentalChangeId === dot.environmentalChangeId;
            const glowFilter =
              dot.risk === 'HIGH' ? 'url(#glow-red)' :
                dot.risk === 'MEDIUM' ? 'url(#glow-amber)' :
                  'url(#glow-green)';

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredEl(dot)}
                onMouseLeave={() => setHoveredEl(null)}
                filter={isHovered ? glowFilter : undefined}
              >
                {dot.type === 'OPPORTUNITY' ? (
                  <>
                    <circle cx={dot.x} cy={dot.y} r={dot.size} fill="none" stroke={typeColor} strokeWidth={2} opacity={0.9} />
                    <circle cx={dot.x} cy={dot.y} r={dot.size * 0.45} fill={typeColor} opacity={0.9} />
                  </>
                ) : (
                  <circle cx={dot.x} cy={dot.y} r={dot.size} fill={typeColor} opacity={0.85} />
                )}

                {/* Risk ring indicator */}
                <circle
                  cx={dot.x} cy={dot.y}
                  r={dot.size + 3}
                  fill="none"
                  stroke={riskColor}
                  strokeWidth={1.5}
                  opacity={0.5}
                  strokeDasharray="2 2"
                />

                {/* Hover ring */}
                {isHovered && (
                  <circle
                    cx={dot.x} cy={dot.y}
                    r={dot.size + 8}
                    fill="none"
                    stroke={typeColor}
                    strokeWidth={1.5}
                    opacity={0.4}
                  />
                )}

                {/* Element name label */}
                <g>
                  {/* Pill background for readability */}
                  <rect
                    x={dot.x - 28}
                    y={dot.y + dot.size + 4}
                    width={56}
                    height={13}
                    rx={3}
                    fill="hsl(var(--background))"
                    fillOpacity={0.7}
                  />
                  <text
                    x={dot.x}
                    y={dot.y + dot.size + 14}
                    textAnchor="middle"
                    fontSize={8}
                    fontFamily="'Inter', sans-serif"
                    fontWeight={isHovered ? 700 : 500}
                    fill={isHovered ? typeColor : 'hsl(var(--muted-foreground))'}
                    fillOpacity={isHovered ? 1 : 0.75}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {dot.title.length > 10 ? dot.title.slice(0, 9) + '…' : dot.title}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Centre dot */}
          <circle r={4} fill="hsl(var(--primary))" opacity={0.3} />
          <circle r={1.5} fill="hsl(var(--primary))" opacity={0.6} />
        </svg>
      </div>
    </div>
  );
}