/**
 * A lista de retornos: os pacientes que já deviam ter voltado (`vencido`) e os que devem voltar nos próximos 30 dias
 * (`a-vencer`), a partir de `retornoDoPaciente`. Regra pura: o dia de hoje vem de fora (`diaISO(new Date())`, na tela).
 *
 * Só entra quem já foi atendido e ainda consta no cadastro: sem atendimento não há retorno, e sem paciente não há a
 * quem chamar. O retorno que cai hoje ainda não venceu: é `a-vencer`, com `0` dia.
 *
 * ponytail: o paciente que já tem consulta marcada continua na lista até ser atendido, porque a regra olha só o que já
 * foi feito. Se incomodar, é tirar de `retornosPendentes` quem tem consulta agendada ou confirmada daqui em diante
 * (`consultasAPartirDe`, do atendimento), ou deixar o adiar e o dispensar resolverem.
 */
import type { Consulta, DataISO, Paciente, PlanoTratamento } from "@/dominio";

import { retornoDoPaciente, type Retorno } from "./regra";

/** Até quantos dias à frente o retorno entra na lista como a vencer. */
export const JANELA_A_VENCER_DIAS = 30;

export type SituacaoDoRetorno = "vencido" | "a-vencer";

export type RetornoPendente = Retorno & {
  paciente: Paciente;
  situacao: SituacaoDoRetorno;
  /** Vencido: há quantos dias. A vencer: daqui a quantos (`0` é hoje). */
  dias: number;
};

/** O número do dia no calendário, contado em UTC: a diferença entre dois dá os dias exatos, sem fuso nem horário de verão. */
const numeroDoDia = (dia: DataISO) => Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10))) / 86_400_000;

/**
 * Os retornos vencidos e os dos próximos `JANELA_A_VENCER_DIAS` dias (o último incluído), do prazo mais antigo ao mais
 * próximo: o vencido há mais tempo vem primeiro. No empate, o nome. `intervalos` é o mapa de prazos por procedimento; sem ele,
 * vale o da clínica (`INTERVALOS_POR_PROCEDIMENTO`).
 */
export function retornosPendentes(
  pacientes: readonly Paciente[],
  consultas: readonly Consulta[],
  planos: readonly PlanoTratamento[],
  hoje: DataISO,
  intervalos?: Readonly<Record<string, number>>,
): RetornoPendente[] {
  return pacientes
    .flatMap((paciente): RetornoPendente[] => {
      const retorno = retornoDoPaciente(paciente.id, consultas, planos, intervalos);
      if (!retorno) return [];
      const ate = numeroDoDia(retorno.retornoEm) - numeroDoDia(hoje); // negativo: já venceu
      if (ate > JANELA_A_VENCER_DIAS) return [];
      return [{ ...retorno, paciente, situacao: ate < 0 ? "vencido" : "a-vencer", dias: Math.abs(ate) }];
    })
    .sort((a, b) => a.retornoEm.localeCompare(b.retornoEm) || a.paciente.nome.localeCompare(b.paciente.nome, "pt-BR"));
}
