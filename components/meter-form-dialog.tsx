"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import type { UtilityType } from "@/lib/types"
import { TARIFFS } from "@/lib/tariffs"
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

const TYPES: UtilityType[] = ["ELECTRICITY", "WATER", "GAS"]

export function MeterFormDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
}) {
  const { addMeter } = useStore()
  const [form, setForm] = useState({ type: "ELECTRICITY" as UtilityType, serialNo: "", multiplier: "1", lastReading: "0" })

  useEffect(() => {
    if (open) setForm({ type: "ELECTRICITY", serialNo: "", multiplier: "1", lastReading: "0" })
  }, [open])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const multiplier = Number.parseFloat(form.multiplier)
    const lastReading = Number.parseFloat(form.lastReading)
    if (!form.serialNo.trim()) {
      toast.error("Serial number is required.")
      return
    }
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      toast.error("Multiplier must be a positive number.")
      return
    }
    if (!Number.isFinite(lastReading) || lastReading < 0) {
      toast.error("Initial reading must be zero or greater.")
      return
    }
    const meter = addMeter({ customerId, type: form.type, serialNo: form.serialNo.trim(), multiplier, lastReading })
    toast.success(`Linked meter ${meter.serialNo} (${meter.id}).`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add meter</DialogTitle>
            <DialogDescription>Link a utility meter to {customerId}.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Utility type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as UtilityType })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TARIFFS[t].label} ({TARIFFS[t].unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serial">Serial number</Label>
              <Input id="serial" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} placeholder="ELEC-88321" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input id="multiplier" inputMode="decimal" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastReading">Initial reading</Label>
                <Input id="lastReading" inputMode="decimal" value={form.lastReading} onChange={(e) => setForm({ ...form, lastReading: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add meter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
