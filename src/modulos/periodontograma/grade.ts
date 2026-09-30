// O que a grade de sondagem mostra e aceita: o rótulo de cada sítio por arcada e os campos de medida, cada um
// com o seu intervalo. Regra pura, sem React. O exame em si — sítios, índices, nível de inserção — é de
// `exame.ts`.

import type { Arcada } from "@/dominio";

import type { Sitio } from "./exame";

/**
 * O rótulo do sítio na tela. O modelo chama de ML, L e DL os sítios do lado de dentro da boca; na arcada
 * superior esse lado é o palatino, e o rótulo vira MP, P e DP. Os vestibulares não mudam.
 */
export function rotuloDoSitio(sitio: Sitio, arcada: Arcada): string {
  return arcada === "superior" ? sitio.replace("L", "P") : sitio;
}

/** O nome do sítio por extenso, para leitor de tela: `mesiovestibular`, `distopalatino`, `lingual`… */
export function nomeDoSitio(sitio: Sitio, arcada: Arcada): string {
  const face = sitio.endsWith("V") ? "vestibular" : arcada === "superior" ? "palatino" : "lingual";
  return (sitio.startsWith("M") ? "mesio" : sitio.startsWith("D") ? "disto" : "") + face;
}

/** Os campos numéricos de um sítio, em milímetros. */
export type CampoMedida = "profundidade" | "margem";

/**
 * O rótulo e o intervalo de cada campo. O da margem diz o sinal: sinal trocado não dá erro, só inserção
 * errada (`nivelDeInsercao` soma a margem à profundidade).
 */
export const CAMPOS_DE_MEDIDA: Record<CampoMedida, { rotulo: string; min: number; max: number }> = {
  profundidade: { rotulo: "Profundidade", min: 0, max: 15 },
  margem: { rotulo: "Margem (+ recessão, − coronal)", min: -15, max: 15 },
};

/**
 * Se `valor` serve ao campo: inteiro e dentro do intervalo.
 * ponytail: milímetro inteiro, que é como a sonda é graduada. Meio milímetro pede mudar o `step` do campo
 * na grade e o teste de inteiro aqui.
 */
export function medidaValida(campo: CampoMedida, valor: number): boolean {
  const { min, max } = CAMPOS_DE_MEDIDA[campo];
  return Number.isInteger(valor) && valor >= min && valor <= max;
}

/** O intervalo do campo em texto, com o sinal de menos de verdade: `0 a 15 mm`, `−15 a 15 mm`. */
export function faixaDoCampo(campo: CampoMedida): string {
  const { min, max } = CAMPOS_DE_MEDIDA[campo];
  return `${min} a ${max} mm`.replace("-", "−");
}
