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

export async function GET() {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Fetch all workshops (Upcoming OR Completed within the last 6 months)
        const allWorkshops = await query<any>(
            `SELECT id, name, start_date, type, trainer_name 
             FROM workshops 
             WHERE status = 1 AND is_deleted = 0
             AND (type = 0 OR (type = 1 AND start_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)))
             ORDER BY start_date ASC`
        );

        // Fetch workshop IDs where the school has at least one payment/enrollment
        const enrolledWorkshopIdsRaw = await query<any>(
            `SELECT DISTINCT workshop_id 
             FROM payments 
             WHERE school_id = ?`,
            [schoolId]
        );
        const enrolledIds = new Set(enrolledWorkshopIdsRaw.map((r: any) => r.workshop_id));

        const enrolled: any[] = [];
        const notEnrolled: any[] = [];

        allWorkshops.forEach((w: any) => {
            if (enrolledIds.has(w.id)) {
                enrolled.push(w);
            } else {
                notEnrolled.push(w);
            }
        });

        return NextResponse.json({ enrolled, notEnrolled });
    } catch (error) {
        console.error("Calendar fetch error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
