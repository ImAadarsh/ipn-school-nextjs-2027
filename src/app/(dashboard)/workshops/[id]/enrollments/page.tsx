"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, Download, CheckCircle2, XCircle, Clock, Award, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { use } from "react";

interface Enrollment {
    payment_id: number; user_id: number; is_attended: number; is_school: number;
    order_id: string; user_name: string; email: string; mobile: string; attended_duration: number;
}
interface Workshop {
    id: number; name: string; start_date: string; type: number;
    trainer_name: string; meeting_id: string;
}

function getDurationBadge(dur: number) {
    if (dur >= 60) return { label: `${Math.round(dur)} min`, class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    if (dur >= 30) return { label: `${Math.round(dur)} min`, class: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    if (dur > 0) return { label: `${Math.round(dur)} min`, class: "bg-red-500/10 text-red-600 dark:text-red-400" };
    return { label: "–", class: "bg-muted text-muted-foreground" };
}

const COLORS = [
    "from-blue-500 to-indigo-600", "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
    "from-rose-500 to-red-600", "from-cyan-500 to-blue-600",
];

export default function EnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const workshopId = id;

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [search, setSearch] = useState("");
    const [attendedFilter, setAttendedFilter] = useState<"" | "1" | "0">("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/workshops/${workshopId}/enrollments`)
            .then(r => r.json())
            .then(d => {
                setEnrollments(d.enrollments || []);
                setWorkshop(d.workshop || null);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [workshopId]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return enrollments.filter(e => {
            const nameMatch = !q || e.user_name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.mobile?.includes(q);
            const attendMatch = attendedFilter === "" || String(e.is_attended) === attendedFilter;
            return nameMatch && attendMatch;
        });
    }, [enrollments, search, attendedFilter]);

    const toggleCertificate = async (paymentId: number, currentVal: number) => {
        const action = currentVal === 2 ? "disable" : "enable";
        try {
            await fetch(`/api/workshops/${workshopId}/enrollments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, action }),
            });
            setEnrollments(prev =>
                prev.map(e => e.payment_id === paymentId ? { ...e, is_school: action === "enable" ? 2 : 1 } : e)
            );
        } catch (err) { console.error("Toggle failed:", err); }
    };

    const exportCsv = () => {
        const headers = ["Name", "Email", "Mobile", "Attended", "Duration", "Certificate"];
        const rows = filtered.map(e => [
            e.user_name, e.email, e.mobile,
            e.is_attended ? "Yes" : "No",
            `${Math.round(e.attended_duration)} min`,
            e.is_school === 2 ? "Enabled" : "Disabled",
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `enrollments-ws-${workshopId}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/workshops">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-display font-bold">Workshop Enrollments</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{workshop?.name || `Workshop #${workshopId}`}</p>
                    </div>
                </div>
                <Button onClick={exportCsv} variant="outline" className="gap-2 shrink-0">
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>

            {workshop && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 flex flex-wrap gap-4">
                    <div className="text-sm"><span className="text-muted-foreground">Workshop ID: </span><span className="font-medium">WS_{workshop.id}</span></div>
                    <div className="text-sm"><span className="text-muted-foreground">Trainer: </span><span className="font-medium">{workshop.trainer_name}</span></div>
                    <div className="text-sm"><span className="text-muted-foreground">Date: </span><span className="font-medium">{new Date(workshop.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                    <div className="text-sm"><span className="text-muted-foreground">Enrolled: </span><span className="font-semibold text-primary">{enrollments.length} teachers</span></div>
                </motion.div>
            )}

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <div className="flex gap-2">
                            {[
                                { value: "" as const, label: "All", Icon: Filter },
                                { value: "1" as const, label: "Attended", Icon: CheckCircle2 },
                                { value: "0" as const, label: "Not Attended", Icon: XCircle },
                            ].map((opt) => (
                                <button key={opt.value} onClick={() => setAttendedFilter(opt.value)}
                                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                                        attendedFilter === opt.value ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                                    <opt.Icon className="h-3.5 w-3.5" /> {opt.label}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{filtered.length} results</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader className="pb-0"><CardTitle className="text-base">Teacher Participants</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        {["#", "Teacher", "Email", "Phone", "Attended?", "Duration", "Certificate"].map(col => (
                                            <th key={col} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 first:pl-6 last:pr-6">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <motion.tbody layout>
                                    <AnimatePresence>
                                        {filtered.length === 0 ? (
                                            <tr key="empty">
                                                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                                                    <CheckCircle2 className="h-8 w-8 opacity-20 mx-auto mb-2" /><p>No enrollments found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((enr, i) => {
                                                const durBadge = getDurationBadge(enr.attended_duration);
                                                return (
                                                    <motion.tr key={enr.payment_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.03 }}
                                                        className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                                                        <td className="py-3 pl-6 pr-4 text-muted-foreground text-xs">{i + 1}</td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                                    {(enr.user_name || "?").charAt(0)}
                                                                </div>
                                                                <span className="font-medium text-sm group-hover:text-primary transition-colors">{enr.user_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-muted-foreground">{enr.email}</td>
                                                        <td className="py-3 px-4 text-xs text-muted-foreground">{enr.mobile}</td>
                                                        <td className="py-3 px-4">
                                                            {enr.is_attended ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle2 className="h-3 w-3" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                                    <XCircle className="h-3 w-3" /> No
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", durBadge.class)}>
                                                                <Clock className="h-3 w-3" /> {durBadge.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 pr-6">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => toggleCertificate(enr.payment_id, enr.is_school)}
                                                                    className={cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
                                                                        enr.is_school === 2 ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                                                                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20")}>
                                                                    {enr.is_school === 2 ? "Disable" : "Enable"}
                                                                </button>
                                                                {enr.is_school === 2 && (
                                                                    <a href={`https://ipnacademy.in/user/certificate.php?id=${enr.order_id}`} target="_blank" rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all">
                                                                        <Award className="h-3 w-3" /> View
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })
                                        )}
                                    </AnimatePresence>
                                </motion.tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
