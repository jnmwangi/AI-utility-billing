"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { round2 } from "@/lib/billing"
import { formatCurrency } from "@/lib/format"
import type { Invoice, PaymentMethod } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const METHODS: PaymentMethod[] = ["CARD", "BANK_TRANSFER", "CASH", "CHECK"]
const METHOD_LABEL: Record<PaymentMethod, string> = {
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CHECK: "Check",
}

export function PaymentDialog({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
}) {
  const { recordPayment } = useStore()
  const outstanding = invoice ? round2(invoice.amountDue + invoice.lateFee - invoice.amountPaid) : 0

  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("CARD")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    if (open && invoice) {
      setAmount(String(round2(invoice.amountDue + invoice.lateFee - invoice.amountPaid)))
      setMethod("CARD")
      setDate(new Date().toISOString().slice(0, 10))
    }
  }, [open, invoice])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return
    const amt = Number.parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a positive payment amount.")
      return
    }
    const result = recordPayment(invoice.id, amt, method, new Date(`${date}T12:00:00`).toISOString())
    if (!result.ok) {
      toast.error(result.error ?? "Could not record payment.")
      return
    }
    toast.success(`Recorded ${formatCurrency(amt)} against ${invoice.id}.`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {invoice ? `${invoice.id} · ${invoice.customerName}` : "Settle an invoice."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Outstanding balance</span>
              <span className="font-mono font-semibold tabular-nums">{formatCurrency(outstanding)}</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pdate">Payment date</Label>
              <Input id="pdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={outstanding <= 0}>
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
