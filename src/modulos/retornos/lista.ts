/**
 * A lista de retornos: os pacientes que já deviam ter voltado (`vencido`) e os que devem voltar nos próximos 30 dias
 * (`a-vencer`), a partir de `retornoDoPaciente`, e à parte os que a clínica dispensou. Regra pura: o dia de hoje vem de
 * fora (`diaISO(new Date())`, na tela) e o estado de adiar e dispensar, da coleção de `dados.ts`.
 *
 * Só entra quem já foi atendido e ainda consta no cadastro: sem atendimento não há retorno, e sem paciente não há a
 * quem chamar. O retorno que cai hoje ainda não venceu: é `a-vencer`, com `0` dia. O adiado vale o dia novo, e o
 * dispensado sai dos dois grupos.
 *
 * ponytail: o paciente que já tem consulta marcada continua na lista até ser atendido, porque a regra olha só o que já
 * foi feito. Se incomodar, é tirar de `retornosPendentes` quem tem consulta agendada ou confirmada daqui em diante
 * (`consultasAPartirDe`, do atendimento), ou deixar o adiar e o dispensar resolverem.
 * ponytail: o retorno adiado para além da janela de 30 dias some da lista até entrar nela; não há cartão de adiados. Se
 * a recepção sentir falta, é um cartão como o dos dispensados.
 */
import type { Consulta, DataISO, Paciente, PlanoTratamento } from "@/dominio";

import { dataDoRetorno, estadoVigente, type EstadoDoRetorno } from "./estado";
import { retornoDoPaciente, type Retorno } from "./regra";

/** Até quantos dias à frente o retorno entra na lista como a vencer. */
export const JANELA_A_VENCER_DIAS = 30;

export type SituacaoDoRetorno = "vencido" | "a-vencer";

export type RetornoPendente = Retorno & {
  paciente: Paciente;
  situacao: SituacaoDoRetorno;
  /** Vencido: há quantos dias. A vencer: daqui a quantos (`0` é hoje). */
  dias: number;
  /** O retorno foi adiado: `retornoEm` é o dia adiado, e não o da regra. */
  adiado: boolean;
};

export type RetornoDispensado = { paciente: Paciente; dispensadoEm: DataISO; motivo: string };

/** O número do dia no calendário, contado em UTC: a diferença entre dois dá os dias exatos, sem fuso nem horário de verão. */
const numeroDoDia = (dia: DataISO) => Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10))) / 86_400_000;

/** O retorno de cada paciente já atendido, com o estado que ainda vale para ele. */
function retornosDosPacientes(
  pacientes: readonly Paciente[],
  consultas: readonly Consulta[],
  planos: readonly PlanoTratamento[],
  estados: readonly EstadoDoRetorno[],
) {
  const porPaciente = new Map(estados.map((e) => [e.id, e]));
  return pacientes.flatMap((paciente) => {
    const retorno = retornoDoPaciente(paciente.id, consultas, planos);
    return retorno ? [{ paciente, retorno, estado: estadoVigente(porPaciente.get(paciente.id), retorno) }] : [];
  });
}

/**
 * Os retornos vencidos e os dos próximos `JANELA_A_VENCER_DIAS` dias (o último incluído), do prazo mais antigo ao mais
 * próximo: o vencido há mais tempo vem primeiro. No empate, o nome. Fora ficam os dispensados; o adiado entra com o dia
 * novo.
 */
export function retornosPendentes(
  pacientes: readonly Paciente[],
  consultas: readonly Consulta[],
  planos: readonly PlanoTratamento[],
  hoje: DataISO,
  estados: readonly EstadoDoRetorno[] = [],
): RetornoPendente[] {
  return retornosDosPacientes(pacientes, consultas, planos, estados)
    .flatMap(({ paciente, retorno, estado }): RetornoPendente[] => {
      if (estado?.dispensadoEm) return [];
      const retornoEm = dataDoRetorno(retorno, estado);
      const ate = numeroDoDia(retornoEm) - numeroDoDia(hoje); // negativo: já venceu
      if (ate > JANELA_A_VENCER_DIAS) return [];
      const adiado = retornoEm !== retorno.retornoEm;
      return [{ ...retorno, retornoEm, paciente, situacao: ate < 0 ? "vencido" : "a-vencer", dias: Math.abs(ate), adiado }];
    })
    .sort((a, b) => a.retornoEm.localeCompare(b.retornoEm) || a.paciente.nome.localeCompare(b.paciente.nome, "pt-BR"));
}

/** Os retornos dispensados com o motivo, do mais recente ao mais antigo; no empate, o nome. Só a dispensa do retorno em curso. */
export function retornosDispensados(
  pacientes: readonly Paciente[],
  consultas: readonly Consulta[],
  planos: readonly PlanoTratamento[],
  estados: readonly EstadoDoRetorno[],
): RetornoDispensado[] {
  return retornosDosPacientes(pacientes, consultas, planos, estados)
    .flatMap(({ paciente, estado }): RetornoDispensado[] =>
      estado?.dispensadoEm ? [{ paciente, dispensadoEm: estado.dispensadoEm, motivo: estado.motivo ?? "" }] : [],
    )
    .sort((a, b) => b.dispensadoEm.localeCompare(a.dispensadoEm) || a.paciente.nome.localeCompare(b.paciente.nome, "pt-BR"));
}
