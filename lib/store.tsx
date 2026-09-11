"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { Customer, Invoice, Meter, Payment, Reading, UtilityType } from "./types"
import { buildInvoice, computeConsumption, computeLateFee, isOverdue, round2, totalPaid } from "./billing"
import { createSeedData } from "./seed"

interface NewCustomer {
  name: string
  email: string
  phone: string
  address: string
  status: Customer["status"]
}

interface NewMeter {
  customerId: string
  type: UtilityType
  serialNo: string
  multiplier: number
  lastReading: number
}

interface GenerateInvoiceInput {
  customerId: string
  periodStart: string
  periodEnd: string
  dueDate: string
}

interface StoreValue {
  customers: Customer[]
  meters: Meter[]
  readings: Reading[]
  invoices: Invoice[]
  payments: Payment[]
  addCustomer: (c: NewCustomer) => Customer
  updateCustomer: (id: string, c: Partial<NewCustomer>) => void
  deleteCustomer: (id: string) => void
  addMeter: (m: NewMeter) => Meter
  deleteMeter: (id: string) => void
  addReading: (meterId: string, value: number, readAt: string, photoPath?: string) => { ok: boolean; error?: string }
  generateInvoice: (input: GenerateInvoiceInput) => { ok: boolean; error?: string; invoice?: Invoice }
  recordPayment: (invoiceId: string, amount: number, method: Payment["method"], date: string) => { ok: boolean; error?: string }
  applyLateFee: (invoiceId: string) => { ok: boolean; error?: string; fee?: number }
}

const StoreContext = createContext<StoreValue | null>(null)

function padId(prefix: string, n: number, width = 4): string {
  return `${prefix}-${String(n).padStart(width, "0")}`
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const seed = useRef(createSeedData())
  const [customers, setCustomers] = useState<Customer[]>(seed.current.customers)
  const [meters, setMeters] = useState<Meter[]>(seed.current.meters)
  const [readings, setReadings] = useState<Reading[]>(seed.current.readings)
  const [invoices, setInvoices] = useState<Invoice[]>(seed.current.invoices)
  const [payments, setPayments] = useState<Payment[]>(seed.current.payments)

  const counters = useRef({ cust: 46, meter: 1008, reading: 6000, invoice: 9100, payment: 7100 })

  const addCustomer = useCallback((c: NewCustomer) => {
    const customer: Customer = {
      id: padId("CUST", counters.current.cust++),
      createdAt: new Date().toISOString(),
      ...c,
    }
    setCustomers((prev) => [customer, ...prev])
    return customer
  }, [])

  const updateCustomer = useCallback((id: string, patch: Partial<NewCustomer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const deleteCustomer = useCallback((id: string) => {
    // Soft delete per REQ-CUST-1: mark terminated rather than removing records.
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, status: "TERMINATED" } : c)))
  }, [])

  const addMeter = useCallback((m: NewMeter) => {
    const meter: Meter = { id: padId("MTR", counters.current.meter++), installedAt: new Date().toISOString(), ...m }
    setMeters((prev) => [meter, ...prev])
    return meter
  }, [])

  const deleteMeter = useCallback((id: string) => {
    setMeters((prev) => prev.filter((m) => m.id !== id))
    setReadings((prev) => prev.filter((r) => r.meterId !== id))
  }, [])

  const addReading = useCallback((meterId: string, value: number, readAt: string, photoPath?: string) => {
    const meter = meters.find((m) => m.id === meterId)
    if (!meter) return { ok: false, error: "Meter not found." }
    if (value < meter.lastReading) {
      return { ok: false, error: `Reading ${value} is below the last reading ${meter.lastReading}. Negative consumption is not allowed.` }
    }
    const consumption = computeConsumption(value, meter.lastReading, meter.multiplier)
    const reading: Reading = {
      id: padId("RDG", counters.current.reading++),
      meterId,
      value,
      readAt,
      consumption,
      photoPath,
    }
    setReadings((prev) => [reading, ...prev])
    setMeters((prev) => prev.map((m) => (m.id === meterId ? { ...m, lastReading: value } : m)))
    return { ok: true }
  }, [meters])

  const generateInvoice = useCallback(
    (input: GenerateInvoiceInput) => {
      const customer = customers.find((c) => c.id === input.customerId)
      if (!customer) return { ok: false, error: "Customer not found." }
      const custMeters = meters.filter((m) => m.customerId === input.customerId)
      if (custMeters.length === 0) return { ok: false, error: "Customer has no meters to bill." }
      const draft = buildInvoice({
        customer,
        meters: custMeters,
        readings,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        dueDate: input.dueDate,
      })
      const invoice: Invoice = { ...draft, id: padId("INV", counters.current.invoice++) }
      setInvoices((prev) => [invoice, ...prev])
      return { ok: true, invoice }
    },
    [customers, meters, readings],
  )

  const recordPayment = useCallback(
    (invoiceId: string, amount: number, method: Payment["method"], date: string) => {
      const invoice = invoices.find((i) => i.id === invoiceId)
      if (!invoice) return { ok: false, error: "Invoice not found." }
      if (amount <= 0) return { ok: false, error: "Payment amount must be positive." }
      const alreadyPaid = totalPaid(payments, invoiceId)
      const outstanding = round2(invoice.amountDue + invoice.lateFee - alreadyPaid)
      if (amount > outstanding + 0.001) {
        return { ok: false, error: `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.` }
      }
      const payment: Payment = {
        id: padId("PAY", counters.current.payment++),
        invoiceId,
        amount: round2(amount),
        method,
        paymentDate: date,
      }
      const newPaid = round2(alreadyPaid + amount)
      const status: Invoice["status"] = newPaid >= round2(invoice.amountDue + invoice.lateFee) ? "PAID" : "PARTIALLY_PAID"
      setPayments((prev) => [payment, ...prev])
      setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, amountPaid: newPaid, status } : i)))
      return { ok: true }
    },
    [invoices, payments],
  )

  const applyLateFee = useCallback(
    (invoiceId: string) => {
      const invoice = invoices.find((i) => i.id === invoiceId)
      if (!invoice) return { ok: false, error: "Invoice not found." }
      if (!isOverdue(invoice)) return { ok: false, error: "Invoice is not overdue." }
      const alreadyPaid = totalPaid(payments, invoiceId)
      const outstanding = round2(invoice.amountDue - alreadyPaid)
      const fee = computeLateFee(outstanding)
      setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, lateFee: fee } : i)))
      return { ok: true, fee }
    },
    [invoices, payments],
  )

  const value = useMemo<StoreValue>(
    () => ({
      customers,
      meters,
      readings,
      invoices,
      payments,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addMeter,
      deleteMeter,
      addReading,
      generateInvoice,
      recordPayment,
      applyLateFee,
    }),
    [customers, meters, readings, invoices, payments, addCustomer, updateCustomer, deleteCustomer, addMeter, deleteMeter, addReading, generateInvoice, recordPayment, applyLateFee],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
