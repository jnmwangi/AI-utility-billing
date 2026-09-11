import type { Customer, Invoice, InvoiceLine, Meter, Payment, Reading } from "./types"
import { computeUsageCharge, LATE_FEE_FLAT, LATE_FEE_PERCENT, TARIFFS } from "./tariffs"

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Consumption for a new reading given the meter's previous value and multiplier. */
export function computeConsumption(value: number, previous: number, multiplier: number): number {
  return round2((value - previous) * multiplier)
}

interface BuildInvoiceInput {
  customer: Customer
  meters: Meter[]
  readings: Reading[]
  periodStart: string
  periodEnd: string
  dueDate: string
}

/**
 * Build a draft invoice for a customer over a billing period. Sums metered
 * consumption per meter within the period and applies the tiered tariff engine.
 */
export function buildInvoice(input: BuildInvoiceInput): Omit<Invoice, "id"> {
  const { customer, meters, readings, periodStart, periodEnd, dueDate } = input
  const start = new Date(periodStart).getTime()
  const end = new Date(periodEnd).getTime()

  const lines: InvoiceLine[] = []
  let subtotal = 0
  let tax = 0

  for (const meter of meters) {
    const tariff = TARIFFS[meter.type]
    const consumption = readings
      .filter((r) => r.meterId === meter.id)
      .filter((r) => {
        const t = new Date(r.readAt).getTime()
        return t >= start && t <= end
      })
      .reduce((sum, r) => sum + r.consumption, 0)

    const usageCharge = round2(computeUsageCharge(consumption, tariff.tiers))
    const lineNet = usageCharge + tariff.baseFee + tariff.surcharge

    lines.push({
      meterId: meter.id,
      serialNo: meter.serialNo,
      type: meter.type,
      consumption: round2(consumption),
      unit: tariff.unit,
      baseFee: tariff.baseFee,
      usageCharge,
      surcharge: tariff.surcharge,
    })

    subtotal += lineNet
    tax += lineNet * tariff.taxRate
  }

  subtotal = round2(subtotal)
  tax = round2(tax)

  return {
    customerId: customer.id,
    customerName: customer.name,
    periodStart,
    periodEnd,
    lines,
    subtotal,
    tax,
    lateFee: 0,
    amountDue: round2(subtotal + tax),
    amountPaid: 0,
    status: "UNPAID",
    dueDate,
    createdAt: new Date().toISOString(),
  }
}

/** Late fee for an overdue balance: greater of a flat fee or a percentage. */
export function computeLateFee(outstanding: number): number {
  if (outstanding <= 0) return 0
  return round2(Math.max(LATE_FEE_FLAT, outstanding * LATE_FEE_PERCENT))
}

export function isOverdue(invoice: Invoice): boolean {
  return invoice.status !== "PAID" && new Date(invoice.dueDate).getTime() < Date.now()
}

export function totalPaid(payments: Payment[], invoiceId: string): number {
  return round2(payments.filter((p) => p.invoiceId === invoiceId).reduce((s, p) => s + p.amount, 0))
}
