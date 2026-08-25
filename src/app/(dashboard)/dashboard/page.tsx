"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Activity, Award, TrendingUp, CheckCircle2, Clock, Star, Zap, Target, Layers, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { StatDetailsOverlay, type StatMetric } from "@/components/dashboard/stat-details-overlay";

interface DashboardData {
    stats: any;
    charts: any;
    topTeachers: any[];
}

export default function DashboardPage() {
    const { school } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [openMetric, setOpenMetric] = useState<StatMetric | null>(null);
    const [openValue, setOpenValue] = useState<string | number | undefined>();

    const openDetails = useCallback((metric: StatMetric, value?: string | number) => {
        setOpenMetric(metric);
        setOpenValue(value);
    }, []);

    const closeDetails = useCallback(() => {
        setOpenMetric(null);
        setOpenValue(undefined);
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const dashRes = await fetch("/api/dashboard");
                if (dashRes.ok) {
                    const d = await dashRes.json();
                    setData(d);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
        );
    }

    const { stats, charts, topTeachers } = data;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="space-y-6 lg:space-y-8 min-h-screen pb-12">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6 dark:border-slate-800">
                    <div>
                        <h1 className="text-3xl font-display font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
                            {school?.name || "School Overview"}
                        </h1>
                        <p className="text-muted-foreground mt-1">Advanced Academy Analytics Dashboard · Click any card to see the rows behind it</p>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard
                        title="Total Teachers"
                        value={stats.totalTeachers}
                        icon={<Users />}
                        trend="Registered"
                        color="blue"
                        description="Educators registered under your IPN school."
                        onClick={() => openDetails("teachers", stats.totalTeachers)}
                    />
                    <StatCard
                        title="Active Learners"
                        value={stats.activeLearners}
                        icon={<Activity />}
                        trend="Engaged"
                        color="green"
                        description="Teachers who started or completed workshops."
                        onClick={() => openDetails("activeLearners", stats.activeLearners)}
                    />
                    <StatCard
                        title="Total Enrollments"
                        value={stats.totalEnrollments}
                        icon={<BookOpen />}
                        trend="All Time"
                        color="purple"
                        description="Lifetime workshop enrollments by your staff."
                        onClick={() => openDetails("enrollments", stats.totalEnrollments)}
                    />
                    <StatCard
                        title="MCQ Quizzes"
                        value={stats.totalAssessments}
                        icon={<Target />}
                        trend="Completed"
                        color="amber"
                        description="Workshop MCQ quiz submissions by your teachers."
                        onClick={() => openDetails("assessments", stats.totalAssessments)}
                    />

                    <StatCard
                        title="Top Quiz Taker"
                        value={stats.topAssessmentGiver?.assessments_given || 0}
                        icon={<Award />}
                        trend={stats.topAssessmentGiver?.full_name?.split(" ")[0] || "None"}
                        color="pink"
                        description="Teacher who completed the most workshop MCQ quizzes."
                        onClick={() => openDetails("topAssessmentGiver", stats.topAssessmentGiver?.assessments_given || 0)}
                    />
                    <StatCard
                        title="LIVE Completion"
                        value={`${stats.completionRate}%`}
                        icon={<CheckCircle2 />}
                        trend="Success"
                        color="orange"
                        description="Percentage of enrollments resulting in a certificate."
                        onClick={() => openDetails("completion", `${stats.completionRate}%`)}
                    />
                    <StatCard
                        title="CPD Hours Earned"
                        value={stats.totalCPDEarned}
                        icon={<Zap />}
                        trend="Impact"
                        color="pink"
                        description="Continuous Professional Development hours total."
                        onClick={() => openDetails("cpdHours", stats.totalCPDEarned)}
                    />
                    <StatCard
                        title="Avg Rating"
                        value={stats.avgRating}
                        icon={<Star />}
                        trend="Feedback"
                        color="teal"
                        description="Average workshop rating by your teachers."
                        onClick={() => openDetails("avgRating", stats.avgRating)}
                    />

                    <StatCard
                        title="Avg CPD / Teacher"
                        value={stats.avgCPDPerTeacher}
                        icon={<BarChart2 />}
                        trend="Per Capita"
                        color="indigo"
                        description="Average CPD hours per educator."
                        onClick={() => openDetails("avgCpdPerTeacher", stats.avgCPDPerTeacher)}
                    />
                    <StatCard
                        title="Certificates Issued"
                        value={stats.certificatesIssued}
                        icon={<Award />}
                        trend="Achievements"
                        color="cyan"
                        description="Total certificates generated."
                        onClick={() => openDetails("certificates", stats.certificatesIssued)}
                    />
                    <StatCard
                        title="Avg Join Time"
                        value={`${stats.avgJoinTime}m`}
                        icon={<TrendingUp />}
                        trend="Participation"
                        color="amber"
                        description="Average time spent in LIVE sessions."
                        onClick={() => openDetails("avgJoinTime", `${stats.avgJoinTime}m`)}
                    />
                    <StatCard
                        title="Learning Hours"
                        value={`${stats.totalLearningHours}h`}
                        icon={<Clock />}
                        trend="Time Spent"
                        color="rose"
                        description="Total aggregated learning hours."
                        onClick={() => openDetails("learningHours", `${stats.totalLearningHours}h`)}
                    />

                    <StatCard
                        title="Assigned Workshops"
                        value={stats.totalWorkshops}
                        icon={<Layers />}
                        trend="Available"
                        color="emerald"
                        description="Total unique workshops accessed."
                        onClick={() => openDetails("workshops", stats.totalWorkshops)}
                    />
                    <StatCard
                        title="Total Feedback"
                        value={stats.totalFeedback}
                        icon={<Star />}
                        trend="Reviews"
                        color="violet"
                        description="Workshops reviewed by teachers."
                        onClick={() => openDetails("feedback", stats.totalFeedback)}
                    />
                </motion.div>

                {charts.topWorkshops?.length > 0 && (
                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Layers className="w-5 h-5 text-emerald-500" /> Assigned workshops (enrollments from your staff)
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {charts.topWorkshops.map((w: { name: string; count: number }, i: number) => (
                                <div key={i} className="flex justify-between items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm">
                                    <span className="font-medium truncate" title={w.name}>{w.name}</span>
                                    <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{w.count}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-card rounded-3xl border shadow-sm p-6 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-blue-500" /> Learning Activity
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.monthlyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip cursor={{ fill: "hsl(var(--muted)/0.3)" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                    <Bar dataKey="visits" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6 overflow-hidden">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-amber-500" /> CPD Leaderboard
                        </h3>
                        <div className="space-y-4">
                            {topTeachers.length > 0 ? (
                                topTeachers.map((teacher: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                        <div className="w-10 h-10 rounded-full font-black text-white flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{teacher.name}</p>
                                            <p className="text-xs text-muted-foreground">{teacher.completed} certificates</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-amber-600 dark:text-amber-400">{teacher.cpd} hrs</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No CPD data yet.</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Completion Rate
                        </h3>
                        <div className="h-[250px] w-full flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "Completed", value: stats.statusDistribution.attended },
                                            { name: "Pending", value: stats.statusDistribution.enrolled },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#64748b" />
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" /> <span className="text-xs font-semibold">Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-400" /> <span className="text-xs font-semibold">Pending</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-indigo-500" /> Roles Overview
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.demographics} layout="vertical" margin={{ left: -20, right: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                    <Tooltip cursor={{ fill: "hsl(var(--muted)/0.3)" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Layers className="w-5 h-5 text-purple-500" /> Skill Domains
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={charts.categoryDistribution.length ? charts.categoryDistribution : [{ name: "General", count: 1 }]}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={false} axisLine={false} />
                                    <Radar name="Enrollments" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-3 bg-card rounded-3xl border shadow-sm p-6 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-pink-500" /> Cumulative CPD Hours Trend
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.cpdTrend}>
                                    <defs>
                                        <linearGradient id="colorCpd" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                    <Area type="monotone" dataKey="cpd" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorCpd)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <StatDetailsOverlay metric={openMetric} cardValue={openValue} onClose={closeDetails} />
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    trend,
    color,
    description,
    onClick,
}: {
    title: string;
    value: string | number;
    icon: React.ReactElement;
    trend: string;
    color: string;
    description: string;
    onClick: () => void;
}) {
    const gradients: Record<string, string> = {
        blue: "from-blue-500/30 to-blue-600/5",
        green: "from-green-500/30 to-green-600/5",
        purple: "from-purple-500/30 to-purple-600/5",
        orange: "from-orange-500/30 to-orange-600/5",
        pink: "from-pink-500/30 to-pink-600/5",
        teal: "from-teal-500/30 to-teal-600/5",
        indigo: "from-indigo-500/30 to-indigo-600/5",
        rose: "from-rose-500/30 to-rose-600/5",
        emerald: "from-emerald-500/30 to-emerald-600/5",
        cyan: "from-cyan-500/30 to-cyan-600/5",
        amber: "from-amber-500/30 to-amber-600/5",
        violet: "from-violet-500/30 to-violet-600/5",
        yellow: "from-yellow-500/30 to-yellow-600/5",
    };

    const textColors: Record<string, string> = {
        blue: "text-blue-600 dark:text-blue-400",
        green: "text-green-600 dark:text-green-400",
        purple: "text-purple-600 dark:text-purple-400",
        orange: "text-orange-600 dark:text-orange-400",
        pink: "text-pink-600 dark:text-pink-400",
        teal: "text-teal-600 dark:text-teal-400",
        indigo: "text-indigo-600 dark:text-indigo-400",
        rose: "text-rose-600 dark:text-rose-400",
        emerald: "text-emerald-600 dark:text-emerald-400",
        cyan: "text-cyan-600 dark:text-cyan-400",
        amber: "text-amber-600 dark:text-amber-400",
        violet: "text-violet-600 dark:text-violet-400",
        yellow: "text-yellow-600 dark:text-yellow-400",
    };

    return (
        <motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            title={`View rows for ${title}`}
            className="group h-36 lg:h-40 w-full text-left rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <div className="relative h-full w-full overflow-hidden rounded-3xl bg-card border shadow-sm transition-shadow group-hover:shadow-md">
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradients[color] || gradients.blue} blur-3xl opacity-60 dark:opacity-40`} />
                <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-tr ${gradients[color] || gradients.blue} blur-3xl opacity-40 dark:opacity-20`} />

                <div className="relative z-10 p-5 lg:p-6 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <p className="text-[11px] lg:text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                            <h3 className="text-3xl lg:text-4xl font-black mt-1 tracking-tighter tabular-nums">{value}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl bg-muted/50 dark:bg-slate-800 border shadow-sm shrink-0 ${textColors[color] || textColors.blue}`}>
                            {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, {
                                size: 22,
                                strokeWidth: 2.5,
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm border ${textColors[color] || textColors.blue}`}>
                            {trend}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            View rows
                        </span>
                    </div>
                </div>
                <span className="sr-only">{description}</span>
            </div>
        </motion.button>
    );
}
