import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import PortfolioClient from "./PortfolioClient";

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) redirect("/");

    let session = null;
    try {
        session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
    } catch {
        redirect("/");
    }

    const userId = session.userid;
    // Default to Last Year for initial SSR load
    const year = new Date().getFullYear() - 1;

    try {
        // ── Hero Stats ───────────────────────────────────────────────
        const [heroRows] = await pool.execute<RowDataPacket[]>(
            `SELECT
                COUNT(DISTINCT p.workshop_id) AS total_workshops,
                SUM(p.attended_duration)      AS total_minutes_attended,
                COALESCE(SUM(p.cpd), 0)       AS total_cpd,
                SUM(CASE WHEN p.is_attended = 1 OR p.attended_duration > 0 THEN 1 ELSE 0 END) AS attended_count,
                SUM(CASE WHEN p.review = 1 THEN 1 ELSE 0 END)      AS reviewed_count
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?`,
            [userId, year]
        );
        const hero = heroRows[0] || {};

        // ── Category Breakdown ───────────────────────────────────────
        const [categoryRows] = await pool.execute<RowDataPacket[]>(
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
            [userId, year]
        );

        const categories = categoryRows.map(row => ({
            id: row.id,
            category: row.category,
            workshop_count: Number(row.workshop_count) || 0,
            attended_count: Number(row.attended_count) || 0,
            minutes_attended: Number(row.minutes_attended) || 0
        }));

        // ── Workshop List ────────────────────────────────────────────
        const [workshopRows] = await pool.execute<RowDataPacket[]>(
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
            [userId, year]
        );

        // ── Monthly Distribution ─────────────────────────────────────
        const [monthlyRows] = await pool.execute<RowDataPacket[]>(
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
            [userId, year]
        );


        // ── Day-of-Week Distribution ─────────────────────────────────
        const [dowRows] = await pool.execute<RowDataPacket[]>(
            `SELECT
                DAYOFWEEK(w.start_date) AS dow,
                COUNT(DISTINCT p.workshop_id) AS count
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1 AND YEAR(w.start_date) = ?
             GROUP BY DAYOFWEEK(w.start_date)
             ORDER BY dow ASC`,
            [userId, year]
        );

        // ── Skills Aggregation ───────────────────────────────────────
        const [skillRows] = await pool.execute<RowDataPacket[]>(
            `SELECT GROUP_CONCAT(w.skills SEPARATOR ',') AS all_skills
             FROM payments p
             JOIN workshops w ON p.workshop_id = w.id
             WHERE p.user_id = ? AND p.payment_status = 1
               AND YEAR(w.start_date) = ?
               AND w.skills IS NOT NULL AND w.skills != ''`,
            [userId, year]
        );
        const rawSkills = (skillRows[0] as any)?.all_skills || '';
        const skillMap: Record<string, number> = {};
        // Split by comma or <br> tags, then strip any residual HTML and trim
        rawSkills.split(/,|\s*<br\s*\/?>\s*/i).forEach((s: string) => {
            const t = s.replace(/<[^>]*>/g, '').trim();
            if (t) skillMap[t] = (skillMap[t] || 0) + 1;
        });
        const skills = Object.entries(skillMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));

        // ── My Reviews/Feedback Given ────────────────────────────────
        const [feedbackRows] = await pool.execute<RowDataPacket[]>(
            `SELECT
                f.rating, f.comment, f.created_at,
                w.name AS workshop_name
             FROM feedback f
             JOIN workshops w ON f.workshop_id = w.id
             WHERE f.user_id = ? AND YEAR(w.start_date) = ?
             ORDER BY f.created_at DESC
             LIMIT 10`,
            [userId, year]
        );

        // ── Favourite Trainer ────────────────────────────────────────
        const [trainerRows] = await pool.execute<RowDataPacket[]>(
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
            [userId, year]
        );

        // ── All Trainers ─────────────────────────────────────────────
        const [allTrainerRows] = await pool.execute<RowDataPacket[]>(
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
            [userId, year]
        );

        const data = {
            year,
            user: { name: session.name },
            hero: {
                totalWorkshops: Number(hero.total_workshops) || 0,
                totalMinutesAttended: Math.round(Number(hero.total_minutes_attended) || 0),
                totalCpd: Math.round((Number(hero.total_cpd) || 0) * 10) / 10,
                attendedCount: Number(hero.attended_count) || 0,
                reviewedCount: Number(hero.reviewed_count) || 0,
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

        return <PortfolioClient data={data} />;

    } catch (error) {
        console.error("Portfolio page error:", error);
        return (
            <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
                Unable to load portfolio. Please try again.
            </div>
        );
    }
}
