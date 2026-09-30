/**
 * Valor por extenso para o recibo, em português do Brasil:
 * `12050` → "cento e vinte reais e cinquenta centavos".
 *
 * Recebe centavos inteiros (ADR-005), nunca reais com vírgula.
 */

const UNIDADES = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
// Um par [singular, plural] por grupo de três dígitos, do menor para o maior.
const CLASSES = [["", ""], ["mil", "mil"], ["milhão", "milhões"], ["bilhão", "bilhões"], ["trilhão", "trilhões"]];

/** De 1 a 999. */
function ate999(n: number): string {
  if (n === 100) return "cem";
  const resto = n % 100;
  const dezenaEUnidade =
    resto < 20 ? UNIDADES[resto] : [DEZENAS[Math.floor(resto / 10)], UNIDADES[resto % 10]].filter(Boolean).join(" e ");
  return [CENTENAS[Math.floor(n / 100)], dezenaEUnidade].filter(Boolean).join(" e ");
}

/** Do 1 até os trilhões: cobre todo valor em centavos que é inteiro seguro. */
function inteiro(n: number): string {
  const partes: string[] = [];
  let menor = 0; // o menor grupo diferente de zero decide o "e" antes dele
  // Divisão sobre múltiplo exato (`r - r % 1000`): não depende do arredondamento de `Math.floor(r / 1000)`.
  for (let i = 0, r = n; r > 0; i++, r = (r - (r % 1000)) / 1000) {
    const g = r % 1000;
    if (g === 0) continue;
    const [singular, plural] = CLASSES[i];
    const numero = i === 1 && g === 1 ? "" : ate999(g); // "mil", nunca "um mil"
    partes.unshift([numero, g === 1 ? singular : plural].filter(Boolean).join(" "));
    menor ||= g;
  }
  const ultima = partes.pop() ?? "";
  // O "e" só liga o último grupo se ele for menor que 100 ou centena redonda:
  // "mil e um", "dois mil e quinhentos", mas "mil cento e um".
  const liga = menor < 100 || menor % 100 === 0 ? " e " : " ";
  return partes.length ? partes.join(" ") + liga + ultima : ultima;
}

/** Lança `RangeError` se `centavos` não for inteiro seguro e não negativo. */
export function valorPorExtenso(centavos: number): string {
  if (!Number.isSafeInteger(centavos) || centavos < 0) {
    throw new RangeError(`Valor em centavos deve ser um inteiro não negativo: ${centavos}`);
  }
  const cent = centavos % 100;
  const reais = (centavos - cent) / 100;
  const partes: string[] = [];
  if (reais > 0 || cent === 0) {
    // Plural só de 2 em diante; milhão, bilhão e trilhão redondos pedem "de reais".
    const moeda = reais <= 1 ? "real" : reais % 1_000_000 === 0 ? "de reais" : "reais";
    partes.push(`${reais === 0 ? "zero" : inteiro(reais)} ${moeda}`);
  }
  if (cent > 0) partes.push(`${inteiro(cent)} ${cent === 1 ? "centavo" : "centavos"}`);
  return partes.join(" e ");
}
