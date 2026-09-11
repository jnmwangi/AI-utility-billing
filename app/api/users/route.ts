import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, userRole } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

async function currentUser() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user }
export async function GET() { const me = await currentUser(); if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const rows = await db.select({ id: user.id, name: user.name, email: user.email, role: userRole.role }).from(user).leftJoin(userRole, eq(user.id, userRole.userId)); return NextResponse.json(rows) }
export async function PATCH(request: Request) { const me = await currentUser(); if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const [assignment] = await db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, me.id)); if (assignment?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const body = await request.json(); const allowed = ["admin", "cashier", "teller", "meter_reader"]; if (!body.userId || !allowed.includes(body.role)) return NextResponse.json({ error: "Invalid role assignment" }, { status: 400 }); await db.insert(userRole).values({ id: crypto.randomUUID(), userId: body.userId, role: body.role }).onConflictDoUpdate({ target: userRole.userId, set: { role: body.role } }); return NextResponse.json({ ok: true }) }
