import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSchoolId(cookieStore: Awaited<ReturnType<typeof cookies>>) {
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return null;
    try {
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        return s.userid as number;
    } catch {
        return null;
    }
}

const METRICS = [
    "teachers",
    "activeLearners",
    "enrollments",
    "assessments",
    "topAssessmentGiver",
    "completion",
    "cpdHours",
    "avgRating",
    "avgCpdPerTeacher",
    "certificates",
    "avgJoinTime",
    "learningHours",
    "workshops",
    "feedback",
] as const;

type Metric = (typeof METRICS)[number];

function isMetric(v: string | null): v is Metric {
    return !!v && (METRICS as readonly string[]).includes(v);
}

type DetailPayload = {
    metric: Metric;
    title: string;
    description: string;
    columns: string[];
    rows: Record<string, string | number>[];
};

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const metricParam = new URL(request.url).searchParams.get("metric");
    if (!isMetric(metricParam)) {
        return NextResponse.json({ error: "Invalid metric", metrics: METRICS }, { status: 400 });
    }

    try {
        const payload = await buildDetails(metricParam, schoolId);
        return NextResponse.json(payload);
    } catch (error) {
        console.error("Dashboard details error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}

async function buildDetails(metric: Metric, schoolId: number): Promise<DetailPayload> {
    switch (metric) {
        case "teachers":
            return teachers(schoolId);
        case "workshops":
            return workshops(schoolId);
        case "assessments":
            return assessments(schoolId);
        case "topAssessmentGiver":
            return topAssessmentGiver(schoolId);
        case "avgRating":
        case "feedback":
            return feedback(schoolId, metric);
        case "activeLearners":
        case "enrollments":
        case "completion":
        case "cpdHours":
        case "certificates":
        case "avgJoinTime":
        case "learningHours":
        case "avgCpdPerTeacher":
            return enrollmentBased(schoolId, metric);
        default:
            return {
                metric,
                title: "Details",
                description: "",
                columns: [],
                rows: [],
            };
    }
}

async function teachers(schoolId: number): Promise<DetailPayload> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT u.name, u.email, u.mobile, u.designation, u.institute_name, u.city
         FROM users u
         WHERE u.school_id = ?
         ORDER BY u.name ASC`,
        [schoolId]
    );
    return {
        metric: "teachers",
        title: "Total Teachers",
        description: "All educators registered under your school.",
        columns: ["Teacher", "Email", "Phone", "Designation", "Institute", "City"],
        rows: rows.map((r) => ({
            Teacher: r.name || "—",
            Email: r.email || "—",
            Phone: r.mobile || "—",
            Designation: r.designation || "—",
            Institute: r.institute_name || "—",
            City: r.city || "—",
        })),
    };
}

async function workshops(schoolId: number): Promise<DetailPayload> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT w.name, w.start_date, w.trainer_name, w.cpd,
                COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN p.id END) AS enrollments
         FROM school_links sl
         JOIN workshops w ON w.id = sl.workshop_id
         LEFT JOIN payments p ON p.workshop_id = w.id
         LEFT JOIN users u ON p.user_id = u.id AND u.school_id = ?
         WHERE sl.school_id = ?
         GROUP BY w.id, w.name, w.start_date, w.trainer_name, w.cpd
         ORDER BY w.start_date DESC, w.name ASC`,
        [schoolId, schoolId]
    );
    return {
        metric: "workshops",
        title: "Assigned Workshops",
        description: "Workshops linked to your school via school links.",
        columns: ["Workshop", "Date", "Trainer", "CPD", "Enrollments"],
        rows: rows.map((r) => ({
            Workshop: r.name || "—",
            Date: r.start_date ? String(r.start_date).slice(0, 10) : "—",
            Trainer: r.trainer_name || "—",
            CPD: Number(r.cpd) || 0,
            Enrollments: Number(r.enrollments) || 0,
        })),
    };
}

