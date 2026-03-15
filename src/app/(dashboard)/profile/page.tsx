"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Tag, Lock, CheckCircle2, GraduationCap, Loader2, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface SchoolProfile {
    id: number; name: string; email: string; mobile: string;
    coupon_prefix: string; image: string | null;
}

export default function ProfilePage() {
    const { refreshSession } = useAuth();
    const [profile, setProfile] = useState<SchoolProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [couponPrefix, setCouponPrefix] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);

    useEffect(() => {
        fetch("/api/profile")
            .then(r => r.json())
            .then(d => {
                const s = d.school;
                if (s) {
                    setProfile(s);
                    setName(s.name || "");
                    setEmail(s.email || "");
                    setMobile(s.mobile || "");
                    setCouponPrefix(s.coupon_prefix || "");
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setSaved(false);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, mobile, coupon_prefix: couponPrefix, password }),
            });
            if (res.ok) {
                setSaved(true);
                setPassword("");
                await refreshSession();
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error("Profile update error:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* School Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-display font-bold">{name || "School Profile"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Verified Partner
                        </span>
                    </div>
                </div>
            </motion.div>

            <form onSubmit={handleSave} className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                School Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">School Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9 h-11" required />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="mobile" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Phone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="pl-9 h-11" required />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="coupon" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Coupon Prefix</Label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="coupon" value={couponPrefix} onChange={(e) => setCouponPrefix(e.target.value)} className="pl-9 h-11" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="overflow-hidden">
                        <CardHeader 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setIsPasswordOpen(!isPasswordOpen)}
                        >
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Lock className="h-4 w-4 text-primary" />
                                    Change Password
                                </CardTitle>
                                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isPasswordOpen ? "rotate-180" : "")} />
                            </div>
                        </CardHeader>
                        <AnimatePresence initial={false}>
                            {isPasswordOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CardContent className="pt-0">
                                        <div className="space-y-1.5 pt-2">
                                            <Label htmlFor="password" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                                                New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="flex items-center gap-4">
                    <Button type="submit" className="gap-2 h-11" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    {saved && (
                        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" /> Saved successfully!
                        </motion.span>
                    )}
                </motion.div>
            </form>
        </div>
    );
}
