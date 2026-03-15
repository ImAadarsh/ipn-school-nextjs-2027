"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, BookOpen, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Workshop {
    id: number;
    name: string;
    start_date: string;
    type: number; // 0 = Upcoming, 1 = Completed
    trainer_name: string;
}

export default function CalendarPage() {
    const [enrolled, setEnrolled] = useState<Workshop[]>([]);
    const [notEnrolled, setNotEnrolled] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<"enrolled" | "not_enrolled">("enrolled");
    const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1">("all");
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetch("/api/calendar")
            .then(r => r.json())
            .then(d => {
                setEnrolled(d.enrolled || []);
                setNotEnrolled(d.notEnrolled || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const activeWorkshops = activeTab === "enrolled" ? enrolled : notEnrolled;

    const filteredWorkshops = useMemo(() => {
        return activeWorkshops.filter(w => {
            if (statusFilter === "all") return true;
            return w.type.toString() === statusFilter;
        });
    }, [activeWorkshops, statusFilter]);

    // --- Calendar Logic ---
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Group workshops by date string "YYYY-MM-DD"
    const workshopsByDate = useMemo(() => {
        const map: Record<string, Workshop[]> = {};
        filteredWorkshops.forEach(w => {
            const d = new Date(w.start_date);
            // using local YYYY-MM-DD
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!map[key]) map[key] = [];
            map[key].push(w);
        });
        return map;
    }, [filteredWorkshops]);

    // Build grid cells
    const calendarCells = [];
    let dayCounter = 1;
    
    // Max 6 rows (42 cells total for a typical month view)
    for (let i = 0; i < 42; i++) {
        if (i < firstDay || dayCounter > daysInMonth) {
            calendarCells.push(
                <div key={`empty-${i}`} className="min-h-[120px] bg-muted/10 border-b border-r border-border/50 p-2" />
            );
        } else {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
            const todaysDateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
            const isToday = dateStr === todaysDateStr;
            const dayWorkshops = workshopsByDate[dateStr] || [];

            calendarCells.push(
                <div key={`day-${dayCounter}`} className={cn("min-h-[120px] border-b border-r border-border/50 p-2 transition-colors hover:bg-muted/10 flex flex-col gap-1.5", isToday && "bg-primary/5")}>
                    <div className="flex justify-between items-start">
                        <span className={cn("text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>
                            {dayCounter}
                        </span>
                        {dayWorkshops.length > 0 && (
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{dayWorkshops.length} events</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                        {dayWorkshops.map(w => (
                            <div key={w.id} className={cn(
                                "text-xs px-2 py-1 rounded truncate border w-full text-left transition-colors cursor-pointer",
                                w.type === 0 
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20" 
                                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            )} title={`${w.name} (ID: ${w.id})\nTrainer: ${w.trainer_name}`}>
                                <span className="font-semibold">{w.type === 0 ? "Upcoming" : "Done"}:</span> {w.name}
                            </div>
                        ))}
                    </div>
                </div>
            );
            dayCounter++;
        }
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-display font-bold">Training Calendar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Interactive month view of Upcoming and recent Completed (last 6 mo) workshops.
                    </p>
                </div>
            </motion.div>

            {/* Main Tabs */}
            <div className="flex flex-wrap lg:flex-nowrap justify-between gap-4 items-center">
                <div className="flex p-1 bg-muted/50 rounded-xl overflow-x-auto scrollbar-hide w-fit border border-border shrink-0">
                    <button
                        onClick={() => setActiveTab("enrolled")}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0",
                            activeTab === "enrolled"
                                ? "bg-background text-primary shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        <BookOpen className="h-4 w-4" /> Enrolled by School
                    </button>
                    <button
                        onClick={() => setActiveTab("not_enrolled")}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0",
                            activeTab === "not_enrolled"
                                ? "bg-background text-primary shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        <CalendarDays className="h-4 w-4" /> Discover New Workshops
                    </button>
                </div>

                <div className="flex gap-2 shrink-0">
                    {[
                        { value: "all" as const, label: "All" },
                        { value: "0" as const, label: "Upcoming" },
                        { value: "1" as const, label: "Completed" },
                    ].map((opt) => (
                        <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                            className={cn("px-4 py-2 rounded-lg text-xs font-medium border transition-all",
                                statusFilter === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                </div>
            ) : (
                <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
                    {/* Calendar Header UI */}
                    <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold font-display w-[160px]">{monthNames[currentMonth]} {currentYear}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={goToToday} className="mr-2 hidden sm:flex">Today</Button>
                            <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 bg-card">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 bg-card">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-card">
                        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
                            {dayNames.map(day => (
                                <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 border-l border-t border-border/50">
                            {calendarCells}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
