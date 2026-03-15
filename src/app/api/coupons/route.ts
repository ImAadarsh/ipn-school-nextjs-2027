import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        const schoolId = s.userid as number;

        const { workshop_id, count } = await req.json();

        // Generate a random 8 char uppercase code
        const code = "IPN" + Math.random().toString(36).substring(2, 8).toUpperCase();

        const sql = `
            INSERT INTO coupons (coupon_code, flat_discount, valid_till, count, school_id, workshop_id, workshop_type, is_visible)
            VALUES (?, 100, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, 0, 1)
        `;
        
        await query(sql, [code, count, schoolId, workshop_id]);
        
        return NextResponse.json({ success: true, code });
    } catch (error) {
        console.error("Coupon error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        const schoolId = s.userid as number;

        const sql = `
            SELECT c.*, w.name as workshop_name 
            FROM coupons c
            LEFT JOIN workshops w ON c.workshop_id = w.id
            WHERE c.school_id = ?
            ORDER BY c.created_at DESC
        `;
        
        const coupons = await query<any>(sql, [schoolId]);
        return NextResponse.json({ coupons });
    } catch (error) {
        console.error("Coupon get error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
