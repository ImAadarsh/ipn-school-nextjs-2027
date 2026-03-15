"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, X, Mail, Phone, Building2, MapPin, Badge, FileText, Edit2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Teacher {
    id: number; name: string; email: string; mobile: string;
    designation: string; institute_name: string; city: string; total_cpd: number;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } } };

const COLORS = [
    "from-blue-500 to-indigo-600", "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
    "from-rose-500 to-red-600", "from-cyan-500 to-blue-600",
];

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);

    const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
    const [editForm, setEditForm] = useState<Partial<Teacher>>({});
    const [submittingEdit, setSubmittingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on new search
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchTeachers = () => {
        setLoading(true);
        fetch(`/api/teachers?page=${page}&limit=15&search=${encodeURIComponent(debouncedSearch)}`)
            .then(r => r.json())
            .then(d => {
                setTeachers(d.teachers || []);
                if (d.pagination) {
                    setTotalPages(d.pagination.totalPages);
                    setTotalRows(d.pagination.totalRows);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleEditSubmit = async () => {
        if (!editTeacher) return;
        setSubmittingEdit(true);
        setEditError("");
        try {
            const res = await fetch(`/api/teachers/${editTeacher.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) {
                setEditError(data.conflict || data.error || "Failed to update teacher information.");
            } else {
                setEditTeacher(null);
                setEditForm({});
                fetchTeachers(); // Refresh list
            }
        } catch (error) {
            console.error(error);
            setEditError("An unexpected error occurred. Please try again.");
        } finally {
            setSubmittingEdit(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* HER0 HEADER */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-300 text-xs font-black uppercase tracking-widest">Educator Directory</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                        School Network
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-md">
                        Manage your educators, track their 2026 NEP CPD compliance, and update active directory records in one place.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4 w-full md:w-auto overflow-hidden">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex-1 md:w-48 shadow-lg">
                        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Total Educators</p>
                        <p className="text-4xl font-black text-white">{totalRows}</p>
                    </div>
                    <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 flex-1 md:w-48 shadow-lg hidden sm:block">
                        <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider mb-1">Active Year</p>
                        <p className="text-3xl font-black text-emerald-400">2026</p>
                    </div>
                </div>
            </motion.div>

            {/* TOOLBAR */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex items-center transition-all focus-within:ring-2 focus-within:ring-blue-500/50">
                <Search className="w-5 h-5 text-slate-400 ml-3" />
                <input
                    className="w-full bg-transparent border-none outline-none focus:ring-0 px-4 py-2 font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    placeholder="Search educators by name, phone, email, or city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <AnimatePresence>
                    {search && (
                        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setSearch("")} className="mr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* TABLE CONTAINER */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                {loading ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-sm font-bold text-slate-400">Loading educators...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Educator</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Contact Details</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Location / Role</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">CPD Compliance (2026)</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <motion.tbody key={debouncedSearch + page} variants={container} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                <AnimatePresence>
                                    {teachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                                    <Users className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No educators found</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {debouncedSearch ? "Try adjusting your search criteria." : "There are no educators registered in this school."}
                                                </p>
                                                {debouncedSearch && (
                                                    <button onClick={() => setSearch("")} className="mt-4 text-blue-600 font-bold hover:underline text-sm">
                                                        Clear search filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        teachers.map((teacher, i) => {
                                            const progress = Math.min((teacher.total_cpd / 50) * 100, 100);
                                            const compliant = teacher.total_cpd >= 50;
                                            return (
                                                <motion.tr key={teacher.id} variants={item} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    {/* Educator */}
                                                    <td className="py-4 px-6 align-top">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm`}>
                                                                {(teacher.name || "?").charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight transition-colors">{teacher.name}</p>
                                                                <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                                                                    ID: IPN_{teacher.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Contact */}
                                                    <td className="py-4 px-6 align-top">
                                                        <div className="space-y-1.5">
                                                            <p className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {teacher.email || "—"}
                                                            </p>
                                                            <p className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {teacher.mobile || "—"}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    {/* Location / Role */}
                                                    <td className="py-4 px-6 align-top">
                                                        <div className="space-y-1.5">
                                                            <p className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                <Badge className="w-3.5 h-3.5 text-blue-500" /> {teacher.designation || "Educator"}
                                                            </p>
                                                            <p className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                <span className="truncate max-w-[140px]">{teacher.institute_name ? `${teacher.institute_name}, ${teacher.city}` : teacher.city || "—"}</span>
                                                            </p>
                                                        </div>
                                                    </td>
                                                    {/* CPD */}
                                                    <td className="py-4 px-6 align-top">
                                                        <div className="w-full max-w-[160px]">
                                                            <div className="flex justify-between text-xs mb-1.5">
                                                                <span className="font-bold text-slate-600 dark:text-slate-300">{teacher.total_cpd || 0} hrs</span>
                                                                <span className="font-bold text-slate-400">50 hrs</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                                <div className={cn("h-full rounded-full transition-all duration-1000", compliant ? "bg-emerald-500" : "bg-blue-500")}
                                                                    style={{ width: `${progress}%` }} />
                                                            </div>
                                                            {compliant && (
                                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-2 uppercase flex items-center gap-1 tracking-wider">
                                                                    <CheckCircle className="w-3 h-3" /> Fully Compliant
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="py-4 px-6 align-top text-right space-y-2">
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Link href={`/teachers/${teacher.id}/portfolio`} className="w-[120px] bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 transition-colors border border-blue-200 dark:border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                                                                <Award className="w-3.5 h-3.5" /> View Portfolio
                                                            </Link>
                                                            <button onClick={() => { setEditTeacher(teacher); setEditForm(teacher); setEditError(""); }}
                                                                className="w-[120px] bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                                                                <Edit2 className="w-3.5 h-3.5" /> Edit Info
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </motion.tbody>
                        </table>
                    </div>
                )}
                {/* Pagination Footer */}
                {!loading && totalPages > 1 && (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalRows)} of {" "}
                            <span className="text-slate-800 dark:text-slate-200">{totalRows} educators</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-sm">
                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                            </button>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                Page {page} of {totalPages}
                            </span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-sm">
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT TEACHER MODAL */}
            <AnimatePresence>
                {editTeacher && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => setEditTeacher(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Edit Identity</h2>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">IPN_{editTeacher.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditTeacher(null)} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {editError && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{editError}</p>
                                    </motion.div>
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Full Name</label>
                                        <Input className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 transition-colors focus:bg-white dark:focus:bg-slate-900 font-semibold"
                                            value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Educator Name" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Email Address</label>
                                            <div className="relative">
                                                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input type="email" className="h-11 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 font-semibold"
                                                    value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Mobile Number</label>
                                            <div className="relative">
                                                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input className="h-11 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 font-semibold"
                                                    value={editForm.mobile || ""} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} placeholder="Phone" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Designation / Role</label>
                                            <Input className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 font-semibold"
                                                value={editForm.designation || ""} onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))} placeholder="Role" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">City</label>
                                            <Input className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 font-semibold"
                                                value={editForm.city || ""} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Institute/School Name</label>
                                        <Input className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 font-semibold"
                                            value={editForm.institute_name || ""} onChange={e => setEditForm(f => ({ ...f, institute_name: e.target.value }))} placeholder="Institute" />
                                    </div>
                                </div>
                                <div className="pt-6 flex justify-end gap-3">
                                    <button onClick={() => setEditTeacher(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleEditSubmit} disabled={submittingEdit}
                                        className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[140px]">
                                        {submittingEdit ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
