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
        const sql = `
            SELECT v.id, v.user_id, v.name, v.email, v.mobile, v.institute_name, v.reason, v.status, v.admin_notes, v.created_at as submitted_at
            FROM profile_correction_requests v
            JOIN users u ON v.user_id = u.id
            WHERE u.school_id = ?
            ORDER BY v.created_at DESC
        `;
        const data = await query<any>(sql, [schoolId]);
        return NextResponse.json({ requests: data });
    } catch (error) {
        console.error("Verification fetch error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { requestId, status } = await req.json();
        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // We only allow this school to update if the request belongs to its teachers
        const checkSql = `
            SELECT v.id 
            FROM profile_correction_requests v
            JOIN users u ON v.user_id = u.id
            WHERE v.id = ? AND u.school_id = ?
        `;
        const check = await query<{ id: number }>(checkSql, [requestId, schoolId]);
        
        if (check.length === 0) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        await query("UPDATE profile_correction_requests SET status = ? WHERE id = ?", [status, requestId]);

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error("Verification update error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { email, name, mobile, institute_name, reason } = body;

        if (!email || !name || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find the user_id of the teacher in this school
        const users = await query<{ id: number }>(
            "SELECT id FROM users WHERE email = ? AND school_id = ? LIMIT 1",
            [email, schoolId]
        );
        
        const userId = users.length > 0 ? users[0].id : 0;

        await query(`
            INSERT INTO profile_correction_requests 
            (user_id, name, email, mobile, institute_name, reason, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `, [userId, name, email, mobile || "", institute_name || "", reason]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Verification create error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
