import { GlassCard, StatCard } from "@/ui";

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 p-6">
      <GlassCard className="p-[26px]">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground-950">Arcada</h1>
        <p className="mt-2 text-foreground-500">Gestão de consultório odontológico.</p>
      </GlassCard>
      <StatCard label="Consultas hoje" icon="calendar" value={0} />
    </main>
  );
}
