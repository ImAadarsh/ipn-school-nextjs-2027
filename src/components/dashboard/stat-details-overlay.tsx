"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type StatMetric =
    | "teachers"
    | "activeLearners"
    | "enrollments"
    | "assessments"
    | "topAssessmentGiver"
    | "completion"
    | "cpdHours"
    | "avgRating"
    | "avgCpdPerTeacher"
    | "certificates"
    | "avgJoinTime"
    | "learningHours"
    | "workshops"
    | "feedback";

interface DetailsResponse {
    metric: string;
    title: string;
    description: string;
    columns: string[];
    rows: Record<string, string | number>[];
    error?: string;
}

interface Props {
    metric: StatMetric | null;
    cardValue?: string | number;
    onClose: () => void;
}

export function StatDetailsOverlay({ metric, cardValue, onClose }: Props) {
    const [data, setData] = useState<DetailsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!metric) {
            setData(null);
            setSearch("");
            return;
        }
        let cancelled = false;
        setLoading(true);
        setData(null);
        setSearch("");
        fetch(`/api/dashboard/details?metric=${metric}`)
            .then((r) => r.json())
            .then((d) => {
                if (!cancelled) setData(d);
            })
            .catch(() => {
                if (!cancelled) setData({ metric, title: "Error", description: "Failed to load rows.", columns: [], rows: [] });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [metric]);

    useEffect(() => {
        if (!metric) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [metric, onClose]);

    const filtered = useMemo(() => {
        if (!data?.rows) return [];
        const q = search.trim().toLowerCase();
        if (!q) return data.rows;
        return data.rows.filter((row) =>
            Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q))
        );
    }, [data, search]);

    return (
        <AnimatePresence>
            {metric && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-background"
                    role="dialog"
                    aria-modal="true"
                    aria-label={data?.title || "Metric details"}
                >
                    <div className="h-full flex flex-col">
                        <header className="shrink-0 border-b bg-card/80 backdrop-blur-md">
                            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Card breakdown
                                    </p>
                                    <h2 className="text-xl sm:text-2xl font-display font-black truncate">
                                        {data?.title || "Loading…"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                        {data?.description}
                                        {cardValue !== undefined && cardValue !== null && (
                                            <span className="ml-2 font-semibold text-foreground">
                                                Card value: {cardValue}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {loading ? "…" : `${filtered.length} rows`}
                                    </span>
                                    <Button variant="outline" size="icon" onClick={onClose} aria-label="Close details" className="rounded-full">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-4">
                                <div className="relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search rows…"
                                        className="pl-9 rounded-xl"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 overflow-auto">
                            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
                                {loading ? (
                                    <div className="flex items-center justify-center py-24">
                                        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                                    </div>
                                ) : !data?.columns?.length || filtered.length === 0 ? (
                                    <div className="py-24 text-center text-muted-foreground">
                                        <p className="font-medium">No rows found for this metric.</p>
                                        <p className="text-sm mt-1">The card value may be zero, or no matching records exist yet.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/40">
                                                        <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-12">#</th>
                                                        {data.columns.map((col) => (
                                                            <th
                                                                key={col}
                                                                className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 whitespace-nowrap"
                                                            >
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filtered.map((row, i) => (
                                                        <tr
                                                            key={i}
                                                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                                                            {data.columns.map((col) => (
                                                                <td key={col} className="py-3 px-4 whitespace-nowrap max-w-[280px] truncate" title={String(row[col] ?? "")}>
                                                                    {row[col] ?? "—"}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
