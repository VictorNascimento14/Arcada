import { useMemo } from "react";
import { Link } from "react-router-dom";

import { consultas, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { rotuloDoDia } from "@/modulos/agenda/dias";
import { podeTransitar, ROTULO_DA_SITUACAO } from "@/modulos/agenda/situacao";
import { diaISO, GlassCard } from "@/ui";

import BotaoIniciarAtendimento from "./BotaoIniciarAtendimento";
import { consultasAPartirDe, faixaDeHoras } from "./consultas";

// O link com a cara do `Button` secundário: navegar é `<a>`, e o kit não tem botão-link.
const BOTAO_LINK =
  "press inline-flex items-center justify-center gap-2 rounded-full bg-secondary-100 px-5 py-3 text-sm font-semibold whitespace-nowrap text-secondary-800 transition-colors hover:bg-secondary-200";

/**
 * A aba "Atendimentos" da ficha do paciente: as consultas dele de hoje em diante. A agendada e a confirmada
 * oferecem "Iniciar atendimento"; a que já está em atendimento leva de volta à tela dele.
 */
export default function AbaAtendimentos({ pacienteId }: { pacienteId: string }) {
  const todas = useColecao(consultas);
  const catalogo = useColecao(procedimentos);
  const equipe = useColecao(profissionais);
  const hoje = diaISO(new Date());
  const proximas = useMemo(() => consultasAPartirDe(todas, pacienteId, hoje), [todas, pacienteId, hoje]);

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Atendimentos</h2>
      <p className="mt-1 text-foreground-500">As consultas deste paciente de hoje em diante. Inicie o atendimento quando ele chegar.</p>

      {proximas.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhuma consulta de hoje em diante.</p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {proximas.map((c) => {
            const dia = rotuloDoDia(c.inicio.slice(0, 10));
            const procedimento = catalogo.find((p) => p.id === c.procedimentoId)?.nome ?? "Sem procedimento definido";
            const profissional = equipe.find((p) => p.id === c.profissionalId)?.nome ?? "Profissional removido";
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground-950">{dia}</p>
                  <p className="text-sm text-foreground-500">{`${faixaDeHoras(c)} · ${procedimento} · ${profissional}`}</p>
                </div>
                <span className="text-sm font-medium text-foreground-600">{ROTULO_DA_SITUACAO[c.situacao]}</span>
                {podeTransitar(c.situacao, "em-atendimento") && <BotaoIniciarAtendimento consultaId={c.id} contexto={`${dia}, ${c.inicio.slice(11)}`} />}
                {c.situacao === "em-atendimento" && (
                  <Link to={`/atendimento/${c.id}`} className={BOTAO_LINK}>
                    Abrir atendimento
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
