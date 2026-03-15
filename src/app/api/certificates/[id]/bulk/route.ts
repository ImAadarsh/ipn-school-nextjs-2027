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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Find teachers who attended this workshop
        const sql = `
            SELECT u.name as user_name, w.name as workshop_name, w.start_date, p.order_id 
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN workshops w ON p.workshop_id = w.id
            WHERE p.workshop_id = ? AND p.school_id = ? AND p.is_attended = 1
        `;
        const rows = await query<any>(sql, [parseInt(id), schoolId]);

        if (rows.length === 0) {
             return NextResponse.json({ error: "No certificates available" }, { status: 404 });
        }

        return NextResponse.json({ participants: rows });
    } catch (error) {
        console.error("Bulk certificate fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
    }
}
