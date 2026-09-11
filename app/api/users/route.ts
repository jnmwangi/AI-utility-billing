import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, userRole } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

async function currentUser() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user }
async function currentAssignment(userId: string) { const [assignment] = await db.select({ role: userRole.role, canManageUsers: userRole.canManageUsers }).from(userRole).where(eq(userRole.userId, userId)); return assignment }
function canManageUsers(assignment?: { role: string; canManageUsers: boolean }) { return assignment?.role === "super_admin" || (assignment?.role === "admin" && assignment.canManageUsers) }

export async function GET() { const me = await currentUser(); if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const assignment = await currentAssignment(me.id); if (!canManageUsers(assignment)) return NextResponse.json({ error: "User management access has not been granted." }, { status: 403 }); const rows = await db.select({ id: user.id, name: user.name, email: user.email, role: userRole.role, canManageUsers: userRole.canManageUsers }).from(user).leftJoin(userRole, eq(user.id, userRole.userId)); return NextResponse.json({ rows, viewer: { role: assignment?.role ?? null, canManageUsers: canManageUsers(assignment), isSuperAdmin: assignment?.role === "super_admin" } }) }

export async function PATCH(request: Request) { const me = await currentUser(); if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const assignment = await currentAssignment(me.id); if (!canManageUsers(assignment)) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const body = await request.json(); const allowed = ["admin", "cashier", "teller", "meter_reader"]; if (!body.userId || typeof body.role !== "string" || !allowed.includes(body.role)) return NextResponse.json({ error: "Invalid role assignment" }, { status: 400 }); if (body.userId === me.id && body.role !== assignment?.role) return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 }); const requestedManagement = body.canManageUsers === true; if (requestedManagement && assignment?.role !== "super_admin") return NextResponse.json({ error: "Only a super admin can grant user-management access." }, { status: 403 }); await db.insert(userRole).values({ id: crypto.randomUUID(), userId: body.userId, role: body.role, canManageUsers: requestedManagement }).onConflictDoUpdate({ target: userRole.userId, set: { role: body.role, ...(assignment?.role === "super_admin" ? { canManageUsers: requestedManagement } : {}) } }); return NextResponse.json({ ok: true }) }
