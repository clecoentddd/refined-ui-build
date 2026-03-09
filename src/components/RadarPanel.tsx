import { useState } from 'react';
import type { RadarElement } from '@/context/AppContext';
import { RotateCcw, X } from 'lucide-react';
import RadarSVG, { QUADRANTS, IMPACT_SIZE } from './RadarSVG';

// =============================================================================
// THEMES — override radar-specific and app-level CSS custom properties.
//
// --radar-high / --radar-medium / --radar-low  → dot fill colors (always
//   red / amber / green — only brightness/saturation shifts between themes)
// --primary       → rings, sweep line, quadrant labels
// --background    → panel + SVG canvas background
// --card          → sidebar card surfaces
// --border        → all borders
// --foreground / --muted-foreground → text
//
// All vars are set inline on the root div — no style tag, no extra wrapper,
// zero changes to RadarSVG.tsx.
// =============================================================================

interface Theme {
    label: string;
    preview: [string, string, string]; // [high, medium, low] for swatches
    vars: Record<string, string>;
}

const THEMES: Record<string, Theme> = {
    // ── Light ──────────────────────────────────────────────────────────────────
    // White background, blue primary, standard vivid risk colors.
    light: {
        label: 'Light',
        preview: ['hsl(4 86% 55%)', 'hsl(38 95% 50%)', 'hsl(142 69% 40%)'],
        vars: {
            '--radar-high': '4 86% 55%',
            '--radar-medium': '38 95% 50%',
            '--radar-low': '142 69% 40%',
            '--background': '0 0% 100%',
            '--foreground': '222 47% 11%',
            '--card': '0 0% 98%',
            '--border': '214 32% 88%',
            '--muted-foreground': '215 16% 47%',
            '--primary': '221 83% 53%',
            '--primary-foreground': '0 0% 100%',
        },
    },

    // ── Dark ───────────────────────────────────────────────────────────────────
    // Near-black background, phosphor green primary — military radar aesthetic.
    // Risk colors brightened slightly so they pop on the dark canvas.
    dark: {
        label: 'Dark',
        preview: ['hsl(4 90% 62%)', 'hsl(38 95% 55%)', 'hsl(142 65% 48%)'],
        vars: {
            '--radar-high': '4 90% 62%',
            '--radar-medium': '38 95% 55%',
            '--radar-low': '142 65% 48%',
            '--background': '0 0% 5%',
            '--foreground': '138 40% 80%',
            '--card': '0 0% 9%',
            '--border': '138 18% 16%',
            '--muted-foreground': '138 20% 42%',
            '--primary': '138 70% 40%',   // phosphor green
            '--primary-foreground': '0 0% 5%',
        },
    },

    // ── Business ───────────────────────────────────────────────────────────────
    // Deep navy background, gold primary — boardroom / executive deck style.
    // Risk colors slightly desaturated to feel measured, not alarming.
    business: {
        label: 'Business',
        preview: ['hsl(4 72% 54%)', 'hsl(38 85% 50%)', 'hsl(142 48% 40%)'],
        vars: {
            '--radar-high': '4 72% 54%',
            '--radar-medium': '38 85% 50%',
            '--radar-low': '142 48% 40%',
            '--background': '223 44% 9%',
            '--foreground': '43 55% 85%',
            '--card': '223 44% 12%',
            '--border': '223 28% 20%',
            '--muted-foreground': '223 18% 52%',
            '--primary': '43 78% 50%',    // gold
            '--primary-foreground': '223 44% 9%',
        },
    },
};

type ThemeKey = keyof typeof THEMES;

// =============================================================================
// UI PANEL — sidebar, buttons, legend, detail card, theme switcher.
// Owns all interaction state and passes it down to RadarSVG.
// To experiment with a different layout, edit only this file.
// All radar geometry lives in RadarSVG.tsx.
// =============================================================================

interface Props {
    elements: RadarElement[];
    onEdit: (el: RadarElement) => void;
}

export default function RadarPanel({ elements, onEdit }: Props) {
    const [activeQ, setActiveQ] = useState<number | null>(null);
    const [selectedEl, setSelectedEl] = useState<RadarElement | null>(null);
    const [themeKey, setThemeKey] = useState<ThemeKey>('light');

    const R = 300;
    const PAD = 80;
    const theme = THEMES[themeKey];

    // Spread CSS vars onto the div AND explicitly consume --background/--foreground
    // as real CSS properties. Without this, the app's root <body> background wins
    // and theme background changes are invisible.
    const themeStyle: React.CSSProperties = {
        ...(theme.vars as React.CSSProperties),
        backgroundColor: `hsl(${theme.vars['--background']})`,
        color: `hsl(${theme.vars['--foreground']})`,
        borderRadius: '0.75rem',
        padding: '1rem',
    };

    function toggleQuadrant(geom: number) {
        setActiveQ(prev => prev === geom ? null : geom);
    }

    return (
        <div className="flex flex-col lg:flex-row gap-5 py-4 w-full" style={themeStyle}>

            {/* ── Radar canvas ─────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex items-center justify-center">
                <div className="relative w-full" style={{ maxWidth: (R + PAD) * 2 + 'px' }}>
                    <RadarSVG
                        elements={elements}
                        activeQ={activeQ}
                        selectedEl={selectedEl}
                        onSelectEl={setSelectedEl}
                        onClickLabel={toggleQuadrant}
                    />
                </div>
            </div>

            {/* ── Side panel ───────────────────────────────────────────────────── */}
            <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-3">

                {/* Theme switcher — compact inline pill group */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase shrink-0">Theme</span>
                    <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5 flex-1">
                        {Object.entries(THEMES).map(([key, t]) => (
                            <button
                                key={key}
                                onClick={() => setThemeKey(key as ThemeKey)}
                                title={t.label}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${themeKey === key
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <div className="flex gap-0.5">
                                    {t.preview.map((color, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                    ))}
                                </div>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-border" />

                {/* Quadrant filter buttons */}
                <div className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">Quadrant</div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                    {Object.entries(QUADRANTS)
                        .sort((a, b) => a[1].geom - b[1].geom)
                        .map(([key, q]) => (
                            <button key={key}
                                onClick={() => toggleQuadrant(q.geom)}
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
                    {(['HIGH', 'MEDIUM', 'LOW'] as const).map((level, i) => (
                        <div key={level} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                            {/* Swatch uses live theme preview so it always matches the radar */}
                            <div className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ background: theme.preview[i] }} />
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

                {/* Selected element detail card */}
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