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
    const type = searchParams.get("type");

    try {
        let sql = `
      SELECT sl.link, sl.workshop_id, w.id as workshop_table_id, w.name, w.type, w.start_date, w.trainer_name
      FROM school_links sl 
      JOIN workshops w ON sl.workshop_id = w.id 
      WHERE sl.school_id = ?
    `;
        const params: (string | number)[] = [schoolId];

        if (search) {
            sql += " AND w.name LIKE ?";
            params.push(`%${search}%`);
        }
        if (type !== null && type !== "" && (type === "0" || type === "1")) {
            sql += " AND w.type = ?";
            params.push(parseInt(type));
        }

        sql += " ORDER BY w.start_date DESC";

        const rows = await query<{
            link: string; workshop_id: string; workshop_table_id: number;
            name: string; type: number; start_date: string; trainer_name: string;
        }>(sql, params);

        return NextResponse.json({ sheets: rows });
    } catch (error) {
        console.error("Enrollment sheets error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
