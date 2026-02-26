import { useState } from 'react';
import type { RadarElement } from '@/context/AppContext';

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
const IMPACT_SIZE: Record<string, number> = { LOW: 7, MEDIUM: 10, HIGH: 14 };
const RISK_COLOR: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

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
  const R = 240;
  const size = R * 2 + 180;
  const cx = size / 2;
  const cy = size / 2;

  // Build dots
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
      return { ...el, x, y, size: IMPACT_SIZE[el.impact] || 10, color: RISK_COLOR[el.risk] || '#10b981', qIndex: q?.index ?? 0 };
    })
  );
  const visible = activeQ !== null ? dots.filter(d => d.qIndex === activeQ) : dots;

  return (
    <div className="flex gap-5 py-5">
      {/* Side controls */}
      <div className="w-[200px] flex-shrink-0 flex flex-col gap-2">
        <div className="font-mono text-[9px] text-muted-foreground/60 tracking-[2px] uppercase mb-1">Zoom Quadrant</div>
        {Object.entries(QUADRANTS).map(([key, q]) => (
          <button
            key={key}
            onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
            className={`w-full text-left px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-all ${
              activeQ === q.index ? 'border-primary/30 text-primary bg-primary/10 font-bold' : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-primary'
            }`}
          >
            {q.label}
          </button>
        ))}
        {activeQ !== null && (
          <button onClick={() => setActiveQ(null)} className="w-full text-left px-3 py-1.5 rounded-lg border border-border-strong text-muted-foreground font-mono text-[11px] mt-1">
            ↺ Show All
          </button>
        )}

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5">
          <div className="font-mono text-[9px] text-muted-foreground/60 tracking-[2px] uppercase mb-1">Legend</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <svg width="18" height="18"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="9" r="2.5" fill="currentColor" /></svg>
            <span>Opportunity</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <svg width="18" height="18"><circle cx="9" cy="9" r="6" fill="currentColor" /><polygon points="9,4.5 5.5,12 12.5,12" fill="rgba(255,255,255,0.35)" /></svg>
            <span>Threat</span>
          </div>
          {Object.entries(RISK_COLOR).map(([risk, color]) => (
            <div key={risk} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span>Risk: {risk.charAt(0) + risk.slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredEl ? (
          <div className="bg-card border border-border rounded-xl p-3.5 shadow-lg mt-3">
            <div className="font-bold text-sm mb-2">{hoveredEl.title}</div>
            {[['Type', hoveredEl.type], ['Category', (hoveredEl.category || '').replace(/_/g, ' ')], ['Distance', hoveredEl.distance], ['Impact', hoveredEl.impact], ['Risk', hoveredEl.risk]].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between gap-2 mb-1 text-[11px]">
                <span className="font-mono text-muted-foreground text-[10px] uppercase tracking-wide">{lbl}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
            {hoveredEl.assess && <div className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">{hoveredEl.assess}</div>}
            <button onClick={() => onEdit(hoveredEl)} className="w-full mt-2.5 border border-border-strong bg-card text-muted-foreground hover:text-foreground px-2.5 py-1 rounded text-[11px] font-bold transition-all">
              ✏️ Edit
            </button>
          </div>
        ) : (
          <div className="font-mono text-[10px] text-muted-foreground/40 text-center py-5 mt-3">Hover a dot</div>
        )}
      </div>

      {/* SVG */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
          <g transform={`translate(${cx},${cy})`}>
            {[0.25, 0.5, 0.75, 1].map(r => (
              <circle key={r} r={R * r} fill="none" stroke={r === 1 ? '#d1d5db' : '#e5e7eb'} strokeWidth={r === 1 ? 2 : 1} />
            ))}
            {[0, 1, 2, 3].map(i => {
              const a = (Math.PI / 2) * i;
              return <line key={i} x1={0} y1={0} x2={R * Math.cos(a)} y2={R * Math.sin(a)} stroke="#e5e7eb" strokeWidth={1} />;
            })}
            {RING_LABELS.map(({ label, r }) => (
              <text key={label} x={6} y={-(R * r) + 4} fill="#9ca3af" fontSize={10} fontFamily="monospace" letterSpacing={1}>{label}</text>
            ))}
            {Object.entries(QUADRANTS).map(([key, q]) => {
              const a = (Math.PI / 2) * q.index + Math.PI / 4;
              return (
                <text
                  key={key}
                  x={(R + 36) * Math.cos(a)}
                  y={(R + 36) * Math.sin(a)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={activeQ === q.index ? 'hsl(224, 76%, 48%)' : '#374151'}
                  className="cursor-pointer"
                  onClick={() => setActiveQ(activeQ === q.index ? null : q.index)}
                >
                  {q.label}
                </text>
              );
            })}
            {visible.map((dot, i) => (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredEl(dot)} onMouseLeave={() => setHoveredEl(null)}>
                {dot.type === 'OPPORTUNITY' ? (
                  <>
                    <circle cx={dot.x} cy={dot.y} r={dot.size} fill="none" stroke={dot.color} strokeWidth={2} />
                    <circle cx={dot.x} cy={dot.y} r={dot.size * 0.45} fill={dot.color} />
                  </>
                ) : (
                  <>
                    <circle cx={dot.x} cy={dot.y} r={dot.size} fill={dot.color} />
                    <polygon
                      points={`${dot.x},${dot.y - dot.size * 0.6} ${dot.x - dot.size * 0.52},${dot.y + dot.size * 0.3} ${dot.x + dot.size * 0.52},${dot.y + dot.size * 0.3}`}
                      fill="rgba(0,0,0,0.25)"
                    />
                  </>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
