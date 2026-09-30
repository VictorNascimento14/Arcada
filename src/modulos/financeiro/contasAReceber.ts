/**
 * A lista de contas a receber: as parcelas de todos os pacientes, cada uma com o paciente e a situação de um dia.
 */
import type { DataISO, Lancamento, Paciente } from "@/dominio";

import { situacaoDaParcela, type SituacaoDaParcela } from "./situacao";

export type ContaAReceber = { lancamento: Lancamento; paciente?: Paciente; situacao: SituacaoDaParcela };

/**
 * As parcelas com a situação em `hoje`. Vêm primeiro as em aberto — pelo vencimento, então as vencidas, a que vence
 * hoje e as a vencer saem na ordem em que pedem atenção — e no fim as pagas. Dentro de cada grupo, pelo vencimento
 * e, no mesmo dia, pelo nome do paciente; no mesmo paciente vale a ordem em que as parcelas foram geradas. Parcela de
 * um paciente que já não existe entra sem `paciente`, em vez de sumir.
 */
export function contasAReceber(lancamentos: readonly Lancamento[], pacientes: readonly Paciente[], hoje: DataISO): ContaAReceber[] {
  const porId = new Map(pacientes.map((p) => [p.id, p]));
  return lancamentos
    .map((lancamento) => ({ lancamento, paciente: porId.get(lancamento.pacienteId), situacao: situacaoDaParcela(lancamento, hoje) }))
    .sort(
      (a, b) =>
        Number(a.situacao === "paga") - Number(b.situacao === "paga") ||
        a.lancamento.vencimento.localeCompare(b.lancamento.vencimento) ||
        (a.paciente?.nome ?? "").localeCompare(b.paciente?.nome ?? "", "pt-BR"),
    );
}
