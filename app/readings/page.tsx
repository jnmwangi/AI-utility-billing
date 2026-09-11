import { AppShell, PageHeader } from "@/components/app-shell"
import { ReadingsView } from "@/components/readings-view"

export default function ReadingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Readings"
        description="Ingest meter readings. Consumption is derived from the delta over the previous reading and the meter multiplier."
      />
      <ReadingsView />
    </AppShell>
  )
}
