import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSchoolId(cookieStore: Awaited<ReturnType<typeof cookies>>) {
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return null;
    try {
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        return s.userid as number;
    } catch { return null; }
}

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = (page - 1) * limit;

    try {
        let baseCountSql = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM payments p
            JOIN users u ON p.user_id = u.id
            WHERE p.school_id = ?
        `;
        let countParams: (string | number)[] = [schoolId];

        let sql = `
            SELECT u.id, u.name, u.email, u.mobile, u.designation, u.institute_name, u.city,
                COALESCE(SUM(CASE WHEN p.is_attended = 1 AND YEAR(w.start_date) = 2026 THEN p.cpd ELSE 0 END), 0) as total_cpd
            FROM payments p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN workshops w ON p.workshop_id = w.id
            WHERE p.school_id = ?
        `;
        let params: (string | number)[] = [schoolId];

        if (search) {
            const searchPattern = ` AND (u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ? OR u.designation LIKE ? OR u.city LIKE ?)`;
            baseCountSql += searchPattern;
            sql += searchPattern;
            const like = `%${search}%`;
            countParams.push(like, like, like, like, like);
            params.push(like, like, like, like, like);
        }

        sql += " GROUP BY u.id, u.name, u.email, u.mobile, u.designation, u.institute_name, u.city ORDER BY u.name ASC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const countResult = await query<{ total: number }>(baseCountSql, countParams);
        const totalRows = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRows / limit);

        const rows = await query<{
            id: number; name: string; email: string; mobile: string;
            designation: string; institute_name: string; city: string; total_cpd: number;
        }>(sql, params);

        return NextResponse.json({ 
            teachers: rows, 
            pagination: { page, limit, totalRows, totalPages } 
        });
    } catch (error) {
        console.error("Teachers error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
