/**
 * Os indicadores do mês no painel: o que entrou, quantas consultas e quantas faltas. Regra pura: o mês vem de fora
 * (`mesDe(hoje)`, com o `hoje` de `diaISO`), para o teste escolher qual. `toISOString()` fica de fora: à noite, no
 * Brasil, ele já devolve o dia seguinte e, no último dia do mês, o mês seguinte.
 */
import { somarCentavos, type Centavos, type Consulta, type Lancamento } from "@/dominio";

/** Um mês do calendário, `AAAA-MM` (ex.: `2026-09`). */
export type MesISO = string;

/** O mês de um dia (`AAAA-MM-DD`) ou de um horário (`AAAA-MM-DDTHH:mm`): os sete primeiros caracteres. */
export const mesDe = (data: string): MesISO => data.slice(0, 7);

/**
 * O faturamento recebido em `mes`: a soma das parcelas com `pagoEm` dentro dele, seja qual for o vencimento — a paga
 * em atraso conta no mês em que o dinheiro entrou. A parcela em aberto não entra, nem a paga em outro mês.
 */
export function faturamentoRecebido(lancamentos: readonly Lancamento[], mes: MesISO): Centavos {
  return somarCentavos(...lancamentos.filter((l) => l.pagoEm !== undefined && mesDe(l.pagoEm) === mes).map((l) => l.valor));
}

/** As consultas de `mes`, sem as canceladas: a cancelada libera o horário e não conta, como na grade da agenda. */
export function consultasDoMes(consultas: readonly Consulta[], mes: MesISO): number {
  return consultas.filter((c) => mesDe(c.inicio) === mes && c.situacao !== "cancelada").length;
}

/**
 * A taxa de faltas de `mes`, de 0 a 1: faltou ÷ (concluída + faltou). Só conta a consulta que já terminou de um dos
 * dois jeitos; a que ainda vai acontecer, a que está em atendimento e a cancelada ficam de fora. Sem nenhuma das duas
 * não há base e a taxa é `null`: nenhuma falta em nenhuma consulta não é 0%.
 */
export function taxaDeFaltas(consultas: readonly Consulta[], mes: MesISO): number | null {
  const doMes = consultas.filter((c) => mesDe(c.inicio) === mes);
  const faltou = doMes.filter((c) => c.situacao === "faltou").length;
  const base = faltou + doMes.filter((c) => c.situacao === "concluida").length;
  return base === 0 ? null : faltou / base;
}
