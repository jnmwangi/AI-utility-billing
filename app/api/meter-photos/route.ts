import { put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "A meter image is required." }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Meter photos must be 8 MB or smaller." }, { status: 400 })
  const blob = await put(`meter-readings/${session.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, { access: "private", contentType: file.type })
  return NextResponse.json({ pathname: blob.pathname })
}
