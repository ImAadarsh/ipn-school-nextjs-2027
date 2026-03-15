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
        // AI Sentiment
        const sentimentSql = `
            SELECT w.name as workshop_name, r.report_content, AVG(f.feedback_rating) as avg_rating
            FROM workshops w
            JOIN payments p ON p.workshop_id = w.id
            LEFT JOIN workshop_ai_reports r ON w.id = r.workshop_id
            LEFT JOIN workshop_feedback f ON w.id = f.workshop_id
            WHERE p.school_id = ?
            GROUP BY w.id, w.name, r.report_content
            ORDER BY w.start_date DESC
            LIMIT 10
        `;
        const sentiment = await query<any>(sentimentSql, [schoolId]);

        // ROI Budgeting
        const roiSql = `
            SELECT 
                COUNT(p.id) as total_enrollments,
                SUM(w.price_2) as retail_value,
                SUM(CAST(p.amount AS DECIMAL(10,2))) as actual_paid
            FROM payments p
            JOIN workshops w ON p.workshop_id = w.id
            WHERE p.school_id = ?
        `;
        const roiResult = await query<any>(roiSql, [schoolId]);
        const roi = roiResult[0] ? {
            total_enrollments: roiResult[0].total_enrollments || 0,
            retail_value: roiResult[0].retail_value || 0,
            actual_paid: roiResult[0].actual_paid || 0,
            savings: (roiResult[0].retail_value || 0) - (roiResult[0].actual_paid || 0)
        } : { total_enrollments: 0, retail_value: 0, actual_paid: 0, savings: 0 };

        // Impact Analysis (Pre vs Post - modeled as MCQ performance on attended workshops)
        const impactSql = `
            SELECT w.name as workshop_name, 
                   COUNT(m.id) as total_attempts,
                   SUM(CASE WHEN m.selected_option = m.correct_option THEN 1 ELSE 0 END) as correct_answers
            FROM payments p
            JOIN workshops w ON p.workshop_id = w.id
            LEFT JOIN workshop_mcq_responses m ON w.id = m.workshop_id AND m.user_id = p.user_id
            WHERE p.school_id = ?
            GROUP BY w.id, w.name
            HAVING total_attempts > 0
            ORDER BY correct_answers DESC
            LIMIT 8
        `;
        const impact = await query<any>(impactSql, [schoolId]);

        return NextResponse.json({
            sentiment,
            roi,
            impact: impact.map((i: any) => ({
                workshop_name: i.workshop_name,
                score_percentage: Math.round((i.correct_answers / i.total_attempts) * 100)
            }))
        });
    } catch (error) {
        console.error("Reports API error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
