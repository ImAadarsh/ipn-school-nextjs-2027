"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, ExternalLink, Bell, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardList,
    Settings,
    LogOut,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/teachers", icon: Users, label: "Teachers" },
    { href: "/workshops", icon: BookOpen, label: "Workshops" },
    { href: "/enrollment-sheets", icon: ClipboardList, label: "Enrollment Sheets" },
    { href: "/profile", icon: Settings, label: "Settings" },
];

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/teachers": "Teachers",
    "/workshops": "Workshops",
    "/enrollment-sheets": "Enrollment Sheets",
    "/profile": "Profile & Settings",
};

export function Header() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { school, logout } = useAuth();

    const schoolName = school?.name || "School Portal";
    const title =
        Object.entries(pageTitles).find(([k]) => pathname === k || pathname.startsWith(k + "/"))?.[1] || "Dashboard";

    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Page title */}
                <div className="flex-1">
                    <h1 className="text-lg font-display font-bold gradient-text">{title}</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">{schoolName}</p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    <Link
                        href="https://ipnacademy.in"
                        target="_blank"
                        className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-3 py-1.5 border border-border hover:border-primary/30 hover:bg-primary/5"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        IPN Academy
                    </Link>

                    <Button variant="ghost" size="icon" className="relative rounded-full">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></span>
                    </Button>

                    <ThemeToggle />

                    <div className="flex items-center gap-2.5 ml-2 pl-2 border-l border-border">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-md">
                            {schoolName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-semibold leading-tight">{schoolName}</p>
                            <p className="text-[10px] text-muted-foreground">Admin</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-64 sidebar-bg z-50 lg:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 py-5 border-b border-white/[0.08]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 flex items-center justify-center">
                                        <img src="/logo-icon.png" alt="IPN Icon" className="w-8 h-8 object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">IPN Academy</p>
                                        <p className="text-white/50 text-xs">School Portal</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white hover:bg-white/10">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <nav className="flex-1 py-4 px-2 space-y-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                                isActive
                                                    ? "bg-primary/80 text-white"
                                                    : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                                            )}
                                        >
                                            <item.icon size={18} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="px-2 py-4 border-t border-white/[0.08]">
                                <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
