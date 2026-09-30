import { useMemo } from "react";

import { cadeiras, clinica, CLINICA_ID, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { DataISO } from "@/dominio";
import { diaISO, GlassCard } from "@/ui";

import CartaoDaConsulta from "./CartaoDaConsulta";
import { diasDaSemana, rotuloDoDia } from "./dias";
import { feriadoDoDia } from "./feriados";
import { diaDaSemana } from "./horarios";

// A semana começa na segunda, como `diasDaSemana`.
const ABREVIADO = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

const achar = <T extends { id: string }>(itens: readonly T[], id?: string) => itens.find((i) => i.id === id);

type Props = {
  /** Qualquer dia da semana que se quer ver. */
  dia: DataISO;
  aoAbrirConsulta: (id: string) => void;
  /** Chamado com o dia, quando se clica no cabeçalho dele. */
  aoAbrirDia: (dia: DataISO) => void;
};

/**
 * A semana da agenda: sete colunas, de segunda a domingo, cada uma com as consultas do dia em ordem de horário
 * (a cancelada libera o horário e sai; a que faltou fica). A coluna é o dia, então o cartão diz a cadeira. O
 * cabeçalho do dia abre esse dia na visão do dia. Em tela larga são sete colunas lado a lado (com no mínimo 8 rem
 * cada uma, e a semana rola de lado se não couber); no celular e no tablet os dias se empilham. `grid-cols-1` na
 * lista: sem ele a trilha automática do grid cresce até o texto sem quebra do cartão e o cartão vaza da coluna.
 *
 * ponytail: não desenha as consultas na escala de horas do dia, só em fila. Duas consultas no mesmo horário em
 * cadeiras diferentes aparecem uma sobre a outra na lista, sem lado a lado.
 */
export default function GradeDaSemana({ dia, aoAbrirConsulta, aoAbrirDia }: Props) {
  const todas = useColecao(consultas);
  const todasAsCadeiras = useColecao(cadeiras);
  const listaDePacientes = useColecao(pacientes);
  const equipe = useColecao(profissionais);
  const catalogo = useColecao(procedimentos);
  const registro = useColecao(clinica).find((c) => c.id === CLINICA_ID);
  const hoje = diaISO(new Date());

  const colunas = useMemo(
    () =>
      diasDaSemana(dia).map((d) => ({
        dia: d,
        feriado: feriadoDoDia(d),
        fechado: (registro?.expediente[diaDaSemana(d)] ?? []).length === 0,
        consultas: todas.filter((c) => c.inicio.startsWith(d) && c.situacao !== "cancelada").sort((a, b) => a.inicio.localeCompare(b.inicio)),
      })),
    [todas, dia, registro],
  );

  const n = colunas.reduce((soma, c) => soma + c.consultas.length, 0);
  const resumo = `${n === 0 ? "Nenhuma consulta" : `${n} ${n === 1 ? "consulta" : "consultas"}`} nesta semana`;

  return (
    <>
      {/* `role="status"`: quem usa leitor de tela ouve o resumo a cada semana que abre. */}
      <p role="status" className="mt-4 px-1 text-sm text-foreground-500">
        {resumo}
      </p>

      <GlassCard className="mt-3 p-3 md:p-4">
        <div className="overflow-x-auto">
          <div className="grid gap-4 lg:min-w-[56rem] lg:grid-cols-7 lg:gap-2">
            {colunas.map((c, i) => (
              <div key={c.dia} className="min-w-0">
                <h3>
                  <button
                    type="button"
                    onClick={() => aoAbrirDia(c.dia)}
                    className={`press flex w-full cursor-pointer flex-col items-center rounded-2xl px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                      c.dia === hoje ? "bg-primary-900 text-primary-50" : "text-foreground-950 hover:bg-primary-900/[0.07]"
                    }`}
                  >
                    <span aria-hidden="true" className="text-[11px] font-semibold uppercase tracking-wide">
                      {ABREVIADO[i]}
                    </span>
                    <span aria-hidden="true" className="text-lg font-bold leading-6">
                      {Number(c.dia.slice(8))}
                    </span>
                    <span className="sr-only">{rotuloDoDia(c.dia)}</span>
                  </button>
                </h3>
                {c.feriado && (
                  <p className="mt-1 text-center text-[11px] leading-4 text-foreground-600">
                    {`${c.feriado.tipo === "feriado" ? "Feriado" : "Ponto facultativo"}: ${c.feriado.nome}`}
                  </p>
                )}
                {c.consultas.length > 0 ? (
                  <ul aria-label={`Consultas de ${rotuloDoDia(c.dia)}`} className="mt-2 grid grid-cols-1 gap-2">
                    {c.consultas.map((x) => (
                      <li key={x.id}>
                        <CartaoDaConsulta
                          consulta={x}
                          paciente={achar(listaDePacientes, x.pacienteId)}
                          profissional={achar(equipe, x.profissionalId)}
                          procedimento={achar(catalogo, x.procedimentoId)}
                          cadeira={achar(todasAsCadeiras, x.cadeiraId)?.nome ?? "Cadeira removida"}
                          aoAbrir={() => aoAbrirConsulta(x.id)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-center text-xs text-foreground-500">{c.fechado ? "Fechado" : "Sem consultas"}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </>
  );
}
