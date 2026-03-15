import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSchoolId(cookieStore: ReturnType<typeof cookies> extends Promise<infer U> ? U : any) {
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return null;
    try {
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        return s.userid as number;
    } catch { return null; }
}

export async function GET() {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const sql = `
            SELECT 
                w.id as workshop_id, 
                w.name as workshop_name,
                w.start_date,
                COUNT(p.id) as enrolled_teachers,
                SUM(CASE WHEN p.is_attended = 1 THEN 1 ELSE 0 END) as certified_teachers
            FROM payments p
            JOIN workshops w ON p.workshop_id = w.id
            WHERE p.school_id = ? AND w.type = 1
            GROUP BY w.id, w.name, w.start_date
            ORDER BY w.start_date DESC
        `;
        const [data] = await pool.execute<RowDataPacket[]>(sql, [schoolId]);

        return NextResponse.json({ workshops: data });
    } catch (error) {
        console.error("Certificates check error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
