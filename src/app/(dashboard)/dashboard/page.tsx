"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Activity, Award, Calendar, TrendingUp, CheckCircle2, Clock, Star, Zap, Target, Layers, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from "@/lib/auth-context";

interface DashboardData {
    stats: any;
    charts: any;
    topTeachers: any[];
}

export default function DashboardPage() {
    const { school } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

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
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-6 lg:space-y-8 min-h-screen pb-12">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
                
                {/* Header Welcome */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6 dark:border-slate-800">
                    <div>
                        <h1 className="text-3xl font-display font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
                            {school?.name || "School Overview"}
                        </h1>
                        <p className="text-muted-foreground mt-1">Advanced Academy Analytics Dashboard</p>
                    </div>
                </motion.div>

                {/* 14 KPI Cards Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard title="Total Teachers" value={stats.totalTeachers} icon={<Users />} trend="Registered" color="blue" description="Educators registered under your IPN school." />
                    <StatCard title="Active Learners" value={stats.activeLearners} icon={<Activity />} trend="Engaged" color="green" description="Teachers who started or completed workshops." />
                    <StatCard title="Total Enrollments" value={stats.totalEnrollments} icon={<BookOpen />} trend="All Time" color="purple" description="Lifetime workshop enrollments by your staff." />
                    <StatCard title="Total Assessments" value={stats.totalAssessments} icon={<Target />} trend="Completed" color="amber" description="Test submissions by teachers." />
                    
                    <StatCard title="Top Assessment Giver" value={stats.topAssessmentGiver?.assessments_given || 0} icon={<Award />} trend={stats.topAssessmentGiver?.full_name?.split(' ')[0] || "None"} color="pink" description="The teacher answering the most quizzes." />
                    <StatCard title="LIVE Completion" value={`${stats.completionRate}%`} icon={<CheckCircle2 />} trend="Success" color="orange" description="Percentage of enrollments resulting in a certificate." />
                    <StatCard title="CPD Hours Earned" value={stats.totalCPDEarned} icon={<Zap />} trend="Impact" color="pink" description="Continuous Professional Development hours total." />
                    <StatCard title="Avg Rating" value={stats.avgRating} icon={<Star />} trend="Feedback" color="teal" description="Average workshop rating by your teachers." />
                    
                    <StatCard title="Avg CPD / Teacher" value={stats.avgCPDPerTeacher} icon={<BarChart2 />} trend="Per Capita" color="indigo" description="Average CPD hours per educator." />
                    <StatCard title="Certificates Issued" value={stats.certificatesIssued} icon={<Award />} trend="Achievements" color="cyan" description="Total certificates generated." />
                    <StatCard title="Avg Join Time" value={`${stats.avgJoinTime}m`} icon={<TrendingUp />} trend="Participation" color="amber" description="Average time spent in LIVE sessions." />
                    <StatCard title="Learning Hours" value={`${stats.totalLearningHours}h`} icon={<Clock />} trend="Time Spent" color="rose" description="Total aggregated learning hours." />
                    
                    <StatCard title="Assigned Workshops" value={stats.totalWorkshops} icon={<Layers />} trend="Available" color="emerald" description="Total unique workshops accessed." />
                    <StatCard title="Total Feedback" value={stats.totalFeedback} icon={<Star />} trend="Reviews" color="violet" description="Workshops reviewed by teachers." />
                </motion.div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Activity Bar Chart */}
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
                                    <Tooltip cursor={{fill: 'hsl(var(--muted)/0.3)'}} contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Bar dataKey="visits" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Top Learners List */}
                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6 overflow-hidden">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-amber-500" /> CPD Leaderboard
                        </h3>
                        <div className="space-y-4">
                            {topTeachers.length > 0 ? topTeachers.map((teacher: any, idx: number) => (
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
                            )) : <p className="text-center text-muted-foreground py-8">No CPD data yet.</p>}
                        </div>
                    </motion.div>

                    {/* Status Pie Chart */}
                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Completion Rate
                        </h3>
                        <div className="h-[250px] w-full flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={[
                                        { name: 'Completed', value: stats.statusDistribution.attended },
                                        { name: 'Pending', value: stats.statusDistribution.enrolled }
                                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                                        <Cell fill="#10b981" />
                                        <Cell fill="#64748b" />
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-2">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"/> <span className="text-xs font-semibold">Completed</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"/> <span className="text-xs font-semibold">Pending</span></div>
                        </div>
                    </motion.div>

                    {/* Demographics Bar */}
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
                                    <Tooltip cursor={{fill: 'hsl(var(--muted)/0.3)'}} contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Skill Distribution */}
                    <motion.div variants={itemVariants} className="bg-card rounded-3xl border shadow-sm p-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Layers className="w-5 h-5 text-purple-500" /> Skill Domains
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={charts.categoryDistribution.length ? charts.categoryDistribution : [{name: "General", count: 1}]}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                    <Radar name="Enrollments" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* CPD Cumulative Area */}
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
                                    <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Area type="monotone" dataKey="cpd" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorCpd)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// Beautiful 10x 3D Fliping Glassmorphic KPI Card
// ----------------------------------------------------------------------------
function StatCard({ title, value, icon, trend, color, description }: any) {
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
        <motion.div whileHover={{ y: -6, scale: 1.02 }} className="group h-36 lg:h-40 w-full perspective-1000 cursor-pointer">
            <div className="relative h-full w-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">
                
                {/* Front Face */}
                <div className="absolute inset-0 backface-hidden overflow-hidden rounded-3xl bg-card border shadow-sm">
                    {/* Glowing Orbs */}
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradients[color] || gradients.blue} blur-3xl opacity-60 dark:opacity-40 transition-opacity duration-500`} />
                    <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-tr ${gradients[color] || gradients.blue} blur-3xl opacity-40 dark:opacity-20 transition-opacity duration-500`} />

                    <div className="relative z-10 p-5 lg:p-6 flex flex-col justify-between h-full backdrop-blur-[2px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[11px] lg:text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                                <h3 className="text-3xl lg:text-4xl font-black mt-1 tracking-tighter">{value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-muted/50 dark:bg-slate-800 border shadow-sm ${textColors[color] || textColors.blue}`}>
                                {React.cloneElement(icon, { size: 22, strokeWidth: 2.5 })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm border ${textColors[color] || textColors.blue}`}>
                                {trend}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Back Face (Insight) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 overflow-hidden rounded-3xl bg-card border shadow-sm p-6 flex flex-col justify-center items-center text-center">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradients[color] || gradients.blue} opacity-20`} />
                    <div className="relative z-10">
                        <h4 className={`text-sm tracking-widest uppercase font-black mb-2 ${textColors[color] || textColors.blue}`}>Metric Insight</h4>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                            {description || "No description provided."}
                        </p>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
