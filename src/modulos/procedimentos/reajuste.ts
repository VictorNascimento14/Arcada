/**
 * O reajuste de preços em lote: um percentual, positivo ou negativo, sobre o preço de tabela dos procedimentos
 * escolhidos. Regra pura mais a gravação, sem React: a tela mostra a prévia com `reajustarPreco` e só grava
 * depois de confirmado, por `aplicarReajuste`.
 */
import { procedimentos } from "@/dados/colecoes";
import type { Centavos } from "@/dominio";

/** De -100% (o preço zera) a +1000%: fora disso é engano de digitação, e a conta em inteiros perderia a precisão. */
const dentroDoLimite = (percentual: number) => percentual >= -100 && percentual <= 1000; // falso para NaN

// Sinal opcional · até três dígitos inteiros · "," ou "." com uma ou duas casas.
const PERCENTUAL = /^[+-]?\d{1,3}(?:[.,]\d{1,2})?$/;

/**
 * Lê o percentual digitado: `5`, `-10`, `+7,5` ou `12.25` (a vírgula e o ponto valem como decimal, com até duas
 * casas). `null` para vazio, texto solto, três casas e o que reduz mais de 100%. Zero vale: não muda preço algum.
 */
export function lerPercentual(texto: string): number | null {
  const limpo = texto.trim();
  if (!PERCENTUAL.test(limpo)) return null;
  const percentual = Number(limpo.replace(",", "."));
  return dentroDoLimite(percentual) ? percentual : null;
}

/**
 * O preço depois do reajuste, em centavos, arredondado para o centavo mais próximo; o meio centavo sobe (R$ 57,00
 * com -0,5% dá 5671,5 centavos, que viram 5672). O percentual vale com até duas casas decimais; o que passa
 * disso é arredondado antes da conta.
 */
export function reajustarPreco(preco: Centavos, percentual: number): Centavos {
  // ponytail: o percentual em centésimos inteiros deixa a conta toda em inteiros — `preco * (1 + 0,5 / 100)` em
  // ponto flutuante dá 5728,4999… para R$ 57,00 onde o certo é 5728,5, e o meio centavo desceria (o mesmo
  // cuidado de `tratamentos/desconto.ts`). Mais casas decimais: trocar o 100 e o 10_000 por 10^casas e 10^(casas + 2).
  return Math.round((preco * (10_000 + Math.round(percentual * 100))) / 10_000);
}

/**
 * Reajusta o preço dos procedimentos de `ids` e devolve quantos preços mudaram (o que o arredondamento deixa como
 * estava não conta). Grava tudo de uma vez: ou todos os preços mudam, ou nenhum. Id que não existe é ignorado, e
 * só o `preco` muda.
 *
 * Lança `RangeError` para percentual fora de -100 a 1000 ou que não é número: a tela o lê por `lerPercentual`,
 * que já o recusa.
 */
export function aplicarReajuste(ids: readonly string[], percentual: number): number {
  if (!dentroDoLimite(percentual)) throw new RangeError(`Percentual fora de -100 a 1000: ${percentual}`);
  const escolhidos = new Set(ids);
  let mudaram = 0;
  const reajustados = procedimentos.listar().map((p) => {
    const preco = escolhidos.has(p.id) ? reajustarPreco(p.preco, percentual) : p.preco;
    if (preco === p.preco) return p;
    mudaram++;
    return { ...p, preco };
  });
  if (mudaram > 0) procedimentos.substituirTudo(reajustados);
  return mudaram;
}
