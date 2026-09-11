import { AppShell, PageHeader } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  return (
    <AppShell>
      <PageHeader title="Dashboard" description="Operational overview of accounts, consumption, and billing." />
      <Dashboard />
    </AppShell>
  )
}
