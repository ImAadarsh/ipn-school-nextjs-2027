import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

function getSchoolId(cookieStore: ReturnType<typeof cookies> extends Promise<infer U> ? U : any) {
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return null;
    try {
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        return s.userid as number;
    } catch { return null; }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const teacherId = parseInt(params.id);
    if (!teacherId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    try {
        // Verify that this teacher belongs to the school
        const checkSchoolParams = [teacherId, schoolId];
        const checkSchoolSql = `SELECT id, name FROM users WHERE id IN (SELECT user_id FROM payments WHERE school_id = ?) AND id = ? LIMIT 1`;
        const validTeacher = await query<{ id: number; name: string }>(checkSchoolSql, [schoolId, teacherId]);
        if (validTeacher.length === 0) {
            return NextResponse.json({ error: "Unauthorized access to this teacher's portfolio." }, { status: 403 });
        }
        
        const teacherName = validTeacher[0].name;

        // ── Hero Stats ───────────────────────────────────────────────
        const heroRows = await query<RowDataPacket[]>(
            `SELECT
                COUNT(DISTINCT p.workshop_id) AS total_workshops,
                SUM(p.attended_duration)      AS total_minutes_attended,
                COALESCE(SUM(p.cpd), 0)       AS total_cpd,
                SUM(CASE WHEN p.is_attended = 1 OR p.attended_duration > 0 THEN 1 ELSE 0 END) AS attended_count,
                SUM(CASE WHEN p.review = 1 THEN 1 ELSE 0 END)      AS reviewed_count
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?`,
            [teacherId, year]
        );
        const hero = heroRows[0] || {};

        // ── Category Breakdown ───────────────────────────────────────
        const categoryRows = await query<RowDataPacket[]>(
            `SELECT
                c.id,
                c.name AS category,
                COUNT(DISTINCT p.workshop_id)            AS workshop_count,
                IFNULL(SUM(CASE WHEN p.is_attended = 1 OR p.attended_duration > 0 THEN 1 ELSE 0 END), 0) AS attended_count,
                COALESCE(SUM(p.attended_duration), 0)    AS minutes_attended
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             JOIN categories c ON w.category_id = c.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?
             GROUP BY c.id, c.name
             ORDER BY workshop_count DESC`,
            [teacherId, year]
        );

        const categories = categoryRows.map((row: any) => ({
            id: row.id,
            category: row.category,
            workshop_count: Number(row.workshop_count) || 0,
            attended_count: Number(row.attended_count) || 0,
            minutes_attended: Number(row.minutes_attended) || 0
        }));

        // ── Workshop List ────────────────────────────────────────────
        const workshopRows = await query<RowDataPacket[]>(
            `SELECT
                w.id, w.name, w.start_date, w.duration,
                COALESCE(t.name, w.trainer_name) AS trainer_name,
                COALESCE(t.image, w.trainer_image) AS trainer_image,
                w.image,
                w.skills,
                c.name AS category,
                p.attended_duration, p.is_attended, p.cpd
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             LEFT JOIN trainers t ON w.trainer_id = t.id
             LEFT JOIN categories c ON w.category_id = c.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?
             ORDER BY w.start_date ASC`,
            [teacherId, year]
        );

        // ── Monthly Distribution ─────────────────────────────────────
        const monthlyRows = await query<RowDataPacket[]>(
            `SELECT
                DATE_FORMAT(w.start_date, '%b') AS month,
                DATE_FORMAT(w.start_date, '%m') AS month_num,
                COUNT(DISTINCT p.workshop_id)   AS count,
                COALESCE(SUM(p.attended_duration), 0) AS minutes
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?
             GROUP BY month, month_num
             ORDER BY month_num ASC`,
            [teacherId, year]
        );


        // ── Day-of-Week Distribution ─────────────────────────────────
        const dowRows = await query<RowDataPacket[]>(
            `SELECT
                DAYOFWEEK(w.start_date) AS dow,
                COUNT(DISTINCT p.workshop_id) AS count
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?
             GROUP BY DAYOFWEEK(w.start_date)
             ORDER BY dow ASC`,
            [teacherId, year]
        );

        // ── Skills Aggregation ───────────────────────────────────────
        const skillRows = await query<RowDataPacket[]>(
            `SELECT GROUP_CONCAT(w.skills SEPARATOR ',') AS all_skills
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1
               AND YEAR(w.start_date) = ?
               AND w.skills IS NOT NULL AND w.skills != ''`,
            [teacherId, year]
        );
        const rawSkills = (skillRows[0] as any)?.all_skills || '';
        const skillMap: Record<string, number> = {};
        rawSkills.split(/,|\s*<br\s*\/?>\s*/i).forEach((s: string) => {
            const t = s.replace(/<[^>]*>/g, '').trim();
            if (t) skillMap[t] = (skillMap[t] || 0) + 1;
        });
        const skills = Object.entries(skillMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));

        // ── My Reviews/Feedback Given ────────────────────────────────
        const feedbackRows = await query<RowDataPacket[]>(
            `SELECT
                f.rating, f.comment, f.created_at,
                w.name AS workshop_name
             FROM feedback f
             JOIN workshops w ON f.workshop_id = w.id
             WHERE f.user_id = ? AND YEAR(w.start_date) = ?
             ORDER BY f.created_at DESC
             LIMIT 10`,
            [teacherId, year]
        );

        // ── Favourite Trainer ────────────────────────────────────────
        const trainerRows = await query<RowDataPacket[]>(
            `SELECT
                COALESCE(t.name, w.trainer_name) AS trainer_name,
                COALESCE(t.image, w.trainer_image) AS trainer_image,
                COUNT(*) AS workshop_count,
                COALESCE(SUM(p.attended_duration), 0) AS minutes_attended
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             LEFT JOIN trainers t ON w.trainer_id = t.id
             WHERE p.user_id = ? AND p.payment_status = 1
                AND YEAR(w.start_date) = ?
                AND (t.name IS NOT NULL OR (w.trainer_name IS NOT NULL AND w.trainer_name != ''))
             GROUP BY trainer_name, trainer_image
             ORDER BY workshop_count DESC, minutes_attended DESC
             LIMIT 1`,
            [teacherId, year]
        );

        // ── All Trainers ─────────────────────────────────────────────
        const allTrainerRows = await query<RowDataPacket[]>(
            `SELECT
                COALESCE(t.name, w.trainer_name) AS trainer_name,
                COALESCE(t.image, w.trainer_image) AS trainer_image,
                COUNT(*) AS workshop_count,
                COALESCE(SUM(p.attended_duration), 0) AS minutes_attended
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             LEFT JOIN trainers t ON w.trainer_id = t.id
             WHERE p.user_id = ? AND p.payment_status = 1
                AND YEAR(w.start_date) = ?
                AND (t.name IS NOT NULL OR (w.trainer_name IS NOT NULL AND w.trainer_name != ''))
             GROUP BY trainer_name, trainer_image
             ORDER BY workshop_count DESC
             LIMIT 5`,
            [teacherId, year]
        );

        const data = {
            year,
            user: { name: teacherName },
            hero: {
                totalWorkshops: Number((hero as any).total_workshops) || 0,
                totalMinutesAttended: Math.round(Number((hero as any).total_minutes_attended) || 0),
                totalCpd: Math.round((Number((hero as any).total_cpd) || 0) * 10) / 10,
                attendedCount: Number((hero as any).attended_count) || 0,
                reviewedCount: Number((hero as any).reviewed_count) || 0,
            },
            categories: categories,
            workshops: workshopRows,
            monthly: monthlyRows,
            dayOfWeek: dowRows,
            skills,
            feedbackGiven: feedbackRows,
            allTrainers: allTrainerRows,
            favouriteCategory: (categoryRows as any[])[0] || null,
            favouriteTrainer: (trainerRows as any[])[0] || null,
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("Portfolio retrieval error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
