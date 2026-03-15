"use client";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface DataPoint {
    month: string;
    count: number;
}

interface EnrollmentChartProps {
    data: DataPoint[];
}

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
                <p className="text-muted-foreground mb-1">{label}</p>
                <p className="font-semibold text-primary text-base">
                    {payload[0].value} enrollments
                </p>
            </div>
        );
    }
    return null;
};

export function EnrollmentChart({ data }: EnrollmentChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Enrollment Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Monthly teacher enrollments in IPN workshops
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(239, 74%, 58%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(239, 74%, 58%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(220, 13%, 91%)"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="hsl(239, 74%, 58%)"
                                strokeWidth={2.5}
                                fill="url(#colorCount)"
                                dot={{ fill: "hsl(239, 74%, 58%)", strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, fill: "hsl(239, 74%, 58%)" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
}
