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
    const type = searchParams.get("type"); // 0 = upcoming, 1 = completed
    const search = searchParams.get("search") || "";
    const trainer = searchParams.get("trainer") || "";

    try {
        // Workshops assigned to this school via school_links; enrollment counts are staff at this school only
        let sql = `
      SELECT w.id, w.name, w.start_date, w.type, w.trainer_name,
             MAX(sl.link) AS link,
             COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN p.id END) AS number_of_users
      FROM school_links sl
      JOIN workshops w ON w.id = sl.workshop_id
      LEFT JOIN payments p ON p.workshop_id = w.id
      LEFT JOIN users u ON p.user_id = u.id AND u.school_id = ?
      WHERE sl.school_id = ?
    `;
        const params: (string | number)[] = [schoolId, schoolId];

        if (type !== null && type !== "") {
            sql += " AND w.type = ?";
            params.push(parseInt(type));
        }
        if (search) {
            sql += " AND w.name LIKE ?";
            params.push(`%${search}%`);
        }
        if (trainer) {
            sql += " AND w.trainer_name LIKE ?";
            params.push(`%${trainer}%`);
        }

        sql += " GROUP BY w.id, w.name, w.start_date, w.type, w.trainer_name ORDER BY w.start_date DESC";

        const rows = await query<{
            id: number; name: string; start_date: string; type: number;
            trainer_name: string; number_of_users: number;
        }>(sql, params);

        return NextResponse.json({ workshops: rows });
    } catch (error) {
        console.error("Workshops error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
