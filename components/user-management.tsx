"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/app-shell"
import { RefreshCw, ShieldCheck, UserRound } from "lucide-react"

type Row = { id: string; name: string; email: string; role: string | null; canManageUsers: boolean }
type Viewer = { role: string | null; canManageUsers: boolean; isSuperAdmin: boolean }
const roles = ["super_admin", "admin", "cashier", "teller", "meter_reader"]

export function UserManagement() {
  const [rows, setRows] = useState<Row[]>([])
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    const response = await fetch("/api/users", { cache: "no-store" })
    if (response.ok) {
      const data = await response.json()
      setRows(data.rows)
      setViewer(data.viewer)
    } else {
      setRows([])
      setViewer(null)
      setMessage(response.status === 403 ? "Your account does not have user-management access." : "Could not load workspace members.")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateAccess(userId: string, role: string, canManageUsers: boolean) {
    setMessage("")
    const response = await fetch("/api/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, role, canManageUsers }) })
    setMessage(response.ok ? "Access updated." : (await response.json()).error ?? "Could not update access.")
    if (response.ok) load()
  }

  return <div>
    <PageHeader title="User management" description="Control workspace access with least-privilege roles"><button onClick={load} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm"><RefreshCw className="size-3.5" /> Refresh</button></PageHeader>
    <div className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-medium">Restricted administration</p><p className="text-sm leading-6 text-muted-foreground">Only a super admin or an admin explicitly granted user-management access can change roles. Super admins alone can delegate that permission.</p></div></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-5">{roles.map((role) => <div key={role} className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{role.replace("_", " ")}</p><p className="mt-2 text-2xl font-semibold">{rows.filter((row) => row.role === role).length}</p></div>)}</div>
      {message && <p className="mb-4 text-sm text-primary">{message}</p>}
      <div className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex items-center gap-2 border-b border-border p-4"><UserRound className="size-4 text-primary" /><div><h2 className="font-medium">Workspace members</h2><p className="text-sm text-muted-foreground">Signed in as {viewer?.role?.replace("_", " ") ?? "staff"}.</p></div></div>
        {loading ? <p className="p-5 text-sm text-muted-foreground">Loading members…</p> : rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No members available.</p> : <div className="divide-y divide-border">{rows.map((row) => <div key={row.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{row.name}</p><p className="text-sm text-muted-foreground">{row.email}</p></div><div className="flex flex-wrap items-center gap-3"><select value={row.role ?? "cashier"} onChange={(event) => updateAccess(row.id, event.target.value, row.canManageUsers)} className="h-9 rounded-md border border-border bg-background px-3 text-sm" aria-label={`Role for ${row.name}`}><option value="admin">Admin</option><option value="cashier">Cashier</option><option value="teller">Teller</option><option value="meter_reader">Meter reader</option></select>{viewer?.isSuperAdmin && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.canManageUsers} onChange={(event) => updateAccess(row.id, row.role ?? "cashier", event.target.checked)} /> Manage users</label>}</div></div>)}</div>}
      </div>
    </div>
  </div>
}
