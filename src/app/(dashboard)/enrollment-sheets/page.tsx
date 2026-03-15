"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Download, BookOpen, ExternalLink, Search, FileWarning, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Sheet {
    link: string; workshop_id: string; workshop_table_id: number;
    name: string; type: number; start_date: string; trainer_name: string;
}

export default function EnrollmentSheetsPage() {
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);

        fetch(`/api/enrollment-sheets?${params}`)
            .then(r => r.json())
            .then(d => setSheets(d.sheets || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search]);

    const exportAll = () => {
        const headers = ["Workshop ID", "Workshop Name", "Trainer", "Date", "Status", "Link"];
        const rows = sheets.map(s => [
            s.workshop_id, s.name, s.trainer_name,
            new Date(s.start_date).toLocaleDateString("en-IN"),
            s.type === 0 ? "Upcoming" : "Completed",
            `http://workshops.ipnacademy.in/${s.link.replace(/^\//, "")}`,
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `enrollment-sheets.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const upcomingSheets = sheets.filter(s => s.type === 0);
    const completedSheets = sheets.filter(s => s.type === 1);

    const renderTable = (data: Sheet[], title: string, icon: React.ReactNode, emptyMessage: string, theme: "blue" | "emerald") => (
        <Card className="overflow-hidden border-t-4" style={{ borderTopColor: theme === 'blue' ? '#3b82f6' : '#10b981' }}>
            <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                    {icon} {title} ({data.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {["Sno.", "Workshop Name", "Date", "Link"].map(col => (
                                    <th key={col} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 first:pl-6 last:pr-6">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                                        <FileWarning className="h-8 w-8 opacity-20 mx-auto mb-2" />
                                        <p>{emptyMessage}</p>
                                    </td>
                                </tr>
                            ) : (
                                data.map((sheet, i) => (
                                    <motion.tr key={`${sheet.workshop_id}-${i}`}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="py-4 pl-6 pr-4 text-muted-foreground text-xs font-bold">{i + 1}</td>
                                        <td className="py-4 px-4 font-semibold text-sm">{sheet.name}</td>
                                        <td className="py-4 px-4 text-xs font-medium text-muted-foreground">
                                            {new Date(sheet.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="py-4 px-4 pr-6">
                                            <a
                                                href={`http://workshops.ipnacademy.in/${sheet.link.replace(/^\//, "")}`}
                                                target="_blank" rel="noreferrer"
                                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                                                    theme === 'blue' ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                                }`}
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" /> Share Link
                                            </a>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 pb-12">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
                <div>
                    <h2 className="text-3xl font-display font-black tracking-tight">Enrollment Sheets</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Workshop registration links specifically assigned to your school.</p>
                </div>
                <Button onClick={exportAll} variant="default" className="gap-2 shrink-0 rounded-xl shadow-md border border-primary/20 bg-primary/95 hover:bg-primary">
                    <Download className="h-4 w-4" /> Export All Data
                </Button>
            </motion.div>

            {/* Global Search */}
            <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search upcoming or completed workshops..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-12 rounded-2xl bg-muted/30 border-muted-foreground/20 font-medium" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        {renderTable(upcomingSheets, "Upcoming Workshops", <BookOpen className="w-5 h-5 text-blue-500" />, "No upcoming enrollment sheets.", "blue")}
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        {renderTable(completedSheets, "Completed Workshops", <CheckCircle2 className="w-5 h-5 text-emerald-500" />, "No completed workshops yet.", "emerald")}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
