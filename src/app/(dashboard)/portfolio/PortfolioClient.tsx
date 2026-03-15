"use client";

import { useState, useEffect, useRef } from "react";
const getImageUrl = (path: string) => path ? (path.startsWith('http') ? path : `https://api.ipnacademy.in/storage/${path}`) : "https://cdn-icons-png.flaticon.com/512/3237/3237472.png";
import {
    BarChart2, Clock, TrendingUp, Star,
    ChevronDown, ChevronUp, Calendar, BookOpen, User,
    Zap, Heart, PlayCircle, CheckCircle, Award, Target,
    MessageSquare, Tag, Sun, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";


// ── Count-Up ─────────────────────────────────────────────────────────
function CountUp({ target, duration = 1600, decimals = 0 }: { target: number; duration?: number; decimals?: number }) {
    const [count, setCount] = useState(0);
    const raf = useRef<number | null>(null);
    useEffect(() => {
        setCount(0);
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const val = (1 - Math.pow(1 - p, 3)) * target;
            setCount(decimals > 0 ? Math.round(val * 10) / 10 : Math.round(val));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }, [target, duration, decimals]);
    return <>{decimals > 0 ? count.toFixed(1) : count.toLocaleString()}</>;
}

// ── Mini Bar ─────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const [w, setW] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setW(max > 0 ? (value / max) * 100 : 0), 300);
        return () => clearTimeout(t);
    }, [value, max]);
    return (
        <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${w}%` }} />
        </div>
    );
}

// ── Radial Ring ──────────────────────────────────────────────────────
function RadialRing({ percent, color, size = 68 }: { percent: number; color: string; size?: number }) {
    const r = (size - 10) / 2; const circ = 2 * Math.PI * r;
    const [off, setOff] = useState(circ);
    useEffect(() => { const t = setTimeout(() => setOff(circ * (1 - percent / 100)), 400); return () => clearTimeout(t); }, [percent, circ]);
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-black/10 dark:text-white/10" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
    );
}

// ── Glass card wrapper ────────────────────────────────────────────────
const glass = "bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-md";
const glassHover = "hover:shadow-lg hover:border-slate-300 dark:hover:bg-slate-800/80 dark:hover:border-white/20 transition-all duration-200";

// ── Palette ──────────────────────────────────────────────────────────
const PALETTE = [
    { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-400/30", text: "text-blue-700 dark:text-blue-400", bar: "bg-blue-500", ring: "#3b82f6" },
    { bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-400/30", text: "text-violet-700 dark:text-violet-400", bar: "bg-violet-500", ring: "#8b5cf6" },
    { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-400/30", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500", ring: "#10b981" },
    { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-400/30", text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500", ring: "#f59e0b" },
    { bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-400/30", text: "text-rose-700 dark:text-rose-400", bar: "bg-rose-500", ring: "#f43f5e" },
    { bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-400/30", text: "text-cyan-700 dark:text-cyan-400", bar: "bg-cyan-500", ring: "#06b6d4" },
];

// ── Section Header ────────────────────────────────────────────────────
function H({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md flex-shrink-0">{icon}</div>
            <div>
                <h2 className="text-xl font-black text-black dark:text-white leading-tight">{title}</h2>
                {sub && <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── Star Row ─────────────────────────────────────────────────────────
function StarRow({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn(size, s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-300 dark:fill-slate-600 dark:text-slate-500")} />
            ))}
        </div>
    );
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────────────────────────────────────────────────────────────────
export default function PortfolioClient({ data: initialData, fetchUrl = "/api/portfolio", hideUpload = false }: { data: any, fetchUrl?: string, hideUpload?: boolean }) {
    const thisYear = new Date().getFullYear();
    // Default to Last Year
    const [selectedYear, setSelectedYear] = useState(thisYear - 1);
    const [portfolioData, setPortfolioData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [tab, setTab] = useState<"timeline" | "grid">("timeline");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        // selectedYear === thisYear - 1 is our SSR default, so no immediate fetch
        setLoading(true); setExpandedCat(null);
        fetch(`${fetchUrl}?year=${selectedYear}`).then(r => r.json()).then(setPortfolioData).finally(() => setLoading(false));
    }, [selectedYear]);

    const data = portfolioData;
    if (!data || data.error) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <BarChart2 className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 text-sm font-semibold">No portfolio data yet.</p>
        </div>
    );

    const { hero, categories, workshops, monthly, dayOfWeek, skills, feedbackGiven, allTrainers, favouriteCategory, favouriteTrainer, user, year } = data;
    const maxCat = Math.max(...(categories || []).map((c: any) => Number(c.workshop_count)), 1);
    const maxMonth = Math.max(...(monthly || []).map((m: any) => Number(m.count)), 1);
    const maxMinutes = Math.max(...(categories || []).map((c: any) => Number(c.minutes_attended)), 1);

    // CPD / attendance metrics
    const totalWorkshops = hero.totalWorkshops || 0;
    const attendedCount = hero.attendedCount || 0;
    const reviewedCount = hero.reviewedCount || 0;
    const attendancePct = totalWorkshops > 0 ? Math.round((attendedCount / totalWorkshops) * 100) : 0;
    const reviewPct = totalWorkshops > 0 ? Math.round((reviewedCount / totalWorkshops) * 100) : 0;

    // Day-of-week map
    const dowMap: Record<number, number> = {};
    (dayOfWeek || []).forEach((d: any) => { dowMap[Number(d.dow)] = Number(d.count); });
    const maxDow = Math.max(...Object.values(dowMap), 1);


    // Feedback average
    const feedbackList = feedbackGiven || [];
    const avgRating = feedbackList.length > 0
        ? Math.round((feedbackList.reduce((s: number, f: any) => s + Number(f.rating), 0) / feedbackList.length) * 10) / 10
        : 0;
    const ratingDist = [5, 4, 3, 2, 1].map(r => ({
        r,
        count: feedbackList.filter((f: any) => Number(f.rating) === r).length
    }));

    return (
        <div className="space-y-10 pb-16 w-full relative">
            {loading && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-32 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-3xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading {selectedYear}…</span>
                    </div>
                </div>
            )}

            {/* ── HERO ─────────────────────────────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-300 text-[11px] font-black uppercase tracking-widest">{year} Journey</span>
                        </div>
                        <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 gap-1">
                            {[thisYear - 1, thisYear].map(y => (
                                <button key={y} onClick={() => setSelectedYear(y)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition-all",
                                        selectedYear === y ? "bg-blue-500 text-white shadow-lg" : "text-white/50 hover:text-white hover:bg-white/10")}>
                                    {y === thisYear ? "This Year" : "Last Year"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-1">{user?.name}'s Portfolio</h1>
                            <p className="text-slate-400 text-sm">Your professional development journey in {year}</p>
                        </div>
                        {!hideUpload && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-md border border-blue-400/20 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-lg shadow-blue-500/5 mt-2 md:mt-0"
                            >
                                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                                External Certificate
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Total Workshops", value: hero.totalWorkshops, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/20", decimals: 0 },
                            { label: "Hours of Learning", value: Math.round((hero.totalMinutesAttended || 0) / 60 * 10) / 10, icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/20", decimals: 1 },
                            { label: "CPD Credits", value: hero.totalCpd || 0, icon: Award, color: "text-violet-400", bg: "bg-violet-500/20", decimals: 1 },
                            { label: "Attendance Rate", value: attendancePct, icon: Target, color: "text-amber-400", bg: "bg-amber-500/20", suffix: "%", decimals: 0 },
                        ].map(({ label, value, icon: Icon, color, bg, decimals, suffix }) => (
                            <div key={label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl flex-shrink-0", bg)}><Icon className={cn("w-5 h-5", color)} /></div>
                                <div>
                                    <p className="text-xl font-black text-white">
                                        <CountUp target={Number(value)} decimals={decimals} />{suffix || ""}
                                    </p>
                                    <p className="text-[10px] text-white/40 font-bold mt-0.5 leading-tight">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── LEARNING SCORE CARD ────────────────────────────────── */}
            <section>
                <H icon={<Target className="w-4 h-4" />} title="Learning Score Card" sub="Your professional development summary at a glance" />
                <div className={cn("rounded-2xl p-6", glass)}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Attendance Rate */}
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="relative">
                                <RadialRing percent={attendancePct} color="#10b981" size={100} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{attendancePct}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="font-black text-slate-800 dark:text-white text-sm">Attendance Rate</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{attendedCount} of {totalWorkshops} attended</p>
                            </div>
                        </div>
                        {/* Review Rate */}
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="relative">
                                <RadialRing percent={reviewPct} color="#8b5cf6" size={100} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{reviewPct}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="font-black text-slate-800 dark:text-white text-sm">Review Completion</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{reviewedCount} of {totalWorkshops} reviewed</p>
                            </div>
                        </div>
                        {/* CPD Summary */}
                        <div className="flex flex-col justify-center gap-3">
                            <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-400/30 rounded-2xl px-5 py-4">
                                <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">Total CPD Credits</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white">{hero.totalCpd || 0}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Continuing Professional Development</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/30 rounded-2xl px-5 py-3">
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">Hours Invested</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.round((hero.totalMinutesAttended || 0) / 60 * 10) / 10} hrs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CATEGORIES ────────────────────────────────────────── */}
            {categories && categories.length > 0 && (
                <section>
                    <H icon={<BarChart2 className="w-4 h-4" />} title="Workshop Categories" sub="Click to expand and explore" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(categories as any[]).map((cat, i) => {
                            const p = PALETTE[i % PALETTE.length];
                            const isOpen = expandedCat === cat.category;
                            const wCount = Number(cat.workshop_count) || 0;
                            const aCount = Number(cat.attended_count) || 0;
                            const pct = wCount > 0 ? Math.round((aCount / wCount) * 100) : 0;
                            const catWs = (workshops || []).filter((w: any) => w.category === cat.category);
                            return (
                                <div key={cat.category}
                                    title={`Attendance Rate: ${pct}% (${cat.attended_count || 0} of ${cat.workshop_count || 0} workshops attended)`}
                                    className={cn(
                                        "rounded-2xl border-2 p-5 cursor-pointer shadow-sm backdrop-blur-md transition-all duration-200",
                                        p.bg, p.border, glassHover,
                                        "dark:bg-slate-800/60",
                                        isOpen ? "ring-2 ring-blue-400/50 shadow-md" : ""
                                    )}
                                    onClick={() => setExpandedCat(isOpen ? null : cat.category)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className={cn("font-black text-base", p.text)}>{cat.category}</p>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                                {cat.workshop_count || 0} workshop{Number(cat.workshop_count || 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        <div className="relative flex-shrink-0">
                                            <RadialRing percent={pct} color={p.ring} />
                                            <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-black", p.text)}>{isNaN(pct) ? 0 : pct}%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-600 dark:text-slate-300">Min. Attended</span>
                                            <span className={p.text}>{Math.round(Number(cat.minutes_attended))} min</span>
                                        </div>
                                        <MiniBar value={Number(cat.minutes_attended)} max={maxMinutes} color={p.bar} />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{isOpen ? "Collapse" : "Explore workshops"}</span>
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                    {isOpen && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
                                            {catWs.length === 0
                                                ? <p className="text-xs text-slate-500 text-center py-2">No workshops in {year}</p>
                                                : catWs.map((w: any, j: number) => (
                                                    <div key={j} className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-200 dark:border-white/5">
                                                        {w.is_attended === 1
                                                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                            : <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{w.name}</p>
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                {new Date(w.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                                {w.is_attended === 1 && w.attended_duration > 0 && ` · ${Math.round(w.attended_duration)} min`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── SKILLS & TOPICS ───────────────────────────────────── */}
            {skills && skills.length > 0 && (
                <section>
                    <H icon={<Tag className="w-4 h-4" />} title="Skills & Topics Covered" sub="Key areas from your workshops this year" />
                    <div className={cn("rounded-2xl p-6", glass)}>
                        <div className="flex flex-wrap gap-2">
                            {(skills as any[]).map((s: any, i: number) => {
                                const p = PALETTE[i % PALETTE.length];
                                const fontSize = s.count >= 3 ? "text-sm" : s.count >= 2 ? "text-xs" : "text-[11px]";
                                return (
                                    <span key={s.tag}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full border font-bold transition-all hover:scale-105 cursor-default",
                                            fontSize, p.bg, p.text, p.border
                                        )}
                                    >
                                        {s.tag}
                                        {s.count > 1 && <span className="ml-1 opacity-60 text-[10px]">×{s.count}</span>}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── WORKSHOPS ─────────────────────────────────────────── */}
            {workshops && workshops.length > 0 && (
                <section>
                    <div className="flex items-start justify-between mb-5">
                        <H icon={<Calendar className="w-4 h-4" />} title="All Workshops" sub={`${workshops.length} in ${year}`} />
                        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex-shrink-0 mt-0.5 border border-slate-200 dark:border-white/10">
                            {(["timeline", "grid"] as const).map(t => (
                                <button key={t} onClick={() => setTab(t)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                                        tab === t ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-white/10" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    {tab === "timeline" ? (
                        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-white/10 space-y-4">
                            {(workshops as any[]).map((w, i) => {
                                const p = PALETTE[i % PALETTE.length];
                                return (
                                    <div key={w.id} className="relative">
                                        <div className={cn("absolute -left-[29px] w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                                            w.is_attended ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} />
                                        <div className={cn("rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3", glass, glassHover)}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", p.bg, p.text, p.border)}>{w.category || "General"}</span>
                                                    {w.is_attended === 1 && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-400/20 inline-flex items-center gap-1">
                                                            <CheckCircle className="w-2.5 h-2.5" /> Attended
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{w.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {new Date(w.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                                    {w.trainer_name && ` · ${w.trainer_name}`}
                                                </p>
                                            </div>
                                            {w.is_attended === 1 && w.attended_duration > 0 && (
                                                <div className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl">
                                                    <Clock className="w-3.5 h-3.5" /><span className="text-sm font-bold">{Math.round(w.attended_duration)} min</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(workshops as any[]).map((w, i) => {
                                const p = PALETTE[i % PALETTE.length];
                                return (
                                    <div key={w.id} className={cn("rounded-2xl p-4", glass, glassHover)}>
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block border", p.bg, p.text, p.border)}>{w.category || "General"}</span>
                                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate mb-1">{w.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{new Date(w.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><User className="w-3 h-3" /><span className="truncate max-w-[110px]">{w.trainer_name || "—"}</span></span>
                                            {w.is_attended === 1 ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <BookOpen className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* ── FAVOURITES ────────────────────────────────────────── */}
            {(favouriteCategory || favouriteTrainer) && (
                <section>
                    <H icon={<Heart className="w-4 h-4" />} title="Your Favourites" sub={`Based on your activity in ${year}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {favouriteCategory && (
                            <div className={cn("rounded-2xl p-6 border-2 border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-500/10 dark:to-blue-500/10", glass)}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-violet-600 rounded-xl shadow-md"><Zap className="w-4 h-4 text-white" /></div>
                                    <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Favourite Category</span>
                                </div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">{favouriteCategory.category}</p>
                                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-violet-500" />{favouriteCategory.workshop_count} workshops</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-violet-500" />{Math.round(Number(favouriteCategory.minutes_attended))} min</span>
                                </div>
                            </div>
                        )}
                        {favouriteTrainer && (
                            <div className={cn("rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10", glass)}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-amber-500 rounded-xl shadow-md"><Star className="w-4 h-4 text-white" /></div>
                                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Favourite Trainer</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={getImageUrl(favouriteTrainer.trainer_image)}
                                            alt={favouriteTrainer.trainer_name}
                                            className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg"
                                            onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3237/3237472.png"; }}
                                        />
                                        <div className="absolute -bottom-1.5 -right-1.5 bg-amber-400 rounded-full p-1 shadow-md">
                                            <Star className="w-3 h-3 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{favouriteTrainer.trainer_name}</p>
                                        <div className="flex flex-col gap-1 mt-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-amber-500" />{favouriteTrainer.workshop_count} workshops together</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" />{Math.round(Number(favouriteTrainer.minutes_attended))} min of learning</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* All Trainers Row */}
                    {allTrainers && allTrainers.length > 1 && (
                        <div className={cn("mt-4 rounded-2xl p-5", glass)}>
                            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">All Trainers This Year</p>
                            <div className="flex flex-wrap gap-4">
                                {(allTrainers as any[]).map((t: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-3 border border-slate-100 dark:border-white/10">
                                        <img
                                            src={getImageUrl(t.trainer_image)}
                                            alt={t.trainer_name}
                                            className="w-10 h-10 rounded-xl object-cover border border-white shadow-sm flex-shrink-0"
                                            onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3237/3237472.png"; }}
                                        />
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{t.trainer_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.workshop_count} workshop{t.workshop_count > 1 ? "s" : ""}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}


            {/* ── MONTHLY CHART ─────────────────────────────────────── */}
            {monthly && monthly.length > 0 && (
                <section>
                    <H icon={<TrendingUp className="w-4 h-4" />} title="Monthly Activity" sub={`Workshops per month in ${year}`} />
                    <div className={cn("rounded-2xl p-6", glass)}>
                        <div className="flex items-end gap-2 sm:gap-3" style={{ height: "120px" }}>
                            {(monthly as any[]).map((m, i) => {
                                const pct = maxMonth > 0 ? (Number(m.count) / maxMonth) * 100 : 0;
                                const barH = Math.max(pct * 0.72, 6);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1" style={{ height: "100%" }}>
                                        <div className="flex-1 flex items-end w-full group">
                                            <div className="relative w-full">
                                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{m.count}</span>
                                                <div
                                                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 hover:from-indigo-500 hover:to-blue-300 transition-colors cursor-default shadow-sm shadow-blue-500/20"
                                                    style={{ height: `${barH}px`, transition: "height 1s cubic-bezier(.4,0,.2,1)" }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-1.5">{m.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── DAY OF WEEK ───────────────────────────────────────── */}
            {Object.keys(dowMap).length > 0 && (
                <section>
                    <H icon={<Sun className="w-4 h-4" />} title="Best Learning Day" sub="Which days of the week you attend most workshops" />
                    <div className={cn("rounded-2xl p-6", glass)}>
                        <div className="flex items-end gap-3" style={{ height: "100px" }}>
                            {[1, 2, 3, 4, 5, 6, 7].map((dow) => {
                                const count = dowMap[dow] || 0;
                                const barH = maxDow > 0 ? Math.max((count / maxDow) * 80, count > 0 ? 6 : 0) : 0;
                                const isBest = count > 0 && count === maxDow;
                                return (
                                    <div key={dow} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: "100%" }}>
                                        <div className="flex-1 flex items-end w-full group">
                                            <div className="relative w-full">
                                                {count > 0 && (
                                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{count}</span>
                                                )}
                                                <div
                                                    className={cn(
                                                        "w-full rounded-t-lg transition-colors cursor-default",
                                                        isBest
                                                            ? "bg-gradient-to-t from-amber-500 to-yellow-400 shadow-sm shadow-amber-500/30"
                                                            : count > 0
                                                                ? "bg-gradient-to-t from-blue-600 to-blue-400"
                                                                : "bg-slate-100 dark:bg-white/5"
                                                    )}
                                                    style={{ height: `${Math.max(barH, 4)}px`, transition: "height 1s cubic-bezier(.4,0,.2,1)" }}
                                                />
                                            </div>
                                        </div>
                                        <span className={cn("text-[10px] font-bold mt-1", isBest ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400")}>
                                            {DOW_LABELS[dow - 1]}
                                        </span>
                                        {isBest && <span className="text-[8px] font-black text-amber-500 -mt-1">★ Best</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}


            {/* ── MY REVIEWS GIVEN ─────────────────────────────────── */}
            {feedbackList.length > 0 && (
                <section>
                    <H icon={<MessageSquare className="w-4 h-4" />} title="Reviews I've Given" sub={`Your feedback on workshops in ${year}`} />
                    <div className={cn("rounded-2xl p-6", glass)}>
                        {/* Summary row */}
                        <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
                                <p className="text-5xl font-black text-slate-900 dark:text-white">{avgRating}</p>
                                <StarRow rating={Math.round(avgRating)} />
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{feedbackList.length} reviews</p>
                            </div>
                            <div className="flex-1 space-y-2">
                                {ratingDist.map(({ r, count }) => (
                                    <div key={r} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-2">{r}</span>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                                                style={{ width: feedbackList.length > 0 ? `${(count / feedbackList.length) * 100}%` : "0%" }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-4 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Recent reviews */}
                        <div className="space-y-3">
                            {feedbackList.map((f: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <StarRow rating={Number(f.rating)} size="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{f.workshop_name}</p>
                                        {f.comment && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 italic">"{f.comment}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {(!workshops || workshops.length === 0) && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <BarChart2 className="w-10 h-10 text-slate-300" />
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">No workshops registered in {year}.</p>
                </div>
            )}

        </div>
    );
}
