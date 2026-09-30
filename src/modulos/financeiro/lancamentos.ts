/**
 * As escritas do financeiro. A tela chama estas funções e a regra mora aqui, não nos botões: o plano gera as
 * parcelas uma vez só, a soma delas é exatamente o total do orçamento (ADR-005) e a baixa quita a parcela inteira.
 */
import { lancamentos, planos } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import type { DataISO, Lancamento, PlanoTratamento } from "@/dominio";
import { somarDias } from "@/modulos/agenda/dias";
import { parcelar, type Parcela } from "@/modulos/tratamentos/parcelas";
import { total } from "@/modulos/tratamentos/plano";
import { diaISO } from "@/ui";

import { SITUACOES_QUE_PARCELAM } from "./aParcelar";
import { FORMAS_DE_PAGAMENTO } from "./formas";

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

/**
 * O que o formulário da baixa digita: a forma (`""` é ainda não escolhida) e o dia do pagamento, `AAAA-MM-DD`. Não há
 * valor: a baixa é sempre da parcela inteira, e baixa parcial não entra na v1.
 */
export type CamposDaBaixa = { forma: string; data: string };
export type ErrosDaBaixa = Partial<Record<keyof CamposDaBaixa, string>>;

/** Dia que existe no calendário: `2026-02-30` passa no formato e volta como `2026-03-02`. */
const diaValido = (dia: string) => /^\d{4}-\d{2}-\d{2}$/.test(dia) && somarDias(dia, 0) === dia;

/**
 * Dá baixa na parcela: grava o dia e a forma do pagamento, e ela passa a paga, pelo valor inteiro. O dia não passa de
 * `hoje` — pagamento que ainda não aconteceu não é baixa. Devolve os erros por campo; objeto vazio quer dizer que
 * gravou. Lança se a parcela não existe ou já está paga: a tela nem oferece esses casos, e desfazer a baixa é o
 * estorno (item 10.8 do plano da v1).
 */
export function darBaixa(lancamentoId: string, campos: CamposDaBaixa, hoje: DataISO = diaISO(new Date())): ErrosDaBaixa {
  const parcela = lancamentos.obter(lancamentoId);
  if (!parcela) throw new Error(`A parcela ${lancamentoId} não existe.`);
  if (parcela.pagoEm !== undefined) throw new Error("A parcela já está paga.");
  const forma = FORMAS_DE_PAGAMENTO.find((f) => f === campos.forma);
  const erros: ErrosDaBaixa = {};
  if (!forma) erros.forma = "Escolha a forma de pagamento.";
  if (!diaValido(campos.data)) erros.data = "Informe o dia do pagamento.";
  else if (campos.data > hoje) erros.data = "O pagamento não pode ser depois de hoje.";
  if (!forma || erros.data) return erros;
  lancamentos.salvar({ ...parcela, pagoEm: campos.data, forma });
  return {};
}
