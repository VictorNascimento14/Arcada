/**
 * As escritas do plano de tratamento. A tela chama estas funções e a regra mora aqui, não nos botões: um plano
 * só muda de itens e de desconto enquanto está `proposto`. Aprovado, ele gera as parcelas do financeiro, e mexer
 * no orçamento depois desalinharia o que foi orçado do que foi cobrado.
 */
import { pacientes, planos, procedimentos } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import type { PlanoTratamento, SituacaoPlano } from "@/dominio";

import { aplicarDesconto, type Desconto } from "./desconto";
import { itemDoFormulario, type CamposDoItem, type ErrosDoItem } from "./itens";
import { transitar } from "./situacao";

function obter(planoId: string): PlanoTratamento {
  const plano = planos.obter(planoId);
  if (!plano) throw new Error(`O plano ${planoId} não existe.`);
  return plano;
}

/** O plano que ainda se edita: itens e desconto só mudam com ele proposto. */
function proposto(planoId: string): PlanoTratamento {
  const plano = obter(planoId);
  if (plano.situacao !== "proposto") throw new Error("Só o plano proposto muda de itens e de desconto.");
  return plano;
}

/** Plano novo de um paciente: proposto, sem itens e sem desconto. */
export function criarPlano(pacienteId: string): PlanoTratamento {
  if (!pacientes.obter(pacienteId)) throw new Error(`O paciente ${pacienteId} não existe.`);
  const plano: PlanoTratamento = { id: novoId(), pacienteId, itens: [], desconto: 0, situacao: "proposto" };
  planos.salvar(plano);
  return plano;
}

/** Valida os campos (`itemDoFormulario`) e acrescenta o item. Devolve os erros por campo; objeto vazio quer dizer que gravou. */
export function adicionarItem(planoId: string, campos: CamposDoItem): ErrosDoItem {
  const plano = proposto(planoId);
  const resultado = itemDoFormulario(campos, procedimentos.listar());
  if ("erros" in resultado) return resultado.erros;
  planos.salvar({ ...plano, itens: [...plano.itens, { id: novoId(), ...resultado.item }] });
  return {};
}

// ponytail: o item não se edita, só se remove e se adiciona de novo. Editar pediria reabrir o formulário com os campos do item.
export function removerItem(planoId: string, itemId: string): void {
  const plano = proposto(planoId);
  planos.salvar({ ...plano, itens: plano.itens.filter((i) => i.id !== itemId) });
}

/** Grava o desconto (`aplicarDesconto`): substitui o que havia, e nunca passa do subtotal. */
export function definirDesconto(planoId: string, desconto: Desconto): void {
  planos.salvar(aplicarDesconto(proposto(planoId), desconto));
}

/** Leva o plano à situação `para`, pelas transições de `situacao.ts`. Aprovar exige ao menos um item. */
export function mudarSituacao(planoId: string, para: SituacaoPlano): void {
  const plano = obter(planoId);
  if (para === "aprovado" && plano.itens.length === 0) throw new Error("Um plano sem itens não se aprova.");
  planos.salvar(transitar(plano, para));
}
