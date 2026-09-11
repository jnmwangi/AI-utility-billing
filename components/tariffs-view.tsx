"use client"

import { LATE_FEE_FLAT, LATE_FEE_PERCENT, TARIFFS } from "@/lib/tariffs"
import type { UtilityType } from "@/lib/types"
import { formatCurrency } from "@/lib/format"
import { Card } from "@/components/ui/card"
import { UtilityBadge } from "@/components/entity-badges"

const ORDER: UtilityType[] = ["ELECTRICITY", "WATER", "GAS"]

export function TariffsView() {
  return (
    <div className="space-y-6 px-5 py-6 md:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ORDER.map((type) => {
          const t = TARIFFS[type]
          let lower = 0
          return (
            <Card key={type} className="p-5">
              <div className="flex items-center justify-between">
                <UtilityBadge type={type} />
                <span className="font-mono text-xs text-muted-foreground">per {t.unit}</span>
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiered rates</h3>
                <div className="space-y-1.5">
                  {t.tiers.map((tier, idx) => {
                    const from = lower
                    const to = tier.upTo
                    lower = tier.upTo ?? lower
                    return (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                        <span className="font-mono text-muted-foreground">
                          {from.toLocaleString()}
                          {" – "}
                          {to === null ? "∞" : to.toLocaleString()} {t.unit}
                        </span>
                        <span className="font-mono font-medium tabular-nums">{formatCurrency(tier.rate)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Base fee</dt>
                  <dd className="font-mono tabular-nums">{formatCurrency(t.baseFee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Surcharge</dt>
                  <dd className="font-mono tabular-nums">{formatCurrency(t.surcharge)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax rate</dt>
                  <dd className="font-mono tabular-nums">{(t.taxRate * 100).toFixed(1)}%</dd>
                </div>
              </dl>
            </Card>
          )
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">How charges are computed</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. Consumption.</span> Each reading yields consumption as
            {" "}<code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">(value − previous) × multiplier</code>. Readings below the previous value are rejected.
          </li>
          <li>
            <span className="font-medium text-foreground">2. Tiered usage.</span> Consumption is split across the brackets above and each band is charged at its own rate.
          </li>
          <li>
            <span className="font-medium text-foreground">3. Line total.</span> Usage charge + base fee + surcharge per meter, summed into the invoice subtotal.
          </li>
          <li>
            <span className="font-medium text-foreground">4. Tax.</span> Applied per utility at its own rate, then added to the subtotal.
          </li>
          <li>
            <span className="font-medium text-foreground">5. Late fee.</span> Overdue invoices can be charged the greater of {formatCurrency(LATE_FEE_FLAT)} or {(LATE_FEE_PERCENT * 100).toFixed(1)}% of the outstanding balance.
          </li>
        </ol>
      </Card>
    </div>
  )
}
