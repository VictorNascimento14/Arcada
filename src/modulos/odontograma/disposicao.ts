// Onde cada face cai no desenho do dente (`Dente.tsx`). A regra é do papel de cada face e do lado do paciente,
// por isso mora à parte do SVG: vira teste puro.

import { arcada, facesDoDente, lado } from "@/dominio/fdi";
import type { Face, NumeroDente } from "@/dominio/odontologia";

/** Os cinco lugares do desenho, na ordem de leitura (de cima para baixo, da esquerda para a direita). */
export const POSICOES = ["cima", "esquerda", "centro", "direita", "baixo"] as const;

export type Posicao = (typeof POSICOES)[number];

/**
 * A face de cada lugar do desenho, com o dente visto de frente, como no odontograma:
 * - o centro é a face de cima do dente: incisal (frente) ou oclusal (trás);
 * - a vestibular fica em cima no dente superior e embaixo no inferior, e a palatina (superior) ou lingual
 *   (inferior) fica do lado oposto;
 * - a mesial fica do lado da linha média: à direita da figura nos quadrantes 1, 4, 5 e 8 (dentes do lado
 *   direito do paciente, que aparecem à esquerda de quem olha) e à esquerda nos 2, 3, 6 e 7. A distal, do outro.
 *
 * Lança `RangeError` se o dente não existe (vem de `facesDoDente`).
 */
export function disposicaoDasFaces(n: NumeroDente): Record<Posicao, Face> {
  // A ordem de `facesDoDente` é garantida: V, M, D, a de dentro da boca e a de cima.
  const [vestibular, mesial, distal, interna, incisalOuOclusal] = facesDoDente(n);
  const superior = arcada(n) === "superior";
  const mesialADireita = lado(n) === "direito";

  return {
    cima: superior ? vestibular : interna,
    baixo: superior ? interna : vestibular,
    direita: mesialADireita ? mesial : distal,
    esquerda: mesialADireita ? distal : mesial,
    centro: incisalOuOclusal,
  };
}
