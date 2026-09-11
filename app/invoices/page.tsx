import { AppShell, PageHeader } from "@/components/app-shell"
import { InvoicesView } from "@/components/invoices-view"

export default function InvoicesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Invoices & Payments"
        description="Generate invoices from the tiered tariff engine, apply late fees, and record payments."
      />
      <InvoicesView />
    </AppShell>
  )
}
