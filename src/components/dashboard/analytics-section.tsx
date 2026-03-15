"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Award, Target, Trophy, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface Engagement {
    name: string;
    email: string;
    total_duration: number;
}

interface Leaderboard {
    name: string;
    email: string;
    score: number;
}

interface SkillGap {
    category: string;
    performance: number;
}

export function AnalyticsSection() {
    const [engagement, setEngagement] = useState<Engagement[]>([]);
    const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
    const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const [engRes, leadRes, skillRes] = await Promise.all([
                    fetch("/api/dashboard/engagement"),
                    fetch("/api/dashboard/leaderboard"),
                    fetch("/api/dashboard/skill-gaps")
                ]);

                if (engRes.ok) {
                    const d = await engRes.json();
                    setEngagement(d.engagement || []);
                }
                if (leadRes.ok) {
                    const d = await leadRes.json();
                    setLeaderboard(d.leaderboard || []);
                }
                if (skillRes.ok) {
                    const d = await skillRes.json();
                    setSkillGaps(d.skillGaps || []);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-[400px] flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            {/* Teacher Engagement Leaderboard */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Engagement Leaders
                        </CardTitle>
                        <CardDescription>Top teachers by session duration (mins)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {engagement.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No engagement data</p>
                        ) : (
                            engagement.slice(0, 5).map((user, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-blue-600">{user.total_duration}</p>
                                        <p className="text-[10px] text-muted-foreground">mins</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Assessment Leaderboard */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Top Performers
                        </CardTitle>
                        <CardDescription>Highest MCQ Assessment Scores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {leaderboard.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No assessment data</p>
                        ) : (
                            leaderboard.slice(0, 5).map((user, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-sm font-bold text-amber-600">{user.score}</span>
                                        <Award className="h-4 w-4 text-amber-500" />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Skill Gaps Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Target className="h-4 w-4 text-emerald-500" />
                            School-Wide Skill Gaps
                        </CardTitle>
                        <CardDescription>Topic performance correctness %</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full mt-2">
                        {skillGaps.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground">No assessment data to analyze</p>
                            </div>
                        ) : skillGaps.length >= 3 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillGaps}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="category" tick={{ fill: 'currentColor', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Radar name="Performance %" dataKey="performance" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                    <RechartsTooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={skillGaps} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 11 }} />
                                    <RechartsTooltip />
                                    <Bar dataKey="performance" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
