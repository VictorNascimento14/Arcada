import { cadeiras } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import { cadeiraAtiva, type Cadeira } from "@/dominio";

export const LIMITE_DO_NOME_DA_CADEIRA = 60;

/** O que o formulário edita: o nome como foi digitado e se está ativa. */
export type CamposDaCadeira = { nome: string; ativa: boolean };
export type ErrosDaCadeira = { nome?: string };

/** Os campos de uma cadeira existente; sem ela, os de uma nova (ativa). */
export function camposDaCadeira(c?: Cadeira): CamposDaCadeira {
  return { nome: c?.nome ?? "", ativa: c ? cadeiraAtiva(c) : true };
}

/** Uma mensagem por campo inválido; objeto vazio quando está tudo certo. */
export function validarCadeira(c: CamposDaCadeira): ErrosDaCadeira {
  const nome = c.nome.trim();
  if (!nome) return { nome: "Informe o nome da cadeira." };
  if (nome.length > LIMITE_DO_NOME_DA_CADEIRA) return { nome: `Use no máximo ${LIMITE_DO_NOME_DA_CADEIRA} caracteres.` };
  return {};
}

/**
 * Valida e grava: `id` é a cadeira que se edita; sem ele, cria uma nova. Devolve os erros por
 * campo; objeto vazio quer dizer que salvou. O que o formulário não edita segue como estava.
 */
export function salvarCadeira(campos: CamposDaCadeira, id?: string): ErrosDaCadeira {
  const erros = validarCadeira(campos);
  if (erros.nome) return erros;
  const idFinal = id ?? novoId();
  cadeiras.salvar({ ...cadeiras.obter(idFinal), id: idFinal, nome: campos.nome.trim(), ativa: campos.ativa });
  return {};
}
