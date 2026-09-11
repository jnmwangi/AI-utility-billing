"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
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

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function isoDaysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function InvoiceGenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { customers, meters, generateInvoice } = useStore()
  const billable = customers.filter((c) => c.status !== "TERMINATED")

  const [customerId, setCustomerId] = useState("")
  const [periodStart, setPeriodStart] = useState(isoDaysAgo(30))
  const [periodEnd, setPeriodEnd] = useState(isoDaysAgo(0))
  const [dueDate, setDueDate] = useState(isoDaysFromNow(14))

  useEffect(() => {
    if (open) {
      setCustomerId(billable[0]?.id ?? "")
      setPeriodStart(isoDaysAgo(30))
      setPeriodEnd(isoDaysAgo(0))
      setDueDate(isoDaysFromNow(14))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const meterCount = meters.filter((m) => m.customerId === customerId).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) {
      toast.error("Select a customer.")
      return
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      toast.error("Period start must be before period end.")
      return
    }
    const result = generateInvoice({
      customerId,
      periodStart: new Date(`${periodStart}T00:00:00`).toISOString(),
      periodEnd: new Date(`${periodEnd}T23:59:59`).toISOString(),
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
    })
    if (!result.ok) {
      toast.error(result.error ?? "Could not generate invoice.")
      return
    }
    toast.success(`Generated ${result.invoice?.id} for ${result.invoice?.customerName}.`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Generate invoice</DialogTitle>
            <DialogDescription>Run the tiered tariff engine over a billing period.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={(value) => setCustomerId(value ?? "")}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {billable.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{meterCount} meter(s) will be billed.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Period start</Label>
                <Input id="start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">Period end</Label>
                <Input id="end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={meterCount === 0}>
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
