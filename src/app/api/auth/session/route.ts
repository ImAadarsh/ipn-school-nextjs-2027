import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("school_session");

    if (!sessionCookie) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
        const sessionData = JSON.parse(
            Buffer.from(sessionCookie.value, "base64").toString("utf-8")
        );
        return NextResponse.json({ authenticated: true, school: sessionData });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
