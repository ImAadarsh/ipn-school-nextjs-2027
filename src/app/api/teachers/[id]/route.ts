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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const teacherId = parseInt(params.id);
    if (!teacherId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    try {
        const body = await request.json();
        const { name, email, mobile, designation, institute_name, city } = body;

        // Verify that this teacher actually belongs to the current school 
        // (meaning they have at least one payment tied to this school)
        const checkSchoolParams = [teacherId, schoolId];
        const checkSchoolSql = `SELECT id FROM payments WHERE user_id = ? AND school_id = ? LIMIT 1`;
        const validTeacher = await query<any>(checkSchoolSql, checkSchoolParams);
        if (validTeacher.length === 0) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check Email uniqueness
        if (email) {
            const emailCheck = await query<{ id: number; name: string; email: string }>(`SELECT id, name, email FROM users WHERE email = ? AND id != ? LIMIT 1`, [email, teacherId]);
            if (emailCheck.length > 0) {
                return NextResponse.json({ 
                    error: "Validation failed", 
                    conflict: `Email is already associated with an existing account: ${emailCheck[0].name} (ID: ${emailCheck[0].id})` 
                }, { status: 409 });
            }
        }

        // Check Mobile uniqueness
        if (mobile) {
            const mobileCheck = await query<{ id: number; name: string; mobile: string }>(`SELECT id, name, mobile FROM users WHERE mobile = ? AND id != ? LIMIT 1`, [mobile, teacherId]);
            if (mobileCheck.length > 0) {
                return NextResponse.json({ 
                    error: "Validation failed", 
                    conflict: `Mobile number is already associated with an existing account: ${mobileCheck[0].name} (ID: ${mobileCheck[0].id})` 
                }, { status: 409 });
            }
        }

        // Proceed to update
        const updateSql = `
            UPDATE users SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                mobile = COALESCE(?, mobile),
                designation = COALESCE(?, designation),
                institute_name = COALESCE(?, institute_name),
                city = COALESCE(?, city)
            WHERE id = ?
        `;
        await query(updateSql, [name, email, mobile, designation, institute_name, city, teacherId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update teacher error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
