/**
 * A situação do plano de tratamento e o caminho entre as situações:
 *
 *     proposto ─┬─> aprovado ──> em-andamento ──> concluido
 *               └─> recusado
 *
 * `concluido` e `recusado` são o fim: não há reabrir plano na v1. O que dispara cada passo (a
 * aprovação gerar as parcelas, o primeiro procedimento feito abrir o andamento) é de quem chama.
 */
import type { PlanoTratamento, SituacaoPlano } from "@/dominio";

const PROXIMAS: Record<SituacaoPlano, readonly SituacaoPlano[]> = {
  proposto: ["aprovado", "recusado"],
  aprovado: ["em-andamento"],
  "em-andamento": ["concluido"],
  concluido: [],
  recusado: [],
};

/** As situações para onde um plano em `situacao` pode ir; vazio nas duas finais. */
export function proximasSituacoes(situacao: SituacaoPlano): readonly SituacaoPlano[] {
  return PROXIMAS[situacao];
}

/** Se um plano em `de` pode passar a `para`. Ficar onde está não é transição. */
export function podeTransitar(de: SituacaoPlano, para: SituacaoPlano): boolean {
  return PROXIMAS[de].includes(para);
}

/** Devolve o plano na situação `para`, sem mexer no original. Lança `RangeError` se o caminho não existe. */
export function transitar(plano: PlanoTratamento, para: SituacaoPlano): PlanoTratamento {
  if (!podeTransitar(plano.situacao, para)) {
    throw new RangeError(`O plano não pode ir de ${plano.situacao} para ${para}.`);
  }
  return { ...plano, situacao: para };
}
