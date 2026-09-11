import type { Customer, Invoice, Meter, Payment, Reading } from "./types"
import { buildInvoice, computeConsumption } from "./billing"

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export interface SeedData {
  customers: Customer[]
  meters: Meter[]
  readings: Reading[]
  invoices: Invoice[]
  payments: Payment[]
}

export function createSeedData(): SeedData {
  const customers: Customer[] = [
    {
      id: "CUST-0042",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1 (555) 013-8842",
      address: "123 Maple St, Springfield",
      status: "ACTIVE",
      createdAt: daysAgo(210),
    },
    {
      id: "CUST-0043",
      name: "Marcus Lee",
      email: "marcus.lee@example.com",
      phone: "+1 (555) 077-1120",
      address: "44 Birch Ave, Riverton",
      status: "ACTIVE",
      createdAt: daysAgo(180),
    },
    {
      id: "CUST-0044",
      name: "Aisha Rahman",
      email: "aisha.r@example.com",
      phone: "+1 (555) 220-9931",
      address: "9 Cedar Ct, Lakeside",
      status: "SUSPENDED",
      createdAt: daysAgo(95),
    },
    {
      id: "CUST-0045",
      name: "Diego Fernández",
      email: "diego.f@example.com",
      phone: "+1 (555) 408-5567",
      address: "781 Willow Rd, Hillcrest",
      status: "ACTIVE",
      createdAt: daysAgo(60),
    },
  ]

  const meters: Meter[] = [
    { id: "MTR-1001", customerId: "CUST-0042", type: "ELECTRICITY", serialNo: "ELEC-88321", installedAt: daysAgo(200), multiplier: 1, lastReading: 4520.8 },
    { id: "MTR-1002", customerId: "CUST-0042", type: "WATER", serialNo: "WATR-51120", installedAt: daysAgo(200), multiplier: 1, lastReading: 18200 },
    { id: "MTR-1003", customerId: "CUST-0043", type: "ELECTRICITY", serialNo: "ELEC-88355", installedAt: daysAgo(175), multiplier: 1, lastReading: 2210.4 },
    { id: "MTR-1004", customerId: "CUST-0043", type: "GAS", serialNo: "GAS-33012", installedAt: daysAgo(175), multiplier: 1.02, lastReading: 880 },
    { id: "MTR-1005", customerId: "CUST-0044", type: "WATER", serialNo: "WATR-51220", installedAt: daysAgo(90), multiplier: 1, lastReading: 6400 },
    { id: "MTR-1006", customerId: "CUST-0045", type: "ELECTRICITY", serialNo: "ELEC-88999", installedAt: daysAgo(58), multiplier: 1, lastReading: 1330.2 },
    { id: "MTR-1007", customerId: "CUST-0045", type: "GAS", serialNo: "GAS-33199", installedAt: daysAgo(58), multiplier: 1, lastReading: 410 },
  ]

  // Seed a couple of readings per meter to create consumption within the period.
  const readingSeeds: { meterId: string; value: number; day: number }[] = [
    { meterId: "MTR-1001", value: 5240.8, day: 5 }, // 720 kWh
    { meterId: "MTR-1002", value: 21100, day: 6 }, // 2900 gal
    { meterId: "MTR-1003", value: 2810.4, day: 4 }, // 600 kWh
    { meterId: "MTR-1004", value: 1140, day: 4 }, // ~265 therm w/ multiplier
    { meterId: "MTR-1005", value: 8200, day: 8 }, // 1800 gal
    { meterId: "MTR-1006", value: 1780.2, day: 3 }, // 450 kWh
    { meterId: "MTR-1007", value: 540, day: 3 }, // 130 therm
  ]

  const readings: Reading[] = []
  const meterMap = new Map(meters.map((m) => [m.id, m]))
  let readingSeq = 5000
  for (const seed of readingSeeds) {
    const meter = meterMap.get(seed.meterId)
    if (!meter) continue
    const consumption = computeConsumption(seed.value, meter.lastReading, meter.multiplier)
    readings.push({
      id: `RDG-${readingSeq++}`,
      meterId: seed.meterId,
      value: seed.value,
      readAt: daysAgo(seed.day),
      consumption,
    })
    meter.lastReading = seed.value
  }

  // Generate invoices for the two most active customers.
  const invoices: Invoice[] = []
  const payments: Payment[] = []

  const invoiceTargets = ["CUST-0042", "CUST-0043"]
  let invoiceSeq = 9001
  for (const custId of invoiceTargets) {
    const customer = customers.find((c) => c.id === custId)!
    const custMeters = meters.filter((m) => m.customerId === custId)
    const draft = buildInvoice({
      customer,
      meters: custMeters,
      readings,
      periodStart: daysAgo(30),
      periodEnd: new Date().toISOString(),
      dueDate: daysFromNow(custId === "CUST-0042" ? 9 : -3),
    })
    const invoice: Invoice = { ...draft, id: `INV-${invoiceSeq++}` }
    invoices.push(invoice)
  }

  // Record a partial payment against the first invoice.
  if (invoices[0]) {
    const partial = Math.round(invoices[0].amountDue * 0.4 * 100) / 100
    payments.push({
      id: "PAY-7001",
      invoiceId: invoices[0].id,
      amount: partial,
      method: "CARD",
      paymentDate: daysAgo(2),
    })
    invoices[0].amountPaid = partial
    invoices[0].status = "PARTIALLY_PAID"
  }

  return { customers, meters, readings, invoices, payments }
}
