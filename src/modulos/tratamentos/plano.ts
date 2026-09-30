/**
 * Os números do plano de tratamento e do orçamento dele. Tudo em centavos inteiros (ADR-005): o total
 * não se guarda no plano — calcula-se aqui, a partir dos itens e do desconto.
 */
import { somarCentavos, type Centavos, type ItemPlano, type PlanoTratamento } from "@/dominio";

/** Soma dos preços dos itens, antes do desconto. Plano sem itens dá `0`. */
export function subtotal(plano: PlanoTratamento): Centavos {
  return somarCentavos(...plano.itens.map((item) => item.preco));
}

/**
 * O que o paciente paga: o subtotal menos o desconto. Nunca é negativo — um desconto maior que o
 * subtotal (sobrou de um item que saiu do plano depois) zera o total em vez de invertê-lo.
 */
export function total(plano: PlanoTratamento): Centavos {
  const bruto = subtotal(plano);
  return bruto - Math.min(plano.desconto, bruto);
}

/** Os itens já feitos (com `realizadoEm`), na ordem do plano. O progresso é isto sobre `plano.itens`. */
export function itensRealizados(plano: PlanoTratamento): ItemPlano[] {
  return plano.itens.filter((item) => item.realizadoEm !== undefined);
}
