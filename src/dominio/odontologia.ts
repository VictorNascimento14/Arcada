/**
 * Número FDI (ISO 3950) do dente, de dois dígitos: permanentes 11–18, 21–28, 31–38 e 41–48; decíduos
 * 51–55, 61–65, 71–75 e 81–85. O primeiro dígito é o quadrante; o segundo, a posição a partir da linha
 * média (ADR-004 do cofre).
 *
 * É só `number`: quais números existem e a que quadrante e dentição cada um pertence vem com a regra da
 * notação (item 3.1 do plano). Os números não são contínuos — nunca use um como índice de lista.
 */
export type NumeroDente = number;

/**
 * Face do dente: V vestibular, M mesial, D distal, L lingual (dentes inferiores) ou P palatina
 * (superiores), O oclusal (dentes de trás) ou I incisal (os da frente).
 */
export type Face = "V" | "L" | "P" | "M" | "D" | "O" | "I";
