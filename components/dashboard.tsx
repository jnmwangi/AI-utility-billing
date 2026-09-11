"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useStore } from "@/lib/store"
import { isOverdue, round2 } from "@/lib/billing"
import { TARIFFS } from "@/lib/tariffs"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"
import type { UtilityType } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { InvoiceStatusBadge, UtilityBadge } from "@/components/entity-badges"
import { AlertTriangle, Gauge, Receipt, Users, Wallet } from "lucide-react"

const UTILITY_ORDER: UtilityType[] = ["ELECTRICITY", "WATER", "GAS"]
const BAR_COLOR: Record<UtilityType, string> = {
  ELECTRICITY: "bg-chart-1",
  WATER: "bg-chart-2",
  GAS: "bg-chart-3",
}

export function Dashboard() {
  const { customers, meters, readings, invoices } = useStore()

  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.status === "ACTIVE").length
    const outstanding = round2(
      invoices.reduce((sum, i) => sum + (i.amountDue + i.lateFee - i.amountPaid), 0),
    )
    const overdue = invoices.filter(isOverdue).length

    const byType = UTILITY_ORDER.map((type) => {
      const meterIds = new Set(meters.filter((m) => m.type === type).map((m) => m.id))
      const consumption = readings
        .filter((r) => meterIds.has(r.meterId))
        .reduce((s, r) => s + r.consumption, 0)
      return { type, consumption: round2(consumption), unit: TARIFFS[type].unit, meters: meterIds.size }
    })
    const maxConsumption = Math.max(1, ...byType.map((b) => b.consumption))

    return { activeCustomers, outstanding, overdue, byType, maxConsumption }
  }, [customers, meters, readings, invoices])

  const recentInvoices = invoices.slice(0, 5)

  const cards = [
    { label: "Active Customers", value: String(stats.activeCustomers), sub: `${customers.length} total accounts`, icon: Users },
    { label: "Meters", value: String(meters.length), sub: `${readings.length} readings logged`, icon: Gauge },
    { label: "Outstanding Balance", value: formatCurrency(stats.outstanding), sub: `${invoices.length} invoices issued`, icon: Wallet },
    { label: "Overdue Invoices", value: String(stats.overdue), sub: "past due date", icon: AlertTriangle, alert: stats.overdue > 0 },
  ]

  return (
    <div className="space-y-6 px-5 py-6 md:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="gap-0 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</span>
                <Icon className={card.alert ? "size-4 text-destructive" : "size-4 text-muted-foreground"} />
              </div>
              <div className="mt-3 font-mono text-2xl font-semibold tracking-tight tabular-nums">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Consumption by utility</h2>
            <span className="text-xs text-muted-foreground">metered totals</span>
          </div>
          <div className="mt-5 space-y-5">
            {stats.byType.map((b) => (
              <div key={b.type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <UtilityBadge type={b.type} />
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {formatNumber(b.consumption)} {b.unit}
                    <span className="ml-2 text-xs">· {b.meters} meters</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${BAR_COLOR[b.type]}`}
                    style={{ width: `${Math.max(3, (b.consumption / stats.maxConsumption) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent invoices</h2>
            <Link href="/invoices" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {recentInvoices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <p className="mt-0.5 truncate text-sm">{inv.customerName}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums">{formatCurrency(inv.amountDue + inv.lateFee)}</div>
                    <p className="text-xs text-muted-foreground">due {formatDate(inv.dueDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Quick start</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          This console mirrors the Utility Billing spec: manage customers and their electricity, water, and gas meters,
          ingest readings, run the tiered tariff engine, and settle invoices with payments. All data is held in memory
          for the session and can be exported to CSV.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/customers" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Manage customers
          </Link>
          <Link href="/readings" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
            Record readings
          </Link>
          <Link href="/invoices" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
            Generate invoices
          </Link>
        </div>
      </Card>
    </div>
  )
}
