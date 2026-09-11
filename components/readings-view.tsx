"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { computeConsumption } from "@/lib/billing"
import { TARIFFS } from "@/lib/tariffs"
import { downloadFile, formatDateTime, formatNumber, toCsv } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UtilityBadge } from "@/components/entity-badges"
import { Download, Gauge } from "lucide-react"

function todayLocalDate(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function ReadingsView() {
  const { customers, meters, readings, addReading } = useStore()
  const [meterId, setMeterId] = useState<string>(meters[0]?.id ?? "")
  const [value, setValue] = useState("")
  const [date, setDate] = useState(todayLocalDate())

  const customerName = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers])
  const meterMap = useMemo(() => new Map(meters.map((m) => [m.id, m])), [meters])
  const selected = meterMap.get(meterId)

  const preview = useMemo(() => {
    if (!selected) return null
    const v = Number.parseFloat(value)
    if (!Number.isFinite(v)) return null
    if (v < selected.lastReading) return { error: true, consumption: 0 }
    return { error: false, consumption: computeConsumption(v, selected.lastReading, selected.multiplier) }
  }, [selected, value])

  const history = useMemo(
    () => [...readings].sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime()),
    [readings],
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) {
      toast.error("Select a meter.")
      return
    }
    const v = Number.parseFloat(value)
    if (!Number.isFinite(v)) {
      toast.error("Enter a valid meter value.")
      return
    }
    const readAt = new Date(`${date}T12:00:00`).toISOString()
    const result = addReading(selected.id, v, readAt)
    if (!result.ok) {
      toast.error(result.error ?? "Could not record reading.")
      return
    }
    toast.success(`Recorded reading for ${selected.serialNo}.`)
    setValue("")
  }

  function exportCsv() {
    const rows = history.map((r) => {
      const m = meterMap.get(r.meterId)
      return [
        r.id,
        r.meterId,
        m?.serialNo ?? "",
        m?.type ?? "",
        r.value,
        r.consumption,
        m ? TARIFFS[m.type].unit : "",
        formatDateTime(r.readAt),
      ]
    })
    const csv = toCsv(["Reading ID", "Meter ID", "Serial", "Type", "Value", "Consumption", "Unit", "Read at"], rows)
    downloadFile("readings.csv", csv)
    toast.success("Exported readings.csv")
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-5 py-6 md:px-8 lg:grid-cols-3">
      <Card className="h-fit p-5 lg:col-span-1">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Record reading</h2>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="meter">Meter</Label>
            <Select value={meterId} onValueChange={(value) => setMeterId(value ?? "")}>
              <SelectTrigger id="meter">
                <SelectValue placeholder="Select a meter" />
              </SelectTrigger>
              <SelectContent>
                {meters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.serialNo} — {TARIFFS[m.type].label} ({customerName.get(m.customerId)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
              <UtilityBadge type={selected.type} />
              <span className="font-mono text-muted-foreground">
                last {formatNumber(selected.lastReading)} {TARIFFS[selected.type].unit}
              </span>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="value">New meter value</Label>
            <Input id="value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 5240.8" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Read date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {preview ? (
            preview.error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Value is below the last reading — negative consumption is not allowed.
              </p>
            ) : (
              <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
                Consumption: {formatNumber(preview.consumption)} {selected ? TARIFFS[selected.type].unit : ""}
                {selected && selected.multiplier !== 1 ? ` (×${selected.multiplier})` : ""}
              </p>
            )
          ) : null}

          <Button type="submit" className="w-full" disabled={!selected}>
            Record reading
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0 lg:col-span-2">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Reading history</h2>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={history.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 text-right font-medium">Value</th>
                <th className="px-3 py-3 text-right font-medium">Consumption</th>
                <th className="px-3 py-3 font-medium">Read at</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No readings recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((r) => {
                  const m = meterMap.get(r.meterId)
                  return (
                    <tr key={r.id} className="border-b border-border hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm">{m?.serialNo ?? r.meterId}</div>
                        <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
                      </td>
                      <td className="px-3 py-3">{m ? <UtilityBadge type={m.type} /> : "—"}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{formatNumber(r.value)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        {formatNumber(r.consumption)} {m ? TARIFFS[m.type].unit : ""}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{formatDateTime(r.readAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
