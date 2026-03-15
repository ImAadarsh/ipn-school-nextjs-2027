"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Calendar, User, ArrowRight, CheckCircle2, Clock, Filter, X, Plus, Sparkles, Map, Gift } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "completed" | "roadmap";

interface Workshop {
    id: number; name: string; start_date: string; type: number;
    trainer_name: string; number_of_users: number;
}

export default function WorkshopsPage() {
    const [tab, setTab] = useState<Tab>("upcoming");
    const [search, setSearch] = useState("");
    const [trainerFilter, setTrainerFilter] = useState("");
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [suggestionForm, setSuggestionForm] = useState({ topic: "", trainer: "" });
    const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

    useEffect(() => {
        setLoading(true);
        const typeVal = tab === "upcoming" ? "0" : tab === "roadmap" ? "" : "1";
        const params = new URLSearchParams();
        if (typeVal !== "") params.set("type", typeVal);
        if (search) params.set("search", search);
        if (trainerFilter) params.set("trainer", trainerFilter);

        fetch(`/api/workshops?${params}`)
            .then(r => r.json())
            .then(d => setWorkshops(d.workshops || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [tab, search, trainerFilter]);

    const submitSuggestion = async () => {
        if (!suggestionForm.topic) return;
        setSubmittingSuggestion(true);
        try {
            await fetch("/api/suggestions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(suggestionForm)
            });
            setShowSuggestModal(false);
            setSuggestionForm({ topic: "", trainer: "" });
            alert("Custom workshop suggestion submitted successfully!");
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingSuggestion(false);
        }
    };

    const generateCoupons = async (workshopId: number) => {
        const count = prompt("How many coupons do you want to generate for this workshop?", "10");
        if (!count || isNaN(parseInt(count))) return;
        
        try {
            const res = await fetch("/api/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workshop_id: workshopId, count: parseInt(count) })
            });
            const data = await res.json();
            if (data.code) {
                alert(`Generated ${count} coupons! Prefix: ${data.code}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate coupons");
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-display font-bold">Workshops & Enrollments</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your school&apos;s IPN Academy workshop enrollments and Learning Roadmap</p>
                </div>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2" onClick={() => setShowSuggestModal(true)}>
                    <Sparkles className="h-4 w-4" /> Request Custom Topic
                </Button>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                {(["upcoming", "completed", "roadmap"] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={cn("relative px-5 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                            tab === t ? "text-white" : "text-muted-foreground hover:text-foreground")}>
                        {tab === t && (
                            <motion.div layoutId="workshopTab" className="absolute inset-0 rounded-lg bg-primary"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                        )}
                        <span className="relative capitalize flex items-center gap-2">
                            {t === "roadmap" ? <Map className="h-4 w-4" /> : null}
                            {t}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search workshop name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <div className="relative flex-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Filter by trainer..." value={trainerFilter} onChange={(e) => setTrainerFilter(e.target.value)} className="pl-9" />
                        </div>
                        <AnimatePresence>
                            {(search || trainerFilter) && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                    <Button variant="outline" onClick={() => { setSearch(""); setTrainerFilter(""); }} className="gap-2 shrink-0">
                                        <X className="h-3.5 w-3.5" /> Clear
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                            <Filter className="h-3.5 w-3.5" /> {workshops.length} results
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workshop Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {workshops.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-muted-foreground">
                                <BookOpen className="h-10 w-10 opacity-20 mx-auto mb-3" />
                                <p className="text-base font-medium">No workshops found</p>
                            </div>
                        ) : tab === "roadmap" ? (
                            <div className="col-span-full flex flex-col gap-4 relative">
                                <div className="absolute left-6 sm:left-1/2 top-4 bottom-4 w-px bg-border/60 -translate-x-1/2"></div>
                                {workshops.map((ws, i) => {
                                    const isPast = new Date(ws.start_date) < new Date();
                                    return (
                                        <motion.div key={ws.id} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                            className={cn("relative flex items-center justify-between w-full", i % 2 === 0 ? "flex-row-reverse sm:flex-row" : "flex-row-reverse")}>
                                            <div className="hidden sm:block w-5/12"></div>
                                            <div className="absolute left-6 sm:left-1/2 w-4 h-4 rounded-full border-4 border-background -translate-x-1/2 z-10" style={{ backgroundColor: isPast ? '#10b981' : '#6366f1' }}></div>
                                            <div className="w-full pl-12 sm:pl-0 sm:w-5/12">
                                                <Card className={cn("overflow-hidden border transition-all duration-300", isPast ? "bg-muted/30" : "border-primary/20 shadow-md")}>
                                                    <CardContent className="p-4">
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{new Date(ws.start_date).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" })}</span>
                                                        <h3 className="font-semibold text-sm mt-1 mb-2">{ws.name}</h3>
                                                        <p className="text-xs text-muted-foreground"><User className="inline h-3 w-3 mr-1"/> {ws.trainer_name}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            workshops.map((ws, i) => (
                                <motion.div key={ws.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, type: "spring", stiffness: 250, damping: 25 }} whileHover={{ y: -4 }}>
                                    <Card className="overflow-hidden border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group h-full">
                                        <div className={cn("h-1.5 w-full",
                                            tab === "upcoming" ? "bg-gradient-to-r from-primary to-accent" : "bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/60")} />
                                        <CardHeader className="pb-3 pt-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs text-muted-foreground font-mono">WS_{ws.id}</span>
                                                    <h3 className="font-semibold text-sm mt-1 group-hover:text-primary transition-colors leading-snug line-clamp-2">{ws.name}</h3>
                                                </div>
                                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                                                    tab === "upcoming" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                                                    {tab === "upcoming" ? "Upcoming" : "Completed"}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0 space-y-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <User className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{ws.trainer_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    {new Date(ws.start_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                <div className="text-xs text-muted-foreground">
                                                    <span className="text-foreground font-semibold text-base">{ws.number_of_users}</span> enrolled
                                                </div>
                                                <div className="flex gap-2">
                                                    {tab === "upcoming" && (
                                                        <Button size="sm" variant="ghost" className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1.5 px-2" onClick={() => generateCoupons(ws.id)} title="Generate Bulk Coupons">
                                                            <Gift className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Link href={`/workshops/${ws.id}/enrollments`}>
                                                        <Button size="sm" variant="outline" className="group/btn gap-1.5 text-xs">
                                                            View<ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Suggestion Modal Form */}
            <AnimatePresence>
                {showSuggestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-border">
                            <button onClick={() => setShowSuggestModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Request Custom Workshop</h3>
                                        <p className="text-xs text-muted-foreground">Suggest a training topic for your teachers</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Topic / Subject</label>
                                        <Input 
                                            placeholder="e.g. NEP 2020 Implementation Strategies" 
                                            value={suggestionForm.topic} 
                                            onChange={e => setSuggestionForm({...suggestionForm, topic: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Preferred Trainer (Optional)</label>
                                        <Input 
                                            placeholder="e.g. Dr. John Doe" 
                                            value={suggestionForm.trainer} 
                                            onChange={e => setSuggestionForm({...suggestionForm, trainer: e.target.value})} 
                                        />
                                    </div>
                                    <Button 
                                        className="w-full mt-4" 
                                        disabled={!suggestionForm.topic || submittingSuggestion} 
                                        onClick={submitSuggestion}
                                    >
                                        {submittingSuggestion ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
