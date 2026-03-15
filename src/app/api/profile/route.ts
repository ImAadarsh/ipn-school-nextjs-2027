import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

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
        const [school] = await query<{
            id: number; name: string; email: string; mobile: string;
            coupon_prefix: string;
        }>("SELECT id, name, email, mobile, coupon_prefix FROM schools WHERE id = ? LIMIT 1", [schoolId]);

        return NextResponse.json({ school: school || null });
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const schoolId = getSchoolId(cookieStore);
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { name, email, mobile, coupon_prefix, password } = body;

        if (password && password.trim()) {
            const md5Pass = crypto.createHash("md5").update(password).digest("hex");
            await query(
                "UPDATE schools SET name=?, email=?, mobile=?, coupon_prefix=?, password=? WHERE id=?",
                [name, email, mobile, coupon_prefix, md5Pass, schoolId]
            );
        } else {
            await query(
                "UPDATE schools SET name=?, email=?, mobile=?, coupon_prefix=? WHERE id=?",
                [name, email, mobile, coupon_prefix, schoolId]
            );
        }

        // Update session cookie with new name/email
        const sessionCookie = cookieStore.get("school_session");
        if (sessionCookie) {
            const sessionData = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
            sessionData.name = name;
            sessionData.email = email;
            sessionData.mobile = mobile;
            sessionData.coupon_prefix = coupon_prefix;
            cookieStore.set("school_session", Buffer.from(JSON.stringify(sessionData)).toString("base64"), {
                httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
            });
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully!" });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
}
