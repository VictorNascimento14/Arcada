/**
 * A situação de uma parcela num dia: paga, vencida, vence hoje ou a vencer. É regra pura: o dia de hoje vem de
 * fora (`diaISO(new Date())`, na tela), para o teste escolher o dia — e nunca `toISOString()`, que à noite, no
 * Brasil, já devolve o dia seguinte.
 */
import type { DataISO, Lancamento } from "@/dominio";

export type SituacaoDaParcela = "a-vencer" | "vence-hoje" | "vencida" | "paga";

export const ROTULO_SITUACAO_DA_PARCELA: Record<SituacaoDaParcela, string> = {
  "a-vencer": "A vencer",
  "vence-hoje": "Vence hoje",
  vencida: "Vencida",
  paga: "Paga",
};

/**
 * Quem tem `pagoEm` está `paga`, seja qual for o vencimento: paga adiantada, no dia ou depois de vencida. As outras
 * comparam o vencimento com `hoje`; as datas são `AAAA-MM-DD`, então comparar os textos compara os dias. Vencer hoje
 * ainda não é atraso: a parcela só vira `vencida` no dia seguinte.
 */
export function situacaoDaParcela(parcela: Pick<Lancamento, "vencimento" | "pagoEm">, hoje: DataISO): SituacaoDaParcela {
  if (parcela.pagoEm !== undefined) return "paga";
  if (parcela.vencimento < hoje) return "vencida";
  return parcela.vencimento === hoje ? "vence-hoje" : "a-vencer";
}
