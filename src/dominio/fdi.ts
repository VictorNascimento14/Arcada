// Notação FDI (ISO 3950): quais números de dente existem e o que cada um diz — quadrante, dentição, arcada,
// lado do paciente, tipo e nome (ADR-004 do cofre). Tudo sai do próprio número; nada disso é guardado à parte.
// Os números não são contínuos (depois do 18 vem o 21, não o 19): iterar e ordenar é pelas listas abaixo,
// nunca por `n + 1`.

import type { NumeroDente } from "./odontologia";

/** Primeiro dígito do número: de 1 a 4 nos permanentes e de 5 a 8 nos decíduos, na mesma ordem. */
export type Quadrante = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Arcada = "superior" | "inferior";

/** Lado do paciente, não de quem olha: o lado direito dele fica à esquerda de quem o vê de frente. */
export type Lado = "direito" | "esquerdo";

/**
 * Os dentes permanentes de cada arcada, na ordem em que se desenham: da esquerda para a direita de quem
 * olha o paciente de frente. A linha média fica no meio da lista, entre o 11 e o 21 (em cima) e entre o 41
 * e o 31 (embaixo).
 */
export const DENTES_PERMANENTES: Record<Arcada, readonly NumeroDente[]> = {
  superior: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  inferior: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

/** Os dentes decíduos, na mesma ordem: 55→51 | 61→65 em cima e 85→81 | 71→75 embaixo. */
export const DENTES_DECIDUOS: Record<Arcada, readonly NumeroDente[]> = {
  superior: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  inferior: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
};

const EXISTEM: ReadonlySet<unknown> = new Set([
  ...DENTES_PERMANENTES.superior,
  ...DENTES_PERMANENTES.inferior,
  ...DENTES_DECIDUOS.superior,
  ...DENTES_DECIDUOS.inferior,
]);

/**
 * Se `n` é o número de um dente que existe: 19, 56 e 90 não. Aceita qualquer valor para servir a dado
 * guardado ou digitado, e devolve `boolean` (não um predicado de tipo: `NumeroDente` é `number`, e o
 * ramo falso de um predicado estreitaria um `number` inválido para `never`).
 */
export function denteValido(n: unknown): boolean {
  return EXISTEM.has(n);
}

function conferir(n: NumeroDente): void {
  if (!denteValido(n)) throw new RangeError(`Dente ${n} não existe na notação FDI.`);
}

/** Arcada e lado do paciente de cada quadrante, na ordem da FDI: superior direito, superior esquerdo, inferior esquerdo e inferior direito. */
const POR_QUADRANTE: Record<Quadrante, { arcada: Arcada; lado: Lado }> = {
  1: { arcada: "superior", lado: "direito" },
  2: { arcada: "superior", lado: "esquerdo" },
  3: { arcada: "inferior", lado: "esquerdo" },
  4: { arcada: "inferior", lado: "direito" },
  5: { arcada: "superior", lado: "direito" },
  6: { arcada: "superior", lado: "esquerdo" },
  7: { arcada: "inferior", lado: "esquerdo" },
  8: { arcada: "inferior", lado: "direito" },
};

/** O primeiro dígito do número. Lança `RangeError` se o dente não existe — vale para toda função deste arquivo. */
export function quadrante(n: NumeroDente): Quadrante {
  conferir(n);
  return Math.floor(n / 10) as Quadrante;
}

/** Decíduo (dente de leite): quadrantes de 5 a 8. */
export function ehDeciduo(n: NumeroDente): boolean {
  return quadrante(n) >= 5;
}

/** Superior nos quadrantes 1, 2, 5 e 6; inferior nos 3, 4, 7 e 8. */
export function arcada(n: NumeroDente): Arcada {
  return POR_QUADRANTE[quadrante(n)].arcada;
}

/** Lado do paciente: direito nos quadrantes 1, 4, 5 e 8; esquerdo nos 2, 3, 6 e 7. */
export function lado(n: NumeroDente): Lado {
  return POR_QUADRANTE[quadrante(n)].lado;
}

/** Os tipos de dente e o rótulo de cada um (chave sem acento, como `FAIXAS_ETARIAS`). */
export const TIPOS_DENTE = {
  incisivoCentral: "incisivo central",
  incisivoLateral: "incisivo lateral",
  canino: "canino",
  premolar: "pré-molar",
  molar: "molar",
} as const;

export type TipoDente = keyof typeof TIPOS_DENTE;

// O tipo de cada posição, da linha média para trás. O decíduo não tem pré-molar: as posições 4 e 5 são molares.
const TIPOS_PERMANENTE: readonly TipoDente[] = ["incisivoCentral", "incisivoLateral", "canino", "premolar", "premolar", "molar", "molar", "molar"];
const TIPOS_DECIDUO: readonly TipoDente[] = ["incisivoCentral", "incisivoLateral", "canino", "molar", "molar"];

/** Posição de 1 (incisivo central) a 8 (terceiro molar; no decíduo, a 5) e os tipos da dentição do dente. */
function posicaoETipos(n: NumeroDente): [posicao: number, tipos: readonly TipoDente[]] {
  return [n % 10, ehDeciduo(n) ? TIPOS_DECIDUO : TIPOS_PERMANENTE];
}

/**
 * O tipo pela posição: 1 incisivo central, 2 incisivo lateral, 3 canino; 4 e 5 pré-molar no permanente e
 * molar no decíduo; 6 a 8 molar.
 */
export function tipoDente(n: NumeroDente): TipoDente {
  const [posicao, tipos] = posicaoETipos(n);
  return tipos[posicao - 1];
}

const ORDINAIS = ["primeiro", "segundo", "terceiro"];

/**
 * O nome por extenso: "primeiro molar superior direito" (16), "segundo molar decíduo inferior esquerdo" (75).
 * Só o pré-molar e o molar levam ordinal, contado a partir da linha média; o decíduo vem depois do tipo.
 */
export function nomeDente(n: NumeroDente): string {
  const [posicao, tipos] = posicaoETipos(n);
  const tipo = tipos[posicao - 1];
  const primeiro = tipos.indexOf(tipo);
  const ordinal = tipos.lastIndexOf(tipo) > primeiro ? ORDINAIS[posicao - 1 - primeiro] : undefined;
  return [ordinal, TIPOS_DENTE[tipo], ehDeciduo(n) ? "decíduo" : undefined, arcada(n), lado(n)].filter(Boolean).join(" ");
}