/** Match MCQ / assessment respondents to school teachers by user_id or email. */
const SCHOOL_TEACHER_MATCH = `(m.user_id = u.id OR (m.email IS NOT NULL AND m.email <> '' AND LOWER(TRIM(m.email)) = LOWER(TRIM(u.email))))`;

async function assessments(schoolId: number): Promise<DetailPayload> {
    const [mcqRows] = await pool.execute<RowDataPacket[]>(
        `SELECT m.full_name, m.email, m.designation, w.name AS workshop_name,
                COUNT(*) AS answers,
                SUM(CASE WHEN m.selected_option = m.correct_option THEN 1 ELSE 0 END) AS correct,
                MAX(m.submitted_at) AS submitted_at
         FROM workshop_mcq_responses m
         JOIN users u ON u.school_id = ? AND ${SCHOOL_TEACHER_MATCH}
         JOIN workshops w ON w.id = m.workshop_id
         WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = m.workshop_id AND sl.school_id = ?)
         GROUP BY m.workshop_id, LOWER(TRIM(m.email)), m.full_name, m.email, m.designation, w.name
         ORDER BY submitted_at DESC`,
        [schoolId, schoolId]
    );

    const [textRows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.full_name, a.email, a.designation, w.name AS workshop_name,
                COUNT(*) AS answers, MAX(a.created_at) AS submitted_at
         FROM workshop_assessment_responses a
         JOIN users u ON u.school_id = ?
           AND a.email IS NOT NULL AND a.email <> ''
           AND LOWER(TRIM(a.email)) = LOWER(TRIM(u.email))
         JOIN workshops w ON w.id = a.workshop_id
         WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = a.workshop_id AND sl.school_id = ?)
         GROUP BY a.workshop_id, LOWER(TRIM(a.email)), a.full_name, a.email, a.designation, w.name
         ORDER BY submitted_at DESC`,
        [schoolId, schoolId]
    );

    const rows = [
        ...mcqRows.map((r) => {
            const answers = Number(r.answers) || 0;
            const correct = Number(r.correct) || 0;
            const score = answers > 0 ? Math.round((correct / answers) * 100) : 0;
            return {
                Teacher: r.full_name || "—",
                Email: r.email || "—",
                Workshop: r.workshop_name || "—",
                Type: "MCQ",
                Answers: answers,
                Score: `${score}%`,
                Submitted: r.submitted_at ? String(r.submitted_at).slice(0, 19).replace("T", " ") : "—",
            };
        }),
        ...textRows.map((r) => ({
            Teacher: r.full_name || "—",
            Email: r.email || "—",
            Workshop: r.workshop_name || "—",
            Type: "Written",
            Answers: Number(r.answers) || 0,
            Score: "—",
            Submitted: r.submitted_at ? String(r.submitted_at).slice(0, 19).replace("T", " ") : "—",
        })),
    ];

    return {
        metric: "assessments",
        title: "Total Assessments",
        description: "Unique assessment submissions by your teachers (MCQ + written).",
        columns: ["Teacher", "Email", "Workshop", "Type", "Answers", "Score", "Submitted"],
        rows,
    };
}

async function topAssessmentGiver(schoolId: number): Promise<DetailPayload> {
    const [givers] = await pool.execute<RowDataPacket[]>(
        `SELECT COALESCE(u.name, m.full_name) AS full_name, m.email,
                COUNT(DISTINCT m.workshop_id) AS workshops,
                COUNT(*) AS answers
         FROM workshop_mcq_responses m
         JOIN users u ON u.school_id = ? AND ${SCHOOL_TEACHER_MATCH}
         WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = m.workshop_id AND sl.school_id = ?)
         GROUP BY u.id, COALESCE(u.name, m.full_name), m.email
         ORDER BY workshops DESC, answers DESC
         LIMIT 20`,
        [schoolId, schoolId]
    );

    return {
        metric: "topAssessmentGiver",
        title: "Assessment Leaderboard",
        description: "Teachers ranked by workshops assessed and answers submitted.",
        columns: ["Teacher", "Email", "Workshops", "Answers"],
        rows: givers.map((r) => ({
            Teacher: r.full_name || "—",
            Email: r.email || "—",
            Workshops: Number(r.workshops) || 0,
            Answers: Number(r.answers) || 0,
        })),
    };
}

async function feedback(schoolId: number, metric: "avgRating" | "feedback"): Promise<DetailPayload> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT u.name AS teacher, u.email, w.name AS workshop_name, f.rating, f.comment, f.created_at
         FROM feedback f
         JOIN users u ON f.user_id = u.id AND u.school_id = ?
         JOIN workshops w ON w.id = f.workshop_id
         WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = f.workshop_id AND sl.school_id = ?)
         ORDER BY f.created_at DESC`,
        [schoolId, schoolId]
    );

    return {
        metric,
        title: metric === "avgRating" ? "Avg Rating — Feedback Rows" : "Total Feedback",
        description:
            metric === "avgRating"
                ? "All rating rows used to compute the average workshop rating."
                : "Workshop reviews submitted by your teachers.",
        columns: ["Teacher", "Email", "Workshop", "Rating", "Comment", "Date"],
        rows: rows.map((r) => ({
            Teacher: r.teacher || "—",
            Email: r.email || "—",
            Workshop: r.workshop_name || "—",
            Rating: Number(r.rating) || 0,
            Comment: r.comment || "—",
            Date: r.created_at ? String(r.created_at).slice(0, 19).replace("T", " ") : "—",
        })),
    };
}

