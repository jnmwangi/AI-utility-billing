import { AppShell, PageHeader } from "@/components/app-shell"
import { TariffsView } from "@/components/tariffs-view"

export default function TariffsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Tariffs"
        description="Reference for the tiered rate engine applied during invoice generation."
      />
      <TariffsView />
    </AppShell>
  )
}
