"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, UserSearch, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VerificationRequest {
    id: number;
    user_id: number;
    name: string;
    email: string;
    mobile: string;
    institute_name: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string;
    submitted_at: string;
}

export default function VerificationPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [form, setForm] = useState({ name: "", email: "", mobile: "", institute_name: "", reason: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = () => {
        setLoading(true);
        fetch("/api/verification")
            .then(r => r.json())
            .then(d => setRequests(d.requests || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleUpdate = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch("/api/verification", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: id, status })
            });
            if (res.ok) {
                setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setForm({ name: "", email: "", mobile: "", institute_name: "", reason: "" });
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to submit request");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-6 relative">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-display font-bold">Profile Verification Portal</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Submit or review profile correction requests (name changes, designations) to ensure certificate consistency.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" /> New Request
                </Button>
            </motion.div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                </div>
            ) : (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" /> Action Required ({pendingRequests.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {pendingRequests.map(req => (
                                            <motion.div
                                                key={req.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-4 rounded-xl border border-amber-200/50 bg-amber-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold">{req.name}</h3>
                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{req.email}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        Requested correction: <span className="font-medium text-foreground">{req.reason}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Submitted: {new Date(req.submitted_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleUpdate(req.id, 'rejected')}>
                                                        <X className="h-4 w-4 mr-1" /> Reject
                                                    </Button>
                                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleUpdate(req.id, 'approved')}>
                                                        <Check className="h-4 w-4 mr-1" /> Approve
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UserSearch className="h-4 w-4 text-primary" /> Past Processed Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {processedRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No action history</p>
                            ) : (
                                <div className="space-y-3">
                                    {processedRequests.map(req => (
                                        <div key={req.id} className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-medium">{req.name} <span className="text-muted-foreground font-normal">({req.email})</span></p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
                                            </div>
                                            <div className="shrink-0">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                    {req.status === 'approved' ? 'Approved' : 'Rejected'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal Overlay */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">New Correction Request</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Submit a profile change request for a teacher.</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Teacher Name *</label>
                                        <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Email Address *</label>
                                        <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@school.com" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Mobile Number</label>
                                        <Input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+91..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Institute</label>
                                        <Input value={form.institute_name} onChange={e => setForm({...form, institute_name: e.target.value})} placeholder="School Name" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Reason for Correction *</label>
                                    <textarea required rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                                        className="w-full rounded-xl border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border font-medium" 
                                        placeholder="e.g. Name misspelled on previous certificates, please change from Jon to John." />
                                </div>
                                
                                <div className="pt-4 flex justify-end gap-3 border-t">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