async function enrollmentBased(
    schoolId: number,
    metric:
        | "activeLearners"
        | "enrollments"
        | "completion"
        | "cpdHours"
        | "certificates"
        | "avgJoinTime"
        | "learningHours"
        | "avgCpdPerTeacher"
): Promise<DetailPayload> {
    const [enrollments] = await pool.execute<RowDataPacket[]>(
        `SELECT p.user_id, p.is_attended, p.attended_duration, p.order_id,
                u.name AS user_name, u.email, u.mobile,
                w.name AS workshop_name, w.duration AS total_duration, w.cpd AS cpd, w.start_date
         FROM payments p
         JOIN users u ON p.user_id = u.id AND u.school_id = ?
         JOIN workshops w ON p.workshop_id = w.id
         WHERE EXISTS (SELECT 1 FROM school_links sl WHERE sl.workshop_id = p.workshop_id AND sl.school_id = ?)
         ORDER BY u.name ASC, w.start_date DESC`,
        [schoolId, schoolId]
    );

    const withFlags = enrollments.map((e) => {
        const duration = parseInt(String(e.total_duration), 10) || 60;
        const attended = Number(e.attended_duration) || 0;
        const isCompleted = e.is_attended === 1 || attended >= duration * 0.9;
        return { ...e, attended, duration, isCompleted };
    });

    const meta: Record<
        typeof metric,
        { title: string; description: string; filter: (e: (typeof withFlags)[0]) => boolean }
    > = {
        enrollments: {
            title: "Total Enrollments",
            description: "Every workshop enrollment by your staff.",
            filter: () => true,
        },
        activeLearners: {
            title: "Active Learners",
            description: "Teachers who started or completed at least one workshop.",
            filter: (e) => e.is_attended === 1 || e.attended > 0,
        },
        completion: {
            title: "LIVE Completion — Completed Enrollments",
            description: "Enrollments counted as completed (attended or ≥90% duration).",
            filter: (e) => e.isCompleted,
        },
        certificates: {
            title: "Certificates Issued",
            description: "Enrollments that qualify for a certificate.",
            filter: (e) => e.isCompleted,
        },
        cpdHours: {
            title: "CPD Hours Earned",
            description: "Completed enrollments and the CPD hours they contributed.",
            filter: (e) => e.isCompleted,
        },
        avgJoinTime: {
            title: "Avg Join Time — Sessions",
            description: "LIVE sessions with recorded duration used for the average.",
            filter: (e) => e.attended > 0,
        },
        learningHours: {
            title: "Learning Hours — Sessions",
            description: "All session durations that sum into total learning hours.",
            filter: (e) => e.attended > 0,
        },
        avgCpdPerTeacher: {
            title: "Avg CPD / Teacher — Per Teacher",
            description: "CPD totals per registered teacher (includes teachers with 0 CPD).",
            filter: () => true,
        },
    };

    if (metric === "avgCpdPerTeacher") {
        const [[teachersRes]] = await pool.execute<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT id) as cnt FROM users WHERE school_id = ?",
            [schoolId]
        );
        const totalTeachers = Number(teachersRes?.cnt) || 0;
        const byTeacher = new Map<
            number,
            { name: string; email: string; mobile: string; cpd: number; completed: number }
        >();

        for (const e of withFlags) {
            if (!byTeacher.has(e.user_id)) {
                byTeacher.set(e.user_id, {
                    name: e.user_name || "—",
                    email: e.email || "—",
                    mobile: e.mobile || "—",
                    cpd: 0,
                    completed: 0,
                });
            }
            if (e.isCompleted) {
                const t = byTeacher.get(e.user_id)!;
                t.cpd += Number(e.cpd) || 0;
                t.completed += 1;
            }
        }

        // Include registered teachers with no enrollments
        const [allTeachers] = await pool.execute<RowDataPacket[]>(
            `SELECT id, name, email, mobile FROM users WHERE school_id = ? ORDER BY name ASC`,
            [schoolId]
        );
        for (const t of allTeachers) {
            if (!byTeacher.has(t.id)) {
                byTeacher.set(t.id, {
                    name: t.name || "—",
                    email: t.email || "—",
                    mobile: t.mobile || "—",
                    cpd: 0,
                    completed: 0,
                });
            }
        }

        const teacherRows = Array.from(byTeacher.values())
            .sort((a, b) => b.cpd - a.cpd || a.name.localeCompare(b.name))
            .map((t) => ({
                Teacher: t.name,
                Email: t.email,
                Phone: t.mobile,
                Completed: t.completed,
                "CPD Hours": Math.round(t.cpd * 10) / 10,
            }));

        return {
            metric,
            title: meta.avgCpdPerTeacher.title,
            description: `${meta.avgCpdPerTeacher.description} Denominator: ${totalTeachers} teachers.`,
            columns: ["Teacher", "Email", "Phone", "Completed", "CPD Hours"],
            rows: teacherRows,
        };
    }

    if (metric === "activeLearners") {
        const byUser = new Map<
            number,
            { name: string; email: string; mobile: string; sessions: number; minutes: number }
        >();
        for (const e of withFlags.filter(meta.activeLearners.filter)) {
            if (!byUser.has(e.user_id)) {
                byUser.set(e.user_id, {
                    name: e.user_name || "—",
                    email: e.email || "—",
                    mobile: e.mobile || "—",
                    sessions: 0,
                    minutes: 0,
                });
            }
            const u = byUser.get(e.user_id)!;
            u.sessions += 1;
            u.minutes += e.attended;
        }
        return {
            metric,
            title: meta.activeLearners.title,
            description: meta.activeLearners.description,
            columns: ["Teacher", "Email", "Phone", "Sessions", "Minutes"],
            rows: Array.from(byUser.values())
                .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name))
                .map((u) => ({
                    Teacher: u.name,
                    Email: u.email,
                    Phone: u.mobile,
                    Sessions: u.sessions,
                    Minutes: Math.round(u.minutes),
                })),
        };
    }

    const filtered = withFlags.filter(meta[metric].filter);
    return {
        metric,
        title: meta[metric].title,
        description: meta[metric].description,
        columns: ["Teacher", "Email", "Workshop", "Attended", "Duration (min)", "CPD"],
        rows: filtered.map((e) => ({
            Teacher: e.user_name || "—",
            Email: e.email || "—",
            Workshop: e.workshop_name || "—",
            Attended: e.is_attended === 1 || e.isCompleted ? "Yes" : "No",
            "Duration (min)": e.attended > 0 ? Math.round(e.attended) : "—",
            CPD: e.isCompleted ? Number(e.cpd) || 0 : 0,
        })),
    };
}
