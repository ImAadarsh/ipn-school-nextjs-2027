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
        const data = await query<{ name: string; email: string; score: number }>(
            `SELECT COALESCE(u.name, m.full_name) as name, COALESCE(u.email, m.email) as email,
                    SUM(CASE WHEN m.selected_option = m.correct_option THEN 1 ELSE 0 END) as score
             FROM workshop_mcq_responses m
             JOIN users u ON u.school_id = ?
               AND (m.user_id = u.id OR (m.email IS NOT NULL AND m.email <> '' AND LOWER(TRIM(m.email)) = LOWER(TRIM(u.email))))
             WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = m.workshop_id AND sl.school_id = ?)
             GROUP BY u.id, COALESCE(u.name, m.full_name), COALESCE(u.email, m.email)
             ORDER BY score DESC
             LIMIT 10`,
            [schoolId, schoolId]
        );

        return NextResponse.json({ leaderboard: data });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
