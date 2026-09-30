/**
 * Os planos que esperam as parcelas: aprovados (ou já em andamento) e ainda sem nenhum lançamento. É o que a
 * tela `/financeiro` oferece para "Gerar parcelas".
 */
import type { Lancamento, Paciente, PlanoTratamento, SituacaoPlano } from "@/dominio";

/**
 * As situações em que o plano gera parcelas: o total dele já não muda, porque só o plano proposto muda de itens e
 * de desconto. O proposto ainda não tem o que cobrar; o recusado nunca terá.
 */
export const SITUACOES_QUE_PARCELAM: readonly SituacaoPlano[] = ["aprovado", "em-andamento"];

export type PlanoParaParcelar = { plano: PlanoTratamento; paciente?: Paciente };

/**
 * Os planos que podem gerar parcelas, cada um com o seu paciente: aprovados ou em andamento e sem nenhum
 * lançamento — quem já foi parcelado não volta à lista. Ordem: pelo nome do paciente e, no mesmo paciente, pela
 * ordem em que os planos foram criados. Plano de um paciente que já não existe entra sem `paciente`, em vez de sumir.
 */
export function planosParaParcelar(
  planos: readonly PlanoTratamento[],
  lancamentos: readonly Lancamento[],
  pacientes: readonly Paciente[],
): PlanoParaParcelar[] {
  const parcelados = new Set(lancamentos.map((l) => l.planoId));
  const porId = new Map(pacientes.map((p) => [p.id, p]));
  return planos
    .filter((plano) => SITUACOES_QUE_PARCELAM.includes(plano.situacao) && !parcelados.has(plano.id))
    .map((plano) => ({ plano, paciente: porId.get(plano.pacienteId) }))
    .sort((a, b) => (a.paciente?.nome ?? "").localeCompare(b.paciente?.nome ?? "", "pt-BR"));
}
