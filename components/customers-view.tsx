"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import type { Customer } from "@/lib/types"
import { formatDate, formatNumber, downloadFile, toCsv } from "@/lib/format"
import { TARIFFS } from "@/lib/tariffs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CustomerStatusBadge, UtilityBadge } from "@/components/entity-badges"
import { CustomerFormDialog } from "@/components/customer-form-dialog"
import { MeterFormDialog } from "@/components/meter-form-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Download, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"

export function CustomersView() {
  const { customers, meters, deleteCustomer, deleteMeter } = useStore()
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>(undefined)
  const [meterFor, setMeterFor] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    )
  }, [customers, query])

  const meterCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of meters) map.set(m.customerId, (map.get(m.customerId) ?? 0) + 1)
    return map
  }, [meters])

  function exportCsv() {
    const rows = customers.map((c) => [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.address,
      c.status,
      meterCount.get(c.id) ?? 0,
      formatDate(c.createdAt),
    ])
    const csv = toCsv(
      ["Account ID", "Name", "Email", "Phone", "Address", "Status", "Meters", "Created"],
      rows,
    )
    downloadFile("customers.csv", csv)
    toast.success("Exported customers.csv")
  }

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4 px-5 py-6 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accounts…" className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4" /> New customer
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-3 pl-4" />
                <th className="px-3 py-3 font-medium">Account</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Address</th>
                <th className="px-3 py-3 font-medium">Meters</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No customers match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const custMeters = meters.filter((m) => m.customerId === c.id)
                  const isOpen = expanded === c.id
                  return (
                    <FragmentRow
                      key={c.id}
                      customer={c}
                      isOpen={isOpen}
                      meters={custMeters}
                      onToggle={() => setExpanded(isOpen ? null : c.id)}
                      onEdit={() => openEdit(c)}
                      onTerminate={() => {
                        deleteCustomer(c.id)
                        toast.success(`${c.name} marked terminated (soft delete).`)
                      }}
                      onAddMeter={() => setMeterFor(c.id)}
                      onDeleteMeter={(id, serial) => {
                        deleteMeter(id)
                        toast.success(`Removed meter ${serial}.`)
                      }}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
      {meterFor ? (
        <MeterFormDialog open={Boolean(meterFor)} onOpenChange={(o) => !o && setMeterFor(null)} customerId={meterFor} />
      ) : null}
    </div>
  )
}

function FragmentRow({
  customer,
  meters,
  isOpen,
  onToggle,
  onEdit,
  onTerminate,
  onAddMeter,
  onDeleteMeter,
}: {
  customer: Customer
  meters: { id: string; type: keyof typeof TARIFFS; serialNo: string; multiplier: number; lastReading: number; installedAt: string }[]
  isOpen: boolean
  onToggle: () => void
  onEdit: () => void
  onTerminate: () => void
  onAddMeter: () => void
  onDeleteMeter: (id: string, serial: string) => void
}) {
  return (
    <>
      <tr className="border-b border-border transition-colors hover:bg-secondary/40">
        <td className="py-3 pl-4">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label={isOpen ? "Collapse" : "Expand"}>
            <ChevronDown className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="font-medium">{customer.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{customer.id}</div>
        </td>
        <td className="px-3 py-3">
          <div>{customer.email}</div>
          <div className="text-xs text-muted-foreground">{customer.phone}</div>
        </td>
        <td className="max-w-[16rem] px-3 py-3 text-muted-foreground">{customer.address}</td>
        <td className="px-3 py-3 font-mono tabular-nums">{meters.length}</td>
        <td className="px-3 py-3">
          <CustomerStatusBadge status={customer.status} />
        </td>
        <td className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit account</DropdownMenuItem>
              <DropdownMenuItem onClick={onAddMeter}>Add meter</DropdownMenuItem>
              <DropdownMenuItem onClick={onTerminate} disabled={customer.status === "TERMINATED"} variant="destructive">
                Terminate account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {isOpen ? (
        <tr className="bg-secondary/20">
          <td />
          <td colSpan={6} className="px-3 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linked meters</h3>
              <Button variant="outline" size="sm" onClick={onAddMeter}>
                <Plus className="size-3.5" /> Add meter
              </Button>
            </div>
            {meters.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No meters linked to this account.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {meters.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2 rounded-md border border-border bg-card p-3">
                    <div className="space-y-1">
                      <UtilityBadge type={m.type} />
                      <div className="font-mono text-sm">{m.serialNo}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.id} · last {formatNumber(m.lastReading)} {TARIFFS[m.type].unit} · ×{m.multiplier}
                      </div>
                      <div className="text-xs text-muted-foreground">installed {formatDate(m.installedAt)}</div>
                    </div>
                    <button
                      onClick={() => onDeleteMeter(m.id, m.serialNo)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove meter ${m.serialNo}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}
