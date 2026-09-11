export type UtilityType = "ELECTRICITY" | "WATER" | "GAS"

export type CustomerStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED"

export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID"

export type PaymentMethod = "CARD" | "BANK_TRANSFER" | "CASH" | "CHECK"

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: CustomerStatus
  createdAt: string
}

export interface Meter {
  id: string
  customerId: string
  type: UtilityType
  serialNo: string
  installedAt: string
  multiplier: number
  lastReading: number
}

export interface Reading {
  id: string
  meterId: string
  value: number
  readAt: string
  /** Metered consumption for this reading: (value - previous) * multiplier */
  consumption: number
  /** Private Blob pathname for the meter photo captured by the reader. */
  photoPath?: string
}

export interface InvoiceLine {
  meterId: string
  serialNo: string
  type: UtilityType
  consumption: number
  unit: string
  baseFee: number
  usageCharge: number
  surcharge: number
}

export interface Invoice {
  id: string
  customerId: string
  customerName: string
  periodStart: string
  periodEnd: string
  lines: InvoiceLine[]
  subtotal: number
  tax: number
  lateFee: number
  amountDue: number
  amountPaid: number
  status: InvoiceStatus
  dueDate: string
  createdAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  paymentDate: string
}
