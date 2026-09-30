/**
 * Parcelamento do orçamento (ADR-005): o total dividido em `n` parcelas que somam exatamente o total,
 * com os vencimentos mensais.
 *
 * As datas são `AAAA-MM-DD` e a conta é por número e texto, sem `Date`: `new Date("2026-01-31")` lê UTC
 * e, no fuso do Brasil, recua um dia.
 */
import type { Centavos, DataISO, Lancamento } from "@/dominio";

/** O que uma parcela tem de próprio: quem gera o lançamento acrescenta o id, o paciente e o plano. */
export type Parcela = Pick<Lancamento, "valor" | "vencimento">;

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;

// Gregoriano: de 4 em 4 anos, menos os séculos que não são múltiplos de 400 (2100 não é; 2000 foi).
const bissexto = (ano: number) => (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;

/** Dias do mês; `mes` vai de 1 a 12. */
const diasNoMes = (ano: number, mes: number) =>
  [31, bissexto(ano) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];

function lerData(data: DataISO): [ano: number, mes: number, dia: number] {
  const partes = FORMATO.exec(data);
  if (partes) {
    const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes(ano, mes)) return [ano, mes, dia];
  }
  throw new RangeError(`O primeiro vencimento deve ser um dia que exista, em AAAA-MM-DD: ${data}`);
}

/** O dia `dia` do mês que vem `meses` depois de `ano`/`mes`; onde o mês é mais curto, o último dia dele. */
function daquiAMeses(ano: number, mes: number, dia: number, meses: number): DataISO {
  const indice = ano * 12 + (mes - 1) + meses;
  const [a, m] = [Math.floor(indice / 12), (indice % 12) + 1];
  const d = Math.min(dia, diasNoMes(a, m));
  return `${String(a).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Divide `total` (centavos) em `n` parcelas, a primeira vencendo em `primeiroVencimento` e as outras a
 * cada mês.
 *
 * - **Valores**: todas recebem o mesmo tanto e o resto dos centavos vai, um para cada, às primeiras —
 *   R$ 100,00 em 3 dá 3334 + 3333 + 3333. A soma é exatamente `total`. Se `total` for menor que `n`,
 *   as últimas saem com `0`: quem parcela decide se aceita.
 * - **Vencimentos**: cada um é contado a partir do dia do primeiro, não do vencimento anterior. Dia 31
 *   cai no último dia dos meses mais curtos e volta ao 31 quando o mês tem — 31/01, 28/02, 31/03 —, em
 *   vez de se arrastar para o 28.
 *
 * Lança `RangeError` se `total` não for um inteiro seguro e não negativo, se `n` não for um inteiro a
 * partir de 1 ou se o vencimento não for um dia que exista.
 */
export function parcelar(total: Centavos, n: number, primeiroVencimento: DataISO): Parcela[] {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError(`O total em centavos deve ser um inteiro não negativo: ${total}`);
  }
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`O número de parcelas deve ser um inteiro a partir de 1: ${n}`);
  const [ano, mes, dia] = lerData(primeiroVencimento);
  const resto = total % n;
  const base = (total - resto) / n; // múltiplo exato de `n`: a divisão não arredonda
  return Array.from({ length: n }, (_, i) => ({
    valor: base + (i < resto ? 1 : 0),
    vencimento: daquiAMeses(ano, mes, dia, i),
  }));
}
