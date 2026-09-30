import { profissionais } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import { profissionalAtivo, type Profissional } from "@/dominio";

import { croValido, formatarCro } from "./cro";

/**
 * As cores que a agenda oferece ao profissional: CSS em texto, aplicado por `style` (classe do
 * Tailwind montada em runtime não existe). Todas dão AA (4,5:1 ou mais) com texto branco por cima.
 */
export const CORES_DA_AGENDA = [
  { nome: "Verde", valor: "#1f6f5b" },
  { nome: "Azul", valor: "#4a6fa5" },
  { nome: "Roxo", valor: "#7a5299" },
  { nome: "Terracota", valor: "#b0492f" },
  { nome: "Âmbar", valor: "#9a6700" },
  { nome: "Rosa", valor: "#b03f73" },
  { nome: "Turquesa", valor: "#0e7490" },
  { nome: "Grafite", valor: "#4b5563" },
] as const;

export const LIMITES_DO_PROFISSIONAL = { nome: 100, especialidade: 60 } as const;

/** O que o formulário edita: texto como foi digitado, a cor escolhida e se está ativo. */
export type CamposDoProfissional = { nome: string; cro: string; especialidade: string; cor: string; ativo: boolean };
export type ErrosDoProfissional = Partial<Record<Exclude<keyof CamposDoProfissional, "ativo">, string>>;

/** Os campos de um profissional existente; sem ele, os de um novo (primeira cor da lista, ativo). */
export function camposDoProfissional(p?: Profissional): CamposDoProfissional {
  return {
    nome: p?.nome ?? "",
    cro: p?.cro ?? "",
    especialidade: p?.especialidade ?? "",
    cor: p?.cor ?? CORES_DA_AGENDA[0].valor,
    ativo: p ? profissionalAtivo(p) : true,
  };
}

/** Uma mensagem por campo inválido; objeto vazio quando está tudo certo. O CRO digitado solto passa por `formatarCro`. */
export function validarProfissional(c: CamposDoProfissional): ErrosDoProfissional {
  const erros: ErrosDoProfissional = {};
  const { nome, especialidade } = LIMITES_DO_PROFISSIONAL;
  if (!c.nome.trim()) erros.nome = "Informe o nome do profissional.";
  else if (c.nome.trim().length > nome) erros.nome = `Use no máximo ${nome} caracteres.`;
  if (!c.cro.trim()) erros.cro = "Informe o registro no CRO.";
  else if (!croValido(formatarCro(c.cro))) erros.cro = "Use o formato CRO-SP 00000: a sigla do estado e o número.";
  if (c.especialidade.trim().length > especialidade) erros.especialidade = `Use no máximo ${especialidade} caracteres.`;
  if (!CORES_DA_AGENDA.some((cor) => cor.valor === c.cor)) erros.cor = "Escolha uma das cores da lista.";
  return erros;
}

/**
 * Valida e grava: `id` é o profissional que se edita; sem ele, cria um novo. Devolve os erros por
 * campo; objeto vazio quer dizer que salvou. O que o formulário não edita segue como estava.
 */
export function salvarProfissional(campos: CamposDoProfissional, id?: string): ErrosDoProfissional {
  const erros = validarProfissional(campos);
  if (Object.keys(erros).length > 0) return erros;
  const idFinal = id ?? novoId();
  profissionais.salvar({
    ...profissionais.obter(idFinal),
    id: idFinal,
    nome: campos.nome.trim(),
    cro: formatarCro(campos.cro),
    especialidade: campos.especialidade.trim() || undefined,
    cor: campos.cor,
    ativo: campos.ativo,
  });
  return {};
}
