"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { isOverdue, round2 } from "@/lib/billing"
import { TARIFFS } from "@/lib/tariffs"
import { downloadFile, formatCurrency, formatDate, formatNumber, toCsv } from "@/lib/format"
import type { Invoice } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { InvoiceStatusBadge, UtilityBadge } from "@/components/entity-badges"
import { InvoiceGenerateDialog } from "@/components/invoice-generate-dialog"
import { PaymentDialog } from "@/components/payment-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertTriangle, ChevronDown, Download, MoreHorizontal, Plus } from "lucide-react"

type Filter = "ALL" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE"
const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UNPAID", label: "Unpaid" },
  { key: "PARTIALLY_PAID", label: "Partial" },
  { key: "PAID", label: "Paid" },
  { key: "OVERDUE", label: "Overdue" },
]

export function InvoicesView() {
  const { invoices, payments, applyLateFee } = useStore()
  const [genOpen, setGenOpen] = useState(false)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("ALL")

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (filter === "ALL") return true
      if (filter === "OVERDUE") return isOverdue(i)
      return i.status === filter
    })
  }, [invoices, filter])

  const totals = useMemo(() => {
    const billed = round2(invoices.reduce((s, i) => s + i.amountDue + i.lateFee, 0))
    const collected = round2(invoices.reduce((s, i) => s + i.amountPaid, 0))
    const outstanding = round2(billed - collected)
    return { billed, collected, outstanding }
  }, [invoices])

  function exportInvoices() {
    const rows = invoices.map((i) => [
      i.id,
      i.customerId,
      i.customerName,
      formatDate(i.periodStart),
      formatDate(i.periodEnd),
      i.subtotal,
      i.tax,
      i.lateFee,
      round2(i.amountDue + i.lateFee),
      i.amountPaid,
      round2(i.amountDue + i.lateFee - i.amountPaid),
      i.status,
      formatDate(i.dueDate),
    ])
    const csv = toCsv(
      ["Invoice ID", "Customer ID", "Customer", "Period start", "Period end", "Subtotal", "Tax", "Late fee", "Total due", "Paid", "Balance", "Status", "Due date"],
      rows,
    )
    downloadFile("invoices.csv", csv)
    toast.success("Exported invoices.csv")
  }

  function exportPayments() {
    const rows = payments.map((p) => [p.id, p.invoiceId, p.amount, p.method, formatDate(p.paymentDate)])
    const csv = toCsv(["Payment ID", "Invoice ID", "Amount", "Method", "Date"], rows)
    downloadFile("payments.csv", csv)
    toast.success("Exported payments.csv")
  }

  return (
    <div className="space-y-4 px-5 py-6 md:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total billed", value: totals.billed },
          { label: "Collected", value: totals.collected },
          { label: "Outstanding", value: totals.outstanding },
        ].map((s) => (
          <Card key={s.label} className="gap-0 p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
            <span className="mt-2 font-mono text-xl font-semibold tabular-nums">{formatCurrency(s.value)}</span>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportInvoices}>
            <Download className="size-4" /> Invoices
          </Button>
          <Button variant="outline" size="sm" onClick={exportPayments} disabled={payments.length === 0}>
            <Download className="size-4" /> Payments
          </Button>
          <Button size="sm" onClick={() => setGenOpen(true)}>
            <Plus className="size-4" /> Generate invoice
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-3 pl-4" />
                <th className="px-3 py-3 font-medium">Invoice</th>
                <th className="px-3 py-3 font-medium">Period</th>
                <th className="px-3 py-3 text-right font-medium">Total due</th>
                <th className="px-3 py-3 text-right font-medium">Balance</th>
                <th className="px-3 py-3 font-medium">Due</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No invoices in this view.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const overdue = isOverdue(inv)
                  const balance = round2(inv.amountDue + inv.lateFee - inv.amountPaid)
                  const isOpen = expanded === inv.id
                  return (
                    <InvoiceRow
                      key={inv.id}
                      invoice={inv}
                      overdue={overdue}
                      balance={balance}
                      isOpen={isOpen}
                      onToggle={() => setExpanded(isOpen ? null : inv.id)}
                      onPay={() => setPayInvoice(inv)}
                      onLateFee={() => {
                        const r = applyLateFee(inv.id)
                        if (!r.ok) toast.error(r.error ?? "Could not apply late fee.")
                        else toast.success(`Applied ${formatCurrency(r.fee ?? 0)} late fee to ${inv.id}.`)
                      }}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <InvoiceGenerateDialog open={genOpen} onOpenChange={setGenOpen} />
      <PaymentDialog open={Boolean(payInvoice)} onOpenChange={(o) => !o && setPayInvoice(null)} invoice={payInvoice} />
    </div>
  )
}

