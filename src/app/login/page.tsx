"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { refreshSession } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                await refreshSession();
                router.push("/dashboard");
            } else {
                setError(data.error || "Invalid credentials");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left – Decorative */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[hsl(239,80%,18%)] via-[hsl(255,70%,24%)] to-[hsl(220,80%,18%)]">
                {/* Animated orbs */}
                <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse-ring" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl" />
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />

                <div className="relative z-10 flex flex-col justify-center items-start p-14 max-w-[520px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="mb-8">
                            <img src="/logo-rectangular.png" alt="IPN Academy" className="h-12 w-auto object-contain" />
                        </div>
                        <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
                            School Portal
                        </h1>
                        <p className="text-white/60 text-base leading-relaxed mb-10">
                            Your centralized platform to manage teacher enrollments, track workshop participation, and issue certificates.
                        </p>

                        <div className="space-y-3">
                            {[
                                "Track workshop enrollments & attendance",
                                "Manage teacher certifications easily",
                                "Real-time analytics & reporting",
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                                    className="flex items-center gap-3 text-sm text-white/70"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    {feature}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right – Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-sm"
                >
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <img src="/logo-icon.png" alt="IPN Academy" className="h-10 w-10 object-contain" />
                        <h1 className="text-xl font-display font-bold">IPN Academy</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-display font-bold">Welcome back</h2>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Sign in to your school admin portal
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@yourschool.edu"
                                    className="pl-9 h-11"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9 pr-10 h-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Button type="submit" className="w-full h-11 gap-2 text-base" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                            Powered by{" "}
                            <a href="https://ipnacademy.in" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                                IPN Academy
                            </a>
                            {" "}— A Verified Training Partner
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
