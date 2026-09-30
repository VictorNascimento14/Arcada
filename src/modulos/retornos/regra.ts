/**
 * A regra do retorno (glossário do cofre: Retorno): quando o paciente deve voltar. A conta parte do último
 * atendimento dele e soma o intervalo, em meses, do procedimento que ele fez.
 *
 * O último atendimento é o dia mais recente entre a consulta `concluida` e o item de plano com `realizadoEm`.
 * Consulta que faltou, foi cancelada ou ainda não terminou não é atendimento, e item ainda a fazer também não.
 *
 * Regra pura: as coleções vêm de fora e as datas são `AAAA-MM-DD`, somadas por número e texto, sem `Date` local —
 * `new Date("2026-01-31")` lê UTC e, no fuso do Brasil, recua um dia.
 */
import type { Consulta, DataISO, PlanoTratamento } from "@/dominio";

/** O intervalo, em meses, do procedimento que não tem regra própria. */
export const INTERVALO_PADRAO_MESES = 6;

/**
 * O prazo de retorno por procedimento: o `id` do catálogo → meses até o paciente voltar. É onde a clínica ajusta
 * o prazo; o que não consta aqui usa `INTERVALO_PADRAO_MESES`.
 *
 * ponytail: é uma constante do módulo, sem tela. Editar por tela é guardar este mapa numa coleção do módulo e
 * passá-lo como o argumento `intervalos` das funções abaixo, que já o aceitam.
 */
export const INTERVALOS_POR_PROCEDIMENTO: Readonly<Record<string, number>> = {
  "proc-manutencao-aparelho": 1, // o próprio nome no catálogo diz: manutenção mensal
};

/** Os meses de retorno do procedimento; sem `procedimentoId` (consulta sem procedimento) ou sem regra, o padrão. */
export const intervaloDoProcedimento = (
  procedimentoId: string | undefined,
  intervalos: Readonly<Record<string, number>> = INTERVALOS_POR_PROCEDIMENTO,
): number => (procedimentoId ? intervalos[procedimentoId] : undefined) ?? INTERVALO_PADRAO_MESES;

/**
 * O dia `meses` depois de `dia`. Onde o mês de chegada é mais curto, cai no último dia dele: 31/08 mais 6 meses é
 * 28/02 (29/02 em ano bissexto), nunca 03/03.
 */
export function somarMeses(dia: DataISO, meses: number): DataISO {
  const [ano, mes, dd] = dia.split("-").map(Number);
  const indice = ano * 12 + (mes - 1) + meses;
  const [anoFinal, mesFinal] = [Math.floor(indice / 12), (indice % 12) + 1];
  const ultimoDia = new Date(Date.UTC(anoFinal, mesFinal, 0)).getUTCDate(); // dia 0 do mês seguinte é o último deste
  return `${anoFinal}-${String(mesFinal).padStart(2, "0")}-${String(Math.min(dd, ultimoDia)).padStart(2, "0")}`;
}

export type Atendimento = {
  dia: DataISO;
  /** Os procedimentos conhecidos feitos nesse dia. Vazia quando o dia só tem consulta sem procedimento. */
  procedimentoIds: string[];
};

/** O último atendimento do paciente, ou `null` se ele ainda não foi atendido. */
export function ultimoAtendimento(
  pacienteId: string,
  consultas: readonly Consulta[],
  planos: readonly PlanoTratamento[],
): Atendimento | null {
  const feitos: { dia: DataISO; procedimentoId?: string }[] = [
    ...consultas
      .filter((c) => c.pacienteId === pacienteId && c.situacao === "concluida")
      .map((c) => ({ dia: c.inicio.slice(0, 10), procedimentoId: c.procedimentoId })),
    ...planos
      .filter((p) => p.pacienteId === pacienteId)
      .flatMap((p) => p.itens.flatMap((i) => (i.realizadoEm ? [{ dia: i.realizadoEm, procedimentoId: i.procedimentoId }] : []))),
  ];
  if (feitos.length === 0) return null;
  const dia = feitos.reduce((maior, f) => (f.dia > maior ? f.dia : maior), feitos[0].dia);
  return { dia, procedimentoIds: feitos.flatMap((f) => (f.dia === dia && f.procedimentoId ? [f.procedimentoId] : [])) };
}

export type Retorno = {
  pacienteId: string;
  /** O dia de onde a conta parte. */
  ultimoAtendimento: DataISO;
  /** O intervalo aplicado, em meses. */
  intervaloMeses: number;
  /** O dia em que o paciente deve voltar. */
  retornoEm: DataISO;
};

/**
 * Quando o paciente deve voltar: o último atendimento mais o intervalo do procedimento feito nele. `null` se ele
 * ainda não foi atendido, porque sem atendimento não há de onde contar.
 *
 * ponytail: no dia com mais de um procedimento vale o menor intervalo, o do retorno mais cedo. Se a clínica
 * quiser outra regra (o do procedimento principal), é trocar o `Math.min`.
 */
export function retornoDoPaciente(
  pacienteId: string,
  consultas: readonly Consulta[],
  planos: readonly PlanoTratamento[],
  intervalos: Readonly<Record<string, number>> = INTERVALOS_POR_PROCEDIMENTO,
): Retorno | null {
  const ultimo = ultimoAtendimento(pacienteId, consultas, planos);
  if (!ultimo) return null;
  const meses = ultimo.procedimentoIds.map((id) => intervaloDoProcedimento(id, intervalos));
  const intervaloMeses = meses.length > 0 ? Math.min(...meses) : INTERVALO_PADRAO_MESES;
  return { pacienteId, ultimoAtendimento: ultimo.dia, intervaloMeses, retornoEm: somarMeses(ultimo.dia, intervaloMeses) };
}
