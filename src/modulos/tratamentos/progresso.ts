/**
 * O progresso do tratamento: quanto do plano já foi feito, contado em itens. Um item está feito quando tem
 * `realizadoEm` (`itensRealizados`, em `plano.ts`); o valor de cada item não pesa.
 */
import type { PlanoTratamento } from "@/dominio";

import { itensRealizados } from "./plano";

export type ProgressoDoPlano = {
  /** Itens já realizados. */
  feitos: number;
  /** Itens do plano. */
  total: number;
  /** De 0 a 100, arredondado para o inteiro mais próximo (1 de 8 é 13). */
  pct: number;
};

/** Plano sem itens tem `total` e `pct` zerados: não há o que medir, e a divisão por zero não chega a acontecer. */
export function progressoDoPlano(plano: PlanoTratamento): ProgressoDoPlano {
  const total = plano.itens.length;
  const feitos = itensRealizados(plano).length;
  return { feitos, total, pct: total === 0 ? 0 : Math.round((feitos / total) * 100) };
}
