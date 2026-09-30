// Idade e faixa etária pela data de nascimento. As datas são `AAAA-MM-DD` e a conta é por texto, sem
// `Date`: `new Date("2000-02-29")` lê UTC e, no fuso do Brasil, recua um dia; e `toISOString()` faz o
// mesmo caminho ao contrário. `MM-DD` com zero à esquerda ordena como o calendário.

/** As faixas etárias e o rótulo de cada uma (chave sem acento, como `GRUPOS_COLUNA`). */
export const FAIXAS_ETARIAS = {
  crianca: "Criança",
  adolescente: "Adolescente",
  adulto: "Adulto",
  idoso: "Idoso",
} as const;

export type FaixaEtaria = keyof typeof FAIXAS_ETARIAS;

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Anos completos de quem nasceu em `nascimento`, contados até `hoje` (`diaISO(new Date())` de `@/ui`).
 * No dia do aniversário o ano já conta. Quem nasceu em 29/02 completa o ano em 1º/03 nos anos não
 * bissextos. Nascimento depois de `hoje` dá número negativo: recusar a data futura é de quem grava.
 * Só confere o formato (30/02 passa) e não repete a data na mensagem: é dado pessoal.
 */
export function idade(nascimento: string, hoje: string): number {
  if (!FORMATO.test(nascimento) || !FORMATO.test(hoje)) throw new RangeError("Data fora do formato AAAA-MM-DD.");
  const anos = Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4));
  return hoje.slice(5) < nascimento.slice(5) ? anos - 1 : anos;
}

/** Criança até 11 anos, adolescente de 12 a 17, adulto de 18 a 59 e idoso a partir de 60. */
export function faixaEtaria(anos: number): FaixaEtaria {
  if (anos < 12) return "crianca";
  if (anos < 18) return "adolescente";
  if (anos < 60) return "adulto";
  return "idoso";
}
