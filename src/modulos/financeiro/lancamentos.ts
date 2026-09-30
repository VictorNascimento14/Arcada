/**
 * As escritas do financeiro. A tela chama estas funções e a regra mora aqui, não nos botões: o plano gera as
 * parcelas uma vez só, e a soma delas é exatamente o total do orçamento (ADR-005).
 */
import { lancamentos, planos } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import type { Lancamento, PlanoTratamento } from "@/dominio";
import { parcelar, type Parcela } from "@/modulos/tratamentos/parcelas";
import { total } from "@/modulos/tratamentos/plano";

import { SITUACOES_QUE_PARCELAM } from "./aParcelar";

/** Cinco anos de mensalidades. Passar disso é engano de digitação — e a v1 não desfaz um parcelamento. */
export const MAXIMO_DE_PARCELAS = 60;

/** O que o formulário digita: o número de parcelas e o dia do 1º vencimento, `AAAA-MM-DD` (o valor do `<input type="date">`). */
export type CamposDasParcelas = { parcelas: string; vencimento: string };
export type ErrosDasParcelas = Partial<Record<keyof CamposDasParcelas, string>>;

/**
 * As parcelas que os campos dão para o plano — `parcelar` sobre o total dele, já com o desconto — ou os erros por
 * campo. Não grava: o modal usa isto para mostrar as parcelas antes de gerá-las.
 */
export function calcularParcelas(
  plano: PlanoTratamento,
  campos: CamposDasParcelas,
): { parcelas: Parcela[] } | { erros: ErrosDasParcelas } {
  const texto = campos.parcelas.trim();
  const n = /^\d+$/.test(texto) ? Number(texto) : 0;
  if (n < 1 || n > MAXIMO_DE_PARCELAS) return { erros: { parcelas: `Informe de 1 a ${MAXIMO_DE_PARCELAS} parcelas.` } };
  const valor = total(plano);
  // `parcelar` deixa as últimas em `0` quando o total é menor que `n`: aqui quem parcela decide, e não aceita.
  if (valor < n) return { erros: { parcelas: "Cada parcela precisa ter ao menos R$ 0,01." } };
  try {
    return { parcelas: parcelar(valor, n, campos.vencimento) };
  } catch {
    // O total e `n` já foram conferidos: `parcelar` só recusa aqui o vencimento (vazio, fora do formato ou um dia que não existe).
    return { erros: { vencimento: "Informe o dia do primeiro vencimento." } };
  }
}

/**
 * Gera as parcelas do plano: um lançamento para cada uma, gravados de uma vez — entram todos ou nenhum. Devolve
 * os erros por campo; objeto vazio quer dizer que gravou. Lança se o plano não existe, não está aprovado nem em
 * andamento ou já tem parcelas: a tela nem oferece esses casos, então é engano de quem chama.
 */
export function gerarParcelas(planoId: string, campos: CamposDasParcelas): ErrosDasParcelas {
  const plano = planos.obter(planoId);
  if (!plano) throw new Error(`O plano ${planoId} não existe.`);
  if (!SITUACOES_QUE_PARCELAM.includes(plano.situacao)) throw new Error("Só o plano aprovado ou em andamento gera parcelas.");
  if (lancamentos.listar().some((l) => l.planoId === planoId)) throw new Error("O plano já tem parcelas.");
  const resultado = calcularParcelas(plano, campos);
  if ("erros" in resultado) return resultado.erros;
  const novos: Lancamento[] = resultado.parcelas.map((p) => ({ id: novoId(), pacienteId: plano.pacienteId, planoId, ...p }));
  lancamentos.substituirTudo([...lancamentos.listar(), ...novos]);
  return {};
}
