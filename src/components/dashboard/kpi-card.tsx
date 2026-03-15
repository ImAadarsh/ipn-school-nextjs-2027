"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    title: string;
    value: number;
    suffix?: string;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    color: "blue" | "purple" | "green" | "orange";
    delay?: number;
}

const colorConfig = {
    blue: {
        bg: "from-blue-600/20 to-indigo-600/10",
        border: "border-blue-500/20",
        icon: "bg-blue-500/20 text-blue-400",
        value: "text-blue-400",
        glow: "hover:shadow-blue-500/10",
    },
    purple: {
        bg: "from-purple-600/20 to-pink-600/10",
        border: "border-purple-500/20",
        icon: "bg-purple-500/20 text-purple-400",
        value: "text-purple-400",
        glow: "hover:shadow-purple-500/10",
    },
    green: {
        bg: "from-emerald-600/20 to-teal-600/10",
        border: "border-emerald-500/20",
        icon: "bg-emerald-500/20 text-emerald-400",
        value: "text-emerald-400",
        glow: "hover:shadow-emerald-500/10",
    },
    orange: {
        bg: "from-amber-600/20 to-orange-600/10",
        border: "border-amber-500/20",
        icon: "bg-amber-500/20 text-amber-400",
        value: "text-amber-400",
        glow: "hover:shadow-amber-500/10",
    },
};

function AnimatedNumber({ value }: { value: number }) {
    const spring = useSpring(0, { stiffness: 80, damping: 20 });
    const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
}

export function KpiCard({
    title,
    value,
    suffix = "",
    icon: Icon,
    trend,
    color,
    delay = 0,
}: KpiCardProps) {
    const cfg = colorConfig[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
        >
            <Card
                className={cn(
                    "relative overflow-hidden border transition-all duration-300 cursor-default",
                    cfg.border,
                    `hover:shadow-xl ${cfg.glow}`
                )}
            >
                {/* Background gradient */}
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-60",
                        cfg.bg
                    )}
                />

                <div className="relative p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                {title}
                            </p>
                            <div className={cn("text-3xl font-display font-bold", cfg.value)}>
                                <AnimatedNumber value={value} />
                                {suffix && (
                                    <span className="text-lg font-medium ml-0.5">{suffix}</span>
                                )}
                            </div>
                            {trend && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    <span
                                        className={
                                            trend.value >= 0 ? "text-emerald-400" : "text-red-400"
                                        }
                                    >
                                        {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                                    </span>{" "}
                                    {trend.label}
                                </p>
                            )}
                        </div>
                        <div
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ml-4",
                                cfg.icon
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
