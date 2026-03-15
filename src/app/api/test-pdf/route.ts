import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const rows = await query<any>(`SELECT order_id FROM payments WHERE is_attended = 1 AND order_id IS NOT NULL LIMIT 1`);
        if (rows.length === 0) return NextResponse.json({ error: "No orders" });
        const orderId = rows[0].order_id;
        
        const certUrl = `https://ipnacademy.in/user/certificate.php?id=${orderId}`;
        const res = await fetch(certUrl);
        const headers = Object.fromEntries(res.headers.entries());
        const buffer = await res.arrayBuffer();
        
        // Return first 100 bytes to see if it's a PDF (%PDF-)
        const startText = Buffer.from(buffer.slice(0, 100)).toString("utf-8");
        
        return NextResponse.json({
            url: certUrl,
            status: res.status,
            headers,
            byteLength: buffer.byteLength,
            startText
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}
