import type { UtilityType } from "./types"

export interface Tier {
  /** Upper bound of this bracket (inclusive). null means unbounded (top tier). */
  upTo: number | null
  rate: number
}

export interface Tariff {
  type: UtilityType
  label: string
  unit: string
  baseFee: number
  tiers: Tier[]
  taxRate: number
  surcharge: number
}

export const LATE_FEE_PERCENT = 0.015
export const LATE_FEE_FLAT = 5

export const TARIFFS: Record<UtilityType, Tariff> = {
  ELECTRICITY: {
    type: "ELECTRICITY",
    label: "Electricity",
    unit: "kWh",
    baseFee: 12,
    taxRate: 0.08,
    surcharge: 3.5,
    tiers: [
      { upTo: 500, rate: 0.12 },
      { upTo: 1000, rate: 0.18 },
      { upTo: null, rate: 0.24 },
    ],
  },
  WATER: {
    type: "WATER",
    label: "Water",
    unit: "gal",
    baseFee: 8,
    taxRate: 0.05,
    surcharge: 2,
    tiers: [
      { upTo: 1000, rate: 0.05 },
      { upTo: 5000, rate: 0.1 },
      { upTo: null, rate: 0.15 },
    ],
  },
  GAS: {
    type: "GAS",
    label: "Gas",
    unit: "therm",
    baseFee: 10,
    taxRate: 0.06,
    surcharge: 2.5,
    tiers: [
      { upTo: 100, rate: 0.6 },
      { upTo: 300, rate: 0.85 },
      { upTo: null, rate: 1.1 },
    ],
  },
}

/** Compute the tiered usage charge for a given consumption against a tariff's brackets. */
export function computeUsageCharge(consumption: number, tiers: Tier[]): number {
  let remaining = Math.max(0, consumption)
  let lower = 0
  let charge = 0

  for (const tier of tiers) {
    if (remaining <= 0) break
    const bandSize = tier.upTo === null ? remaining : Math.max(0, tier.upTo - lower)
    const used = Math.min(remaining, bandSize)
    charge += used * tier.rate
    remaining -= used
    lower = tier.upTo ?? lower
  }

  return charge
}

/** Human-readable description of tier brackets, e.g. "0–500: $0.12". */
export function describeTier(tier: Tier, lower: number, unit: string): string {
  const upper = tier.upTo === null ? "∞" : tier.upTo.toLocaleString()
  return `${lower.toLocaleString()}–${upper} ${unit}`
}
