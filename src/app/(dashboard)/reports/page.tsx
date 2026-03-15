"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, LineChart, MessageSquare, TrendingUp, IndianRupee, BrainCircuit, Activity, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type Tab = "sentiment" | "impact";

interface SentimentReport {
    workshop_name: string;
    report_content: string | null;
    avg_rating: number | null;
}

interface ImpactReport {
    workshop_name: string;
    score_percentage: number;
}



export default function ReportsPage() {
    const [tab, setTab] = useState<Tab>("impact");
    const [sentiment, setSentiment] = useState<SentimentReport[]>([]);
    const [impact, setImpact] = useState<ImpactReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/reports")
            .then(r => r.json())
            .then(d => {
                setSentiment(d.sentiment || []);
                setImpact(d.impact || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: "impact" as Tab, label: "Impact Analysis", icon: Activity },
        { id: "sentiment" as Tab, label: "AI Sentiment", icon: BrainCircuit },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-display font-bold">Advanced Reports & AI Insights</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Analyze training performance, AI sentiments, and school ROI.</p>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-xl w-fit">
                {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("relative px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2",
                            tab === t.id ? "text-white" : "text-muted-foreground hover:text-foreground")}>
                        {tab === t.id && (
                            <motion.div layoutId="reportTab" className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                        )}
                        <t.icon className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">{t.label}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                        

                        {/* Impact Analysis */}
                        {tab === "impact" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-amber-500" />
                                        Training Impact Comparison (Post-Training MCQ Scores)
                                    </CardTitle>
                                    <CardDescription>Average performance scores of your teachers segregated by workshop.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    {impact.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">No assessment data available</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={impact}  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="workshop_name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                                                <YAxis domain={[0, 100]} label={{ value: 'Avg Score %', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                                <Bar dataKey="score_percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Sentiment Reports */}
                        {tab === "sentiment" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sentiment.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-muted-foreground">
                                        <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No AI reports generated for your workshops yet.</p>
                                    </div>
                                ) : sentiment.map((s, i) => (
                                    <Card key={i} className="hover:border-primary/40 transition-colors h-full flex flex-col">
                                        <CardHeader className="pb-3 bg-muted/30">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-sm leading-tight line-clamp-2">{s.workshop_name}</CardTitle>
                                                {s.avg_rating && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                                                        {parseFloat(s.avg_rating.toString()).toFixed(1)} <Star className="h-3 w-3 fill-amber-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 flex-1">
                                            <div className="flex gap-2">
                                                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                                <p className="text-sm text-foreground/80 leading-relaxed italic line-clamp-4">
                                                    "{s.report_content || "No detailed qualitative analysis generated. Reviews indicate standard satisfaction."}"
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
