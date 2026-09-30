/**
 * Os planos em aberto: os que ainda não terminaram nem foram recusados. É o que a lista `/tratamentos` mostra.
 */
import type { Paciente, PlanoTratamento, SituacaoPlano } from "@/dominio";

/**
 * Propostos (esperam a decisão do paciente), aprovados (esperam o primeiro procedimento) e em andamento: as
 * situações que ainda têm um próximo passo. Só `concluido` e `recusado`, o fim do caminho, ficam de fora. A ordem
 * desta lista é a da tela.
 */
export const SITUACOES_EM_ABERTO: readonly SituacaoPlano[] = ["proposto", "aprovado", "em-andamento"];

export type PlanoEmAberto = { plano: PlanoTratamento; paciente?: Paciente };

/**
 * Os planos em aberto, cada um com o seu paciente. Vêm primeiro os propostos, que esperam resposta, depois os
 * aprovados e os em andamento; em cada grupo, pelo nome do paciente, e no mesmo paciente pela ordem em que os
 * planos foram criados. Plano de um paciente que já não existe entra sem `paciente`, em vez de sumir da lista.
 */
export function planosEmAberto(planos: readonly PlanoTratamento[], pacientes: readonly Paciente[]): PlanoEmAberto[] {
  const porId = new Map(pacientes.map((p) => [p.id, p]));
  return planos
    .filter((plano) => SITUACOES_EM_ABERTO.includes(plano.situacao))
    .map((plano) => ({ plano, paciente: porId.get(plano.pacienteId) }))
    .sort(
      (a, b) =>
        SITUACOES_EM_ABERTO.indexOf(a.plano.situacao) - SITUACOES_EM_ABERTO.indexOf(b.plano.situacao) ||
        (a.paciente?.nome ?? "").localeCompare(b.paciente?.nome ?? "", "pt-BR"),
    );
}
