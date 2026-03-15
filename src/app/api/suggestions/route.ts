import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("school_session");
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { topic, trainer } = body;
        
        // Find school info to insert suggestion
        const s = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
        const schoolId = s.userid as number;
        
        const rows = await query<{ name: string; email: string; mobile: string }>("SELECT name, email, mobile FROM schools WHERE id = ?", [schoolId]);
        
        if (rows.length === 0) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }
        
        const school = rows[0];
        
        const sql = `
            INSERT INTO suggestion (name, phone, email, topic, trainer)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await query(sql, [school.name, school.mobile || "N/A", school.email, topic, trainer || null]);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Suggestion error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
