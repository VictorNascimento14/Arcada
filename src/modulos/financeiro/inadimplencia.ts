/**
 * A inadimplência: o que cada paciente tem vencido e sem baixa — a parcela cujo vencimento passou sem baixa
 * (glossário do cofre). Regra pura: o dia de hoje vem de fora (`diaISO(new Date())`, na tela).
 */
import { somarCentavos, type Centavos, type DataISO, type Lancamento, type Paciente } from "@/dominio";

import { situacaoDaParcela } from "./situacao";

/**
 * O número do dia no calendário (dias desde 1970-01-01), contado em UTC: as datas são `AAAA-MM-DD`, sem horário, e a
 * diferença entre dois números de dia dá os dias de calendário exatos, sem o fuso nem o horário de verão mexerem na
 * conta. `Date.UTC` recebe números; `new Date("2026-01-31")` leria UTC e, no Brasil, recuaria um dia.
 */
const numeroDoDia = (dia: DataISO) => Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10))) / 86_400_000;

/** Há quantos dias a parcela está vencida em `hoje`; `0` para a que não está: paga, que vence hoje ou a vencer. */
export function diasDeAtrasoDaParcela(parcela: Pick<Lancamento, "vencimento" | "pagoEm">, hoje: DataISO): number {
  return situacaoDaParcela(parcela, hoje) === "vencida" ? numeroDoDia(hoje) - numeroDoDia(parcela.vencimento) : 0;
}

export type Inadimplente = {
  pacienteId: string;
  paciente?: Paciente;
  /** Quantas parcelas vencidas e sem baixa ele tem. */
  parcelas: number;
  /** A soma delas, em centavos. */
  totalVencido: Centavos;
  /** Os dias de atraso da parcela vencida mais antiga: há quanto tempo ele deve. */
  diasDeAtraso: number;
};

/**
 * Os pacientes com parcela vencida em `hoje`, cada um com quantas tem, a soma delas e os dias de atraso da mais
 * antiga. Só conta a parcela em aberto com o vencimento antes de hoje: a que vence hoje ainda
 * não é atraso, e a paga saiu da conta. Do atraso mais antigo ao mais recente; no empate, o maior total vencido e, por
 * fim, o nome. Parcela de um paciente que já não existe entra sem `paciente`, em vez de sumir.
 */
export function inadimplentes(lancamentos: readonly Lancamento[], pacientes: readonly Paciente[], hoje: DataISO): Inadimplente[] {
  const vencidasPorPaciente = new Map<string, Lancamento[]>();
  for (const l of lancamentos) {
    if (situacaoDaParcela(l, hoje) === "vencida") vencidasPorPaciente.set(l.pacienteId, [...(vencidasPorPaciente.get(l.pacienteId) ?? []), l]);
  }
  const porId = new Map(pacientes.map((p) => [p.id, p]));
  return [...vencidasPorPaciente]
    .map(([pacienteId, vencidas]) => ({
      pacienteId,
      paciente: porId.get(pacienteId),
      parcelas: vencidas.length,
      totalVencido: somarCentavos(...vencidas.map((l) => l.valor)),
      diasDeAtraso: Math.max(...vencidas.map((l) => diasDeAtrasoDaParcela(l, hoje))),
    }))
    .sort(
      (a, b) =>
        b.diasDeAtraso - a.diasDeAtraso ||
        b.totalVencido - a.totalVencido ||
        (a.paciente?.nome ?? "").localeCompare(b.paciente?.nome ?? "", "pt-BR"),
    );
}
