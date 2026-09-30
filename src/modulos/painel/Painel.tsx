import { GlassCard, PageShell } from "@/ui";

export default function Painel() {
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <PageShell titulo="Painel" detalhe={hoje}>
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="p-[26px]">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Bem-vinda ao Arcada</h2>
          <p className="mt-2 text-foreground-500">
            Pacientes, agenda, odontograma e financeiro do consultório num lugar só.
          </p>
        </GlassCard>
      </main>
    </PageShell>
  );
}
