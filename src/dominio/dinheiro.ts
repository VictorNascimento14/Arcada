/**
 * Valor em dinheiro, em centavos e sempre inteiro: R$ 12,34 é `1234` (ADR-005 do cofre).
 *
 * É só `number`, então o compilador não impede um valor em reais ou fracionário. A defesa é a conversão
 * nas bordas — `paraCentavos` na entrada, `formatarReais` na saída — e a validação na escrita, em
 * `src/dados/`. No meio do caminho ninguém converte nem divide por 100.
 */
export type Centavos = number;

const real = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * `123456` vira `R$ 1.234,56`. Atenção: o Intl separa o `R$` do número com espaço não separável
 * (U+00A0), não com o espaço comum — comparar o texto com `"R$ 1.234,56"` digitado à mão falha.
 */
export function formatarReais(centavos: Centavos): string {
  return real.format(centavos / 100);
}

// `R$` opcional · inteiro, com "." de milhar (de três em três, sem começar em zero) ou sem · "," com uma
// ou duas casas. Sem sinal. O `\s` cobre o U+00A0 que o `formatarReais` escreve depois do `R$`.
const ENTRADA = /^(?:R\$\s*)?([1-9]\d{0,2}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/**
 * Lê um valor digitado no padrão brasileiro e devolve os centavos, ou `null` se não for um valor válido.
 *
 * Aceita `"1.234,56"`, `"1234,56"`, `"12"` (R$ 12,00), `"12,5"` (R$ 12,50) e `"R$ 3,00"`, com ou sem o
 * espaço depois do `R$`. Devolve `null` para vazio, texto solto, três casas (`"12,345"`), sinal (preço,
 * desconto e pagamento não são negativos) e ponto como decimal: no Brasil o ponto é milhar, então
 * `"12.500"` são R$ 12.500,00 e `"12.50"` não é valor. Também devolve `null` quando o valor passa do
 * maior inteiro exato.
 */
export function paraCentavos(texto: string): Centavos | null {
  const m = ENTRADA.exec(texto.trim());
  if (!m) return null;
  const [, inteira, decimais = ""] = m;
  const total = Number(inteira.replaceAll(".", "")) * 100 + Number(decimais.padEnd(2, "0"));
  return Number.isSafeInteger(total) ? total : null;
}

/** Soma valores em centavos; sem argumentos, `0`. */
export function somarCentavos(...valores: Centavos[]): Centavos {
  return valores.reduce((soma, valor) => soma + valor, 0);
}
