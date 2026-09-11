import { cn } from "@/lib/utils"
import { Droplets, Flame, Zap } from "lucide-react"
import type { CustomerStatus, InvoiceStatus, UtilityType } from "@/lib/types"

const UTILITY_META: Record<UtilityType, { label: string; icon: typeof Zap; className: string }> = {
  ELECTRICITY: { label: "Electricity", icon: Zap, className: "text-chart-1" },
  WATER: { label: "Water", icon: Droplets, className: "text-chart-2" },
  GAS: { label: "Gas", icon: Flame, className: "text-chart-3" },
}

export function UtilityBadge({ type, className }: { type: UtilityType; className?: string }) {
  const meta = UTILITY_META[type]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <Icon className={cn("size-3.5", meta.className)} />
      {meta.label}
    </span>
  )
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const map: Record<CustomerStatus, string> = {
    ACTIVE: "border-chart-4/40 bg-chart-4/10 text-chart-4",
    SUSPENDED: "border-primary/40 bg-primary/10 text-primary",
    TERMINATED: "border-destructive/40 bg-destructive/10 text-destructive",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", map[status])}>
      {status.toLowerCase()}
    </span>
  )
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { label: string; className: string }> = {
    UNPAID: { label: "Unpaid", className: "border-destructive/40 bg-destructive/10 text-destructive" },
    PARTIALLY_PAID: { label: "Partial", className: "border-primary/40 bg-primary/10 text-primary" },
    PAID: { label: "Paid", className: "border-chart-4/40 bg-chart-4/10 text-chart-4" },
  }
  const meta = map[status]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.className)}>
      {meta.label}
    </span>
  )
}
