import { useState } from 'react';
import type { RadarElement } from '@/context/AppContext';
import { RotateCcw, X, Pencil } from 'lucide-react';
import RadarSVG, { QUADRANTS, IMPACT_SIZE } from './RadarSVG';

// =============================================================================
// THEMES — 2-color UI Contrast + Functional Risk Dots
// =============================================================================

interface Theme {
    label: string;
    preview: [string, string, string]; // [Primary, Background, Accent]
    vars: Record<string, string>;
}

const THEMES: Record<string, Theme> = {
    // ── LIGHT: White & Blue ──────────────────────────────────────────────────
    light: {
        label: 'Light',
        preview: ['hsl(221 83% 53%)', 'hsl(0 0% 100%)', 'hsl(221 83% 53%)'],
        vars: {
            '--background': '0 0% 100%',
            '--foreground': '222 47% 11%',
            '--card': '0 0% 98%',
            '--border': '214 32% 91%',
            '--muted-foreground': '215 16% 47%',
            '--primary': '221 83% 53%',
            '--primary-foreground': '0 0% 100%',
            // Functional dots (vivid)
            '--radar-high': '4 86% 55%',   // Red
            '--radar-medium': '38 95% 50%', // Amber
            '--radar-low': '142 69% 40%',  // Green
        },
    },

    // ── DARK: Black & Green ──────────────────────────────────────────────────
    dark: {
        label: 'Dark',
        preview: ['hsl(142 70% 50%)', 'hsl(0 0% 2%)', 'hsl(142 70% 50%)'],
        vars: {
            '--background': '0 0% 2%',
            '--foreground': '142 70% 90%',
            '--card': '0 0% 6%',
            '--border': '142 20% 15%',
            '--muted-foreground': '142 10% 45%',
            '--primary': '142 70% 50%',
            '--primary-foreground': '0 0% 2%',
            // Functional dots (brightened for contrast)
            '--radar-high': '4 90% 62%',
            '--radar-medium': '38 95% 55%',
            '--radar-low': '142 65% 48%',
        },
    },

    // ── BUSINESS: Navy & Orange ──────────────────────────────────────────────
    business: {
        label: 'Business',
        preview: ['hsl(25 95% 53%)', 'hsl(223 44% 7%)', 'hsl(25 95% 53%)'],
        vars: {
            '--background': '223 44% 7%',
            '--foreground': '210 20% 90%',
            '--card': '223 44% 10%',
            '--border': '223 20% 18%',
            '--muted-foreground': '223 15% 50%',
            '--primary': '25 95% 53%',
            '--primary-foreground': '223 44% 7%',
            // Functional dots (desaturated)
            '--radar-high': '4 72% 54%',
            '--radar-medium': '38 85% 50%',
            '--radar-low': '142 48% 40%',
        },
    },
};

type ThemeKey = keyof typeof THEMES;

interface Props {
    elements: RadarElement[];
    onEdit: (el: RadarElement) => void;
}

export default function RadarPanel({ elements, onEdit }: Props) {
    const [activeQ, setActiveQ] = useState<number | null>(null);
    const [selectedEl, setSelectedEl] = useState<RadarElement | null>(null);
    const [themeKey, setThemeKey] = useState<ThemeKey>('light');

    const R = 280;
    const PAD = 60;
    const theme = THEMES[themeKey];

    const themeStyle: React.CSSProperties = {
        ...(theme.vars as React.CSSProperties),
        backgroundColor: `hsl(${theme.vars['--background']})`,
        color: `hsl(${theme.vars['--foreground']})`,
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 p-3 rounded-lg w-full transition-colors duration-300" style={themeStyle}>

            {/* ── RADAR VISUALIZATION ────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex items-center justify-center bg-background/30 rounded border border-border/50">
                <div className="relative w-full p-2" style={{ maxWidth: (R + PAD) * 2 + 'px' }}>
                    <RadarSVG
                        elements={elements}
                        activeQ={activeQ}
                        selectedEl={selectedEl}
                        onSelectEl={setSelectedEl}
                        onClickLabel={(geom) => setActiveQ(prev => prev === geom ? null : geom)}
                    />
                </div>
            </div>

            {/* ── CONTROL SIDEBAR ────────────────────────────────────────────── */}
            <div className="w-full lg:w-[230px] flex-shrink-0 flex flex-col gap-3">

                {/* Theme Switcher */}
                <section>
                    <header className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">App Theme</header>
                    <div className="grid grid-cols-1 gap-1">
                        {Object.entries(THEMES).map(([key, t]) => (
                            <button
                                key={key}
                                onClick={() => setThemeKey(key as ThemeKey)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded border transition-all ${themeKey === key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <span className="text-[11px] font-bold">{t.label}</span>
                                <div className="flex -space-x-1">
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-background" style={{ background: t.preview[0] }} />
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-background" style={{ background: t.preview[1] }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* Quadrant Nav */}
                <section>
                    <header className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Quadrants</header>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                        {Object.entries(QUADRANTS).sort((a, b) => a[1].geom - b[1].geom).map(([key, q]) => (
                            <button key={key}
                                onClick={() => setActiveQ(prev => prev === q.geom ? null : q.geom)}
                                className={`text-left px-2 py-1.5 rounded border text-[11px] font-medium truncate ${activeQ === q.geom ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground'
                                    }`}
                            >
                                {q.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Legend: Functional Colors */}
                <section className="bg-card/50 p-2 rounded border border-border/30">
                    <header className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Legend</header>
                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
                            <div key={level} className="flex items-center gap-1.5 text-[10px] font-mono uppercase">
                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: `hsl(var(--radar-${level.toLowerCase()}))` }} />
                                {level}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Selection Details */}
                <div className="mt-auto">
                    {selectedEl ? (
                        <article className="bg-card border-l-2 border-primary p-3 shadow-xl animate-in fade-in slide-in-from-right-2">
                            <div className="flex justify-between items-start gap-2 mb-3">
                                <h4 className="text-[12px] font-black leading-tight uppercase tracking-tight">{selectedEl.title}</h4>
                                <button onClick={() => setSelectedEl(null)} className="hover:bg-muted p-0.5 rounded"><X className="w-3 h-3" /></button>
                            </div>

                            <div className="space-y-1.5">
                                {[
                                    ['Type', selectedEl.type],
                                    ['Risk', selectedEl.risk],
                                    ['Impact', selectedEl.impact]
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between text-[10px] font-mono border-b border-border/20 pb-0.5">
                                        <span className="text-muted-foreground uppercase">{label}</span>
                                        <span className={label === 'Risk' ? 'font-bold' : ''}
                                            style={label === 'Risk' ? { color: `hsl(var(--radar-${val.toLowerCase()}))` } : {}}>
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => onEdit(selectedEl)}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                            >
                                <Pencil className="w-3 h-3" /> Edit Record
                            </button>
                        </article>
                    ) : (
                        <div className="text-[10px] text-center py-6 border border-dashed border-border text-muted-foreground/50 uppercase tracking-widest">
                            No Selection
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}