/**
 * O desconto do orçamento: percentual ou valor, guardado no plano em centavos inteiros (ADR-005) e nunca
 * maior que o subtotal.
 */
import type { Centavos, PlanoTratamento } from "@/dominio";

import { subtotal } from "./plano";

/** O que se pede: um percentual do subtotal (`10` é 10%) ou um valor em centavos. */
export type Desconto = { tipo: "percentual"; percentual: number } | { tipo: "valor"; valor: Centavos };

/**
 * Devolve o plano com o desconto pedido, já em centavos. Parte sempre do subtotal e **substitui** o
 * desconto que o plano tinha: aplicar duas vezes não soma.
 *
 * - **Percentual**: sobre o subtotal, arredondado para o centavo mais próximo; o meio centavo sobe
 *   (38,5 centavos viram 39). O percentual vale com até duas casas decimais (12,5 ou 33,33); o que passa
 *   disso é arredondado antes da conta.
 * - **Nunca maior que o subtotal**: o que passa (150%, ou R$ 500 num plano de R$ 300) vira o subtotal, e o
 *   total zera.
 * - **Sem desconto negativo**: menor que zero, ou o que não é número (campo vazio lido como `NaN`), vale `0`.
 */
export function aplicarDesconto(plano: PlanoTratamento, desconto: Desconto): PlanoTratamento {
  const base = subtotal(plano);
  // ponytail: o percentual em centésimos inteiros deixa a conta toda em inteiros — `base * 0,57 / 100` em
  // ponto flutuante dá 28,49999… onde o certo é 28,5, e o meio centavo desceria. Mais casas decimais:
  // trocar o 100 e o 10_000 por 10^casas e 10^(casas + 2).
  const pedido =
    desconto.tipo === "percentual"
      ? Math.round((base * Math.round(desconto.percentual * 100)) / 10_000)
      : desconto.valor;
  // `pedido > 0` é falso para negativo e para NaN: os dois caem em 0.
  return { ...plano, desconto: pedido > 0 ? Math.min(pedido, base) : 0 };
}