function InvoiceRow({
  invoice,
  overdue,
  balance,
  isOpen,
  onToggle,
  onPay,
  onLateFee,
}: {
  invoice: Invoice
  overdue: boolean
  balance: number
  isOpen: boolean
  onToggle: () => void
  onPay: () => void
  onLateFee: () => void
}) {
  const totalDue = round2(invoice.amountDue + invoice.lateFee)
  return (
    <>
      <tr className="border-b border-border transition-colors hover:bg-secondary/40">
        <td className="py-3 pl-4">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label={isOpen ? "Collapse" : "Expand"}>
            <ChevronDown className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="font-mono text-sm">{invoice.id}</div>
          <div className="text-xs text-muted-foreground">{invoice.customerName}</div>
        </td>
        <td className="px-3 py-3 text-muted-foreground">
          {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
        </td>
        <td className="px-3 py-3 text-right font-mono tabular-nums">{formatCurrency(totalDue)}</td>
        <td className="px-3 py-3 text-right font-mono tabular-nums">{formatCurrency(balance)}</td>
        <td className="px-3 py-3">
          <span className={overdue ? "inline-flex items-center gap-1 text-destructive" : "text-muted-foreground"}>
            {overdue ? <AlertTriangle className="size-3.5" /> : null}
            {formatDate(invoice.dueDate)}
          </span>
        </td>
        <td className="px-3 py-3">
          <InvoiceStatusBadge status={invoice.status} />
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
              <DropdownMenuItem onClick={onPay} disabled={invoice.status === "PAID"}>
                Record payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLateFee} disabled={!overdue || invoice.lateFee > 0}>
                Apply late fee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {isOpen ? (
        <tr className="bg-secondary/20">
          <td />
          <td colSpan={7} className="px-3 py-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Line items</h3>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-card text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Meter</th>
                        <th className="px-3 py-2 text-right font-medium">Consumption</th>
                        <th className="px-3 py-2 text-right font-medium">Usage</th>
                        <th className="px-3 py-2 text-right font-medium">Base</th>
                        <th className="px-3 py-2 text-right font-medium">Surcharge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((l) => (
                        <tr key={l.meterId} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <UtilityBadge type={l.type} />
                              <span className="font-mono text-muted-foreground">{l.serialNo}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {formatNumber(l.consumption)} {l.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrency(l.usageCharge)}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrency(l.baseFee)}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrency(l.surcharge)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1.5 rounded-md border border-border bg-card p-4 text-sm">
                <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                <Row label="Tax" value={formatCurrency(invoice.tax)} />
                {invoice.lateFee > 0 ? <Row label="Late fee" value={formatCurrency(invoice.lateFee)} accent /> : null}
                <div className="my-2 border-t border-border" />
                <Row label="Total due" value={formatCurrency(totalDue)} bold />
                <Row label="Paid" value={formatCurrency(invoice.amountPaid)} />
                <Row label="Balance" value={formatCurrency(balance)} bold />
                <Button size="sm" className="mt-3 w-full" onClick={onPay} disabled={invoice.status === "PAID"}>
                  Record payment
                </Button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? "text-primary" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono tabular-nums ${bold ? "font-semibold" : ""} ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  )
}
