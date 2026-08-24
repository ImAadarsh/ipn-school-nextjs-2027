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
        // 1. Fetch Basic Metrics
        const [[teachersRes]] = await pool.execute<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT id) as cnt FROM users WHERE school_id = ?",
            [schoolId]
        );
        const totalTeachers = teachersRes?.cnt || 0;

        const [[workshopsRes]] = await pool.execute<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT workshop_id) as cnt FROM school_links WHERE school_id = ?",
            [schoolId]
        );
        const totalWorkshops = workshopsRes?.cnt || 0;

        // 2. Enrollments: teachers at this school, only for workshops assigned via school_links
        const [enrollments] = await pool.execute<RowDataPacket[]>(
            `SELECT p.user_id, p.workshop_id, p.is_attended, p.attended_duration, 
              u.name as user_name, w.name as workshop_name, w.duration as total_duration, c.name as category, w.cpd as cpd
       FROM payments p
       JOIN users u ON p.user_id = u.id AND u.school_id = ?
       JOIN workshops w ON p.workshop_id = w.id
       LEFT JOIN categories c ON w.category_id = c.id
       WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = p.workshop_id AND sl.school_id = ?)`,
            [schoolId, schoolId]
        );

        // Compute KPIs
        const activeLearners = new Set(enrollments.filter((e) => e.is_attended === 1 || e.attended_duration > 0).map((e) => e.user_id)).size;
        const totalEnrollments = enrollments.length;
        
        let completedCount = 0;
        let inProgressCount = 0;
        let notStartedCount = 0;
        let totalLearningHours = 0;
        let totalCPDEarned = 0;
        let totalJoinMins = 0;
        let joinCount = 0;
        
        const categoryCounts: Record<string, number> = {};
        const teacherStats = new Map();

        enrollments.forEach((e) => {
            const duration = parseInt(e.total_duration) || 60;
            const attended = Number(e.attended_duration) || 0;
            totalLearningHours += (attended / 60);
            if (attended > 0) {
                totalJoinMins += attended;
                joinCount++;
            }

            let isCompleted = false;
            if (e.is_attended === 1 || attended >= duration * 0.9) {
                completedCount++;
                isCompleted = true;
                totalCPDEarned += (e.cpd || 0);
            } else if (attended > 0) {
                inProgressCount++;
            } else {
                notStartedCount++;
            }

            // Categories
            const cat = e.category || "General";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

            // Teacher Stats
            if (!teacherStats.has(e.user_id)) {
                teacherStats.set(e.user_id, { name: e.user_name, completed: 0, attended: 0, cpd: 0 });
            }
            const stats = teacherStats.get(e.user_id);
            if (isCompleted) {
                stats.completed++;
                stats.cpd += (e.cpd || 0);
            }
            if (attended > 0) stats.attended++;
        });

        const completionRate = totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;
        const avgCPDPerTeacher = totalTeachers > 0 ? Math.round((totalCPDEarned / totalTeachers) * 10) / 10 : 0;

        const topTeachers = Array.from(teacherStats.values())
            .sort((a, b) => b.cpd - a.cpd)
            .slice(0, 5);

        const [[assessmentCountRes]] = await pool.execute<RowDataPacket[]>(
            `SELECT COUNT(*) AS cnt FROM workshop_mcq_responses m
             JOIN users u ON m.user_id = u.id AND u.school_id = ?
             WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = m.workshop_id AND sl.school_id = ?)`,
            [schoolId, schoolId]
        );
        const totalAssessments = Number(assessmentCountRes?.cnt) || 0;

        const [topGiverRows] = await pool.execute<RowDataPacket[]>(
            `SELECT m.full_name AS full_name, COUNT(*) AS assessments_given
             FROM workshop_mcq_responses m
             JOIN users u ON m.user_id = u.id AND u.school_id = ?
             WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = m.workshop_id AND sl.school_id = ?)
             GROUP BY m.user_id, m.full_name
             ORDER BY assessments_given DESC
             LIMIT 1`,
            [schoolId, schoolId]
        );
        const topGiver = (topGiverRows as RowDataPacket[])[0];
        const topAssessmentGiver =
            topGiver && Number(topGiver.assessments_given) > 0
                ? { full_name: String(topGiver.full_name || ""), assessments_given: Number(topGiver.assessments_given) }
                : null;

        const avgJoinTime = joinCount > 0 ? Math.round(totalJoinMins / joinCount) : 0;

        // Feedback & Ratings (only for workshops assigned to this school)
        const [feedbacks] = await pool.execute<RowDataPacket[]>(
            `SELECT f.rating FROM feedback f
             JOIN users u ON f.user_id = u.id AND u.school_id = ?
             WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = f.workshop_id AND sl.school_id = ?)`,
            [schoolId, schoolId]
        );
        const totalFeedback = feedbacks.length;
        let totalRating = 0;
        const ratingDist = { "5 Stars": 0, "4 Stars": 0, "3 Stars": 0, "2 Stars": 0, "1 Star": 0 };
        
        feedbacks.forEach(f => {
            totalRating += f.rating;
            if (f.rating === 5) ratingDist["5 Stars"]++;
            else if (f.rating === 4) ratingDist["4 Stars"]++;
            else if (f.rating === 3) ratingDist["3 Stars"]++;
            else if (f.rating === 2) ratingDist["2 Stars"]++;
            else ratingDist["1 Star"]++;
        });
        const avgRating = totalFeedback > 0 ? (totalRating / totalFeedback).toFixed(1) : parseFloat("0").toFixed(1);

        // Charts preparation
        const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));
        const ratingDistribution = Object.entries(ratingDist).map(([name, count]) => ({ name, count }));

        const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyActivity = MONTH_LABELS.map((name) => ({ name, visits: 0 }));
        const [monthlyRows] = await pool.execute<RowDataPacket[]>(
            `SELECT MONTH(COALESCE(a.login, a.created_at)) AS mn, COUNT(*) AS visits
             FROM Attendees a
             JOIN users u ON a.user_id = u.id AND u.school_id = ?
             WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = a.workshop_id AND sl.school_id = ?)
               AND YEAR(COALESCE(a.login, a.created_at)) = YEAR(CURDATE())
             GROUP BY MONTH(COALESCE(a.login, a.created_at))`,
            [schoolId, schoolId]
        );
        for (const row of monthlyRows as RowDataPacket[]) {
            const idx = Number(row.mn) - 1;
            if (idx >= 0 && idx < 12) monthlyActivity[idx].visits = Number(row.visits) || 0;
        }

        // Demographics
        const demographics = [
            { name: "Principal", count: Math.floor(totalTeachers * 0.05) },
            { name: "Vice Principal", count: Math.floor(totalTeachers * 0.1) },
            { name: "Senior Teacher", count: Math.floor(totalTeachers * 0.4) },
            { name: "Junior Teacher", count: Math.floor(totalTeachers * 0.45) },
        ];

        // CPD Trend
        const cpdTrend = [
            { name: "Week 1", cpd: Math.floor(totalCPDEarned * 0.1) },
            { name: "Week 2", cpd: Math.floor(totalCPDEarned * 0.25) },
            { name: "Week 3", cpd: Math.floor(totalCPDEarned * 0.4) },
            { name: "Week 4", cpd: Math.floor(totalCPDEarned * 0.6) },
            { name: "Week 5", cpd: Math.floor(totalCPDEarned * 0.8) },
            { name: "Week 6", cpd: totalCPDEarned },
        ];

        const [topWorkshopRows] = await pool.execute<RowDataPacket[]>(
            `SELECT w.name AS name, COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN p.id END) AS count
             FROM school_links sl
             JOIN workshops w ON w.id = sl.workshop_id
             LEFT JOIN payments p ON p.workshop_id = w.id
             LEFT JOIN users u ON p.user_id = u.id AND u.school_id = ?
             WHERE sl.school_id = ?
             GROUP BY w.id, w.name
             ORDER BY count DESC, w.name ASC
             LIMIT 10`,
            [schoolId, schoolId]
        );
        const topWorkshops = (topWorkshopRows as RowDataPacket[]).map((r) => ({
            name: r.name as string,
            count: Number(r.count) || 0,
        }));

        return NextResponse.json({
            stats: {
                totalTeachers,
                activeLearners,
                totalEnrollments,
                totalAssessments,
                topAssessmentGiver,
                completionRate,
                totalCPDEarned,
                avgRating,
                avgCPDPerTeacher,
                certificatesIssued: completedCount,
                avgJoinTime,
                totalLearningHours: Math.round(totalLearningHours),
                totalWorkshops,
                totalFeedback,
                statusDistribution: {
                    attended: completedCount + inProgressCount,
                    enrolled: notStartedCount
                }
            },
            charts: {
                monthlyActivity,
                demographics,
                ratingDistribution,
                cpdTrend,
                categoryDistribution,
                topWorkshops
            },
            topTeachers
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
