"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardList,
    Settings,
    LogOut,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    Award,
    UserCheck,
    BarChart3,
    CalendarDays,
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/teachers", icon: Users, label: "Teachers" },
    { href: "/workshops", icon: BookOpen, label: "Workshops" },
    { href: "/calendar", icon: CalendarDays, label: "Calendar" },
    { href: "/enrollment-sheets", icon: ClipboardList, label: "Enrollment Sheets" },
    { href: "/certificates", icon: Award, label: "Certificates" },
    { href: "/verification", icon: UserCheck, label: "Verification Portal" },
    { href: "/reports", icon: BarChart3, label: "Advanced Reports" },
    { href: "/profile", icon: Settings, label: "Profile & Settings" },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative hidden lg:flex flex-col h-screen sidebar-bg border-r border-white/[0.08] z-40 shrink-0 overflow-hidden"
        >
            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08]">
                <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center">
                    <img src="/logo-icon.png" alt="IPN Icon" className="w-8 h-8 object-contain" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col min-w-0"
                        >
                            <span className="text-white font-display font-bold text-sm leading-tight truncate">
                                IPN Academy
                            </span>
                            <span className="text-white/50 text-xs truncate">School Portal</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
                {navItems.map((item, index) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary/80 text-white shadow-lg shadow-primary/30"
                                        : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 rounded-xl bg-primary/80 -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon
                                    className={cn(
                                        "shrink-0 transition-transform duration-200",
                                        isActive ? "text-white" : "group-hover:scale-110"
                                    )}
                                    size={18}
                                />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="truncate"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-2 py-4 border-t border-white/[0.08]">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-200 group"
                >
                    <LogOut className="shrink-0 group-hover:scale-110 transition-transform" size={18} />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-sidebar border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-primary transition-all duration-200 shadow-md z-50"
            >
                {collapsed ? (
                    <ChevronRight className="h-3 w-3" />
                ) : (
                    <ChevronLeft className="h-3 w-3" />
                )}
            </button>
        </motion.aside>
    );
}
