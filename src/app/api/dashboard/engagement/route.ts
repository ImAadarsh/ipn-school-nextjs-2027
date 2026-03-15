import { query } from "@/lib/db";
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
        const data = await query<{ name: string; email: string; total_duration: number }>(
            `SELECT a.name, a.email, SUM(a.duration_attend) as total_duration 
             FROM Attendees a 
             JOIN users u ON a.user_id = u.id 
             WHERE u.school_id = ? 
             GROUP BY a.user_id, a.name, a.email
             ORDER BY total_duration DESC 
             LIMIT 10`,
            [schoolId]
        );

        return NextResponse.json({ engagement: data });
    } catch (error) {
        console.error("Engagement error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
