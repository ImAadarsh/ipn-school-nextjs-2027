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
        const data = await query<{ category: string; total_questions: number; correct_answers: number }>(
            `SELECT c.name as category, 
                    COUNT(m.id) as total_questions, 
                    SUM(CASE WHEN m.selected_option = m.correct_option THEN 1 ELSE 0 END) as correct_answers
             FROM workshop_mcq_responses m
             JOIN workshops w ON m.workshop_id = w.id
             JOIN categories c ON w.category_id = c.id
             JOIN users u ON m.user_id = u.id
             WHERE u.school_id = ?
             AND EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = m.workshop_id AND sl.school_id = ?)
             GROUP BY c.id, c.name
             HAVING total_questions > 0`,
            [schoolId, schoolId]
        );

        const skillGaps = data.map(d => ({
            category: d.category,
            performance: Math.round((d.correct_answers / d.total_questions) * 100)
        }));

        return NextResponse.json({ skillGaps });
    } catch (error) {
        console.error("Skill gaps error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
