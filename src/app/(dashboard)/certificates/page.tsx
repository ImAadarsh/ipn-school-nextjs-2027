"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileWarning, CheckCircle2, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

interface WorkshopCert {
    workshop_id: number;
    workshop_name: string;
    start_date: string;
    enrolled_teachers: number;
    certified_teachers: number;
}

export default function CertificatesPage() {
    const [workshops, setWorkshops] = useState<WorkshopCert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/certificates")
            .then(r => r.json())
            .then(d => setWorkshops(d.workshops || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const loadImages = async () => {
         const pLoad = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
             const img = new Image();
             img.src = src;
             img.onload = () => res(img);
             img.onerror = rej;
         });
         return Promise.all([
             pLoad("/cert/ipn.png"),
             pLoad("/cert/sign.png"),
             pLoad("/cert/seal.png")
         ]);
    };

    const handleDownloadAll = async (workshopId: number) => {
        setDownloadingId(workshopId);
        try {
            const res = await fetch(`/api/certificates/${workshopId}/bulk`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("No participants available for this workshop.");
                throw new Error("Failed to fetch participants");
            }
            
            const data = await res.json();
            if (!data.participants || data.participants.length === 0) throw new Error("Empty participants format.");

            const zip = new JSZip();
            const [ipnImg, signImg, sealImg] = await loadImages();

            for (const p of data.participants) {
                const doc = new jsPDF("landscape", "mm", "a4");
                
                // Border layout
                doc.setDrawColor(212, 175, 55);
                doc.setLineWidth(1.5);
                doc.rect(10, 10, 277, 190);
                
                // Images
                doc.addImage(ipnImg, "PNG", 20, 15, 30, 30);
                doc.addImage(sealImg, "PNG", 230, 50, 40, 40);
                doc.addImage(signImg, "PNG", 35, 160, 25, 10);
                
                // Top Title
                doc.setFont("times", "bold");
                doc.setFontSize(26);
                doc.setTextColor(51, 51, 51);
                doc.text("CERTIFICATE OF COMPLETION", 148.5, 50, { align: "center" });
                
                // Presented to
                doc.setFont("times", "italic");
                doc.setFontSize(16);
                doc.setTextColor(85, 85, 85);
                doc.text("Presented to", 148.5, 70, { align: "center" });

                // Recipient Name
                doc.setFont("times", "bold");
                doc.setFontSize(28);
                doc.setTextColor(26, 115, 232); 
                doc.text(p.user_name || "Unknown", 148.5, 90, { align: "center" });

                // Description
                doc.setFont("times", "italic");
                doc.setFontSize(16);
                doc.setTextColor(85, 85, 85);
                doc.text("For successfully completing an ILA Online Workshop On Topic", 148.5, 105, { align: "center" });

                // Workshop Title
                doc.setFont("times", "bold");
                doc.setFontSize(20);
                doc.setTextColor(51, 51, 51);
                doc.text(p.workshop_name || "Unknown Workshop", 148.5, 120, { align: "center" });

                // CPD
                doc.setFont("times", "normal");
                doc.setFontSize(14);
                doc.text("And also awarded with 1.5 CPD Hours", 148.5, 135, { align: "center" });

                // Left Signature
                doc.setFontSize(12);
                doc.setTextColor(51, 51, 51);
                doc.text("Gaurav Yadav", 47.5, 175, { align: "center" });
                doc.setFontSize(10);
                doc.setTextColor(119, 119, 119);
                doc.text("Founder & Moderator", 47.5, 180, { align: "center" });
                doc.text("IPN Foundation", 47.5, 184, { align: "center" });

                // Date & ID
                doc.setFont("times", "italic");
                doc.setFontSize(14);
                doc.text("Workshop On", 148.5, 165, { align: "center" });
                doc.setFont("times", "normal");
                doc.setFontSize(12);
                doc.setTextColor(51, 51, 51);
                const wDate = new Date(p.start_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
                doc.text(`Date: ${wDate}`, 148.5, 175, { align: "center" });
                doc.setTextColor(119, 119, 119);
                doc.text(`Certificate: ${p.order_id}`, 148.5, 182, { align: "center" });

                const pdfBuffer = doc.output("arraybuffer");
                const safeName = (p.user_name || "User").replace(/\s+/g, "_");
                zip.file(`${safeName}_Certificate.pdf`, pdfBuffer);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Workshop_${workshopId}_Certificates.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error("Download failed:", error);
            alert(error.message || "Failed to download certificates.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-display font-bold">Centralized Certificates</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Download all completion certificates for your teachers in one click.
                </p>
            </motion.div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                </div>
            ) : workshops.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
                    <FileWarning className="h-12 w-12 mb-4 opacity-50 text-amber-500" />
                    <p className="text-base font-medium text-foreground">No Completed Workshops Found</p>
                    <p className="text-sm">Your teachers have not completed any workshops with certifications yet.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {workshops.map((w, i) => (
                        <motion.div
                            key={w.workshop_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="hover:border-primary/50 transition-colors">
                                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Award className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{w.workshop_name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {new Date(w.start_date).toLocaleDateString()} • {w.certified_teachers} of {w.enrolled_teachers} completed
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full sm:w-auto flex shrink-0 gap-3">
                                        <div className="flex flex-col items-end justify-center mr-4 hidden sm:flex">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
                                            {w.certified_teachers > 0 ? (
                                                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4" /> Ready
                                                </span>
                                            ) : (
                                                <span className="text-sm font-semibold text-amber-600">Pending</span>
                                            )}
                                        </div>
                                        
                                        <Button 
                                            onClick={() => handleDownloadAll(w.workshop_id)} 
                                            disabled={w.certified_teachers === 0 || downloadingId === w.workshop_id}
                                            className="w-full sm:w-auto gap-2 min-w-[160px]"
                                        >
                                            {downloadingId === w.workshop_id ? (
                                                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                            {downloadingId === w.workshop_id ? "Generating Zip..." : `Download All (${w.certified_teachers})`}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
