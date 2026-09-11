import { AppShell, PageHeader } from "@/components/app-shell"
import { CustomersView } from "@/components/customers-view"

export default function CustomersPage() {
  return (
    <AppShell>
      <PageHeader
        title="Customers & Meters"
        description="Manage customer accounts and the electricity, water, and gas meters linked to them."
      />
      <CustomersView />
    </AppShell>
  )
}
