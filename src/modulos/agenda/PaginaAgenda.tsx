import { useState } from "react";

import { Button, diaISO, GlassCard, PageShell } from "@/ui";

import { rotuloDoDia, somarDias } from "./dias";
import { feriadoDoDia } from "./feriados";
import GradeDoDia from "./GradeDoDia";
import MarcarConsulta from "./MarcarConsulta";

// A mesma pílula dos botões de mês do `Calendar` do kit.
const NAVEGAR =
  "glass-pill press flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-foreground-700 transition-colors hover:text-primary-800";

/** A tela `/agenda`: o dia escolhido por cadeira, com a navegação de dia em dia. Abre no dia de hoje. */
export default function PaginaAgenda() {
  const [dia, setDia] = useState(() => diaISO(new Date()));
  const [marcando, setMarcando] = useState(false);
  const hoje = diaISO(new Date());
  const feriado = feriadoDoDia(dia);

  return (
    <PageShell titulo="Agenda" detalhe="Visão do dia">
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Dia anterior" className={NAVEGAR} onClick={() => setDia(somarDias(dia, -1))}>
            <i className="ri-arrow-left-s-line" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Próximo dia" className={NAVEGAR} onClick={() => setDia(somarDias(dia, 1))}>
            <i className="ri-arrow-right-s-line" aria-hidden="true" />
          </button>
          <Button variant="secondary" disabled={dia === hoje} onClick={() => setDia(hoje)}>
            Hoje
          </Button>
          {/* `first-letter:uppercase`, não `capitalize`: este faria "Quarta-Feira, 30 De Setembro". */}
          <h2 className="ml-1 min-w-0 flex-1 text-[17px] font-bold tracking-[-0.01em] text-foreground-950 first-letter:uppercase">
            {rotuloDoDia(dia)}
          </h2>
          <Button onClick={() => setMarcando(true)}>
            <i className="ri-add-line text-base" aria-hidden="true" />
            Marcar consulta
          </Button>
        </div>

        {feriado && (
          <GlassCard className="mt-3 flex items-center gap-3 p-4">
            <i className="ri-flag-line text-lg text-foreground-600" aria-hidden="true" />
            <p role="note" className="text-sm text-foreground-700">
              {`${feriado.tipo === "feriado" ? "Feriado" : "Ponto facultativo"}: ${feriado.nome}.`}
            </p>
          </GlassCard>
        )}

        <GradeDoDia dia={dia} />

        {/* Ao marcar, a agenda abre no dia da consulta nova. */}
        {marcando && (
          <MarcarConsulta diaInicial={dia} aoFechar={() => setMarcando(false)} aoMarcar={(c) => setDia(c.inicio.slice(0, 10))} />
        )}
      </main>
    </PageShell>
  );
}
