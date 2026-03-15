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
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const attended = searchParams.get("attended");

    try {
        let sql = `
      SELECT p.id as payment_id, p.user_id, p.is_attended, p.is_school, p.order_id, p.attended_duration,
             u.name as user_name, u.email, u.mobile
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.workshop_id = ? AND p.school_id = ?
    `;
        const params2: (string | number)[] = [parseInt(id), schoolId];

        if (search) {
            sql += " AND (u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)";
            const like = `%${search}%`;
            params2.push(like, like, like);
        }
        if (attended !== null && attended !== "") {
            sql += " AND p.is_attended = ?";
            params2.push(parseInt(attended));
        }

        sql += " ORDER BY u.name ASC";

        const rows = await query<{
            payment_id: number; user_id: number; is_attended: number; is_school: number;
            order_id: string; user_name: string; email: string; mobile: string;
            attended_duration: number;
        }>(sql, params2);

        // Also get workshop details
        const [workshop] = await query<{
            id: number; name: string; start_date: string; type: number;
            trainer_name: string; workshop_id: string; meeting_id: string;
        }>("SELECT * FROM workshops WHERE id = ? LIMIT 1", [parseInt(id)]);

        return NextResponse.json({ enrollments: rows, workshop: workshop || null });
    } catch (error) {
        console.error("Enrollments error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await params;
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { paymentId, action } = body;
        // action: "enable" → is_school=2, "disable" → is_school=1
        const newValue = action === "enable" ? 2 : 1;

        await query(
            "UPDATE payments SET is_school = ? WHERE id = ? AND school_id = ?",
            [newValue, paymentId, schoolId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Certificate toggle error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
