"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SchoolSession {
    userid: number;
    name: string;
    email: string;
    mobile: string;
    coupon_prefix: string;
    image: string | null;
    token: string;
}

interface AuthContextType {
    school: SchoolSession | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [school, setSchool] = useState<SchoolSession | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshSession = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/session");
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setSchool(data.school);
                } else {
                    setSchool(null);
                }
            } else {
                setSchool(null);
            }
        } catch {
            setSchool(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setSchool(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ school, loading, logout, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
