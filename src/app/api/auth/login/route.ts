import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";

interface School {
    id: number;
    email: string;
    password: string;
    name: string;
    mobile: string;
    coupon_prefix: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        const rows = await query<School>(
            "SELECT * FROM schools WHERE email = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const school = rows[0];
        let passwordValid = false;

        // Check if password is bcrypt ($2y$ or $2a$ or $2b$)
        if (school.password.startsWith("$2")) {
            // PHP uses $2y$, bcryptjs uses $2a$ — they're compatible, just swap prefix
            const normalizedHash = school.password.replace(/^\$2y\$/, "$2a$");
            passwordValid = await bcrypt.compare(password, normalizedHash);
        } else {
            // Fallback: check plain text or MD5
            const md5Pass = crypto.createHash("md5").update(password).digest("hex");
            passwordValid = school.password === password || school.password === md5Pass;
        }

        if (!passwordValid) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Create session token
        const token = crypto.randomBytes(32).toString("hex");

        const sessionData = JSON.stringify({
            userid: school.id,
            name: school.name,
            email: school.email,
            mobile: school.mobile,
            coupon_prefix: school.coupon_prefix,
            token,
        });

        const cookieStore = await cookies();
        cookieStore.set("school_session", Buffer.from(sessionData).toString("base64"), {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return NextResponse.json({
            success: true,
            school: {
                id: school.id,
                name: school.name,
                email: school.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
