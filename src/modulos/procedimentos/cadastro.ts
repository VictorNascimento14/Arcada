// O cadastro de procedimento: o que o formulário edita, a validação e a gravação. Regra pura, sem React: a
// tela só monta os campos e mostra os erros. A validação daqui é a regra; a da tela é conforto.

import { procedimentos } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import { formatarReais, paraCentavos, type Procedimento } from "@/dominio";

import { especialidadesDe } from "./busca";
import { ESPECIALIDADES } from "./catalogo";

/** A duração vai de 1 minuto a 8 horas: mais que isso não cabe num dia de agenda. */
export const LIMITES_DO_PROCEDIMENTO = { nome: 100, codigo: 20, especialidade: 60, duracaoMin: 480 } as const;

/** O que o formulário edita: preço e duração como foram digitados, e as duas exigências. */
export type CamposDoProcedimento = {
  nome: string;
  codigo: string;
  especialidade: string;
  /** Em reais, no padrão brasileiro (`1.234,56`); a conversão para centavos é de `paraCentavos`. */
  preco: string;
  /** Em minutos, só dígitos. */
  duracao: string;
  exigeDente: boolean;
  exigeFace: boolean;
};
export type ErrosDoProcedimento = Partial<Record<Exclude<keyof CamposDoProcedimento, "exigeDente">, string>>;

/** Os campos de um procedimento existente; sem ele, os de um novo (tudo vazio, sem exigência). */
export function camposDoProcedimento(p?: Procedimento): CamposDoProcedimento {
  return {
    nome: p?.nome ?? "",
    codigo: p?.codigo ?? "",
    especialidade: p?.especialidade ?? "",
    // `formatarReais` já põe o milhar e a vírgula; só o `R$` (com o espaço não separável) sai do campo.
    preco: p ? formatarReais(p.preco).replace(/^R\$\s/, "") : "",
    duracao: p ? String(p.duracaoMin) : "",
    exigeDente: p?.exigeDente ?? false,
    exigeFace: p?.exigeFace ?? false,
  };
}

/**
 * As especialidades que o formulário oferece: as do catálogo padrão e, depois, as que já estão na tabela fora
 * dele. É lista fechada: `especialidade` é texto livre no tipo, mas o formulário não deixa criar uma por
 * engano de digitação.
 *
 * ponytail: para uma área que não é do catálogo, o próximo degrau é uma opção "Outra" com campo de texto.
 */
export function especialidadesOferecidas(lista: readonly Procedimento[]): string[] {
  const padrao: readonly string[] = ESPECIALIDADES;
  return [...padrao, ...especialidadesDe(lista).filter((e) => !padrao.includes(e))];
}

/**
 * Uma mensagem por campo inválido; objeto vazio quando está tudo certo. `outros` são os demais procedimentos da
 * tabela (sem o que se edita): o código, quando há, não pode repetir o de nenhum deles.
 *
 * Preço zero é aceito (cortesia, retorno sem custo). Nome repetido também: só o código identifica.
 */
export function validarProcedimento(c: CamposDoProcedimento, outros: readonly Procedimento[] = []): ErrosDoProcedimento {
  const limites = LIMITES_DO_PROCEDIMENTO;
  const erros: ErrosDoProcedimento = {};

  const nome = c.nome.trim();
  if (!nome) erros.nome = "Informe o nome do procedimento.";
  else if (nome.length > limites.nome) erros.nome = `Use no máximo ${limites.nome} caracteres.`;

  const codigo = c.codigo.trim().toLowerCase();
  if (codigo.length > limites.codigo) erros.codigo = `Use no máximo ${limites.codigo} caracteres.`;
  else if (codigo && outros.some((p) => p.codigo?.trim().toLowerCase() === codigo)) erros.codigo = "Já existe um procedimento com este código.";

  const especialidade = c.especialidade.trim();
  if (!especialidade) erros.especialidade = "Escolha a especialidade.";
  else if (especialidade.length > limites.especialidade) erros.especialidade = `Use no máximo ${limites.especialidade} caracteres.`;

  if (paraCentavos(c.preco) === null) erros.preco = "Informe o preço em reais, como 180,00.";

  const minutos = c.duracao.trim();
  if (!/^\d+$/.test(minutos) || Number(minutos) < 1 || Number(minutos) > limites.duracaoMin) {
    erros.duracao = `Informe a duração em minutos, de 1 a ${limites.duracaoMin}.`;
  }

  if (c.exigeFace && !c.exigeDente) erros.exigeFace = "Para exigir a face, o procedimento também exige o dente.";
  return erros;
}

/**
 * Valida e grava: `id` é o procedimento que se edita; sem ele, cria um novo, ativo. Devolve os erros por campo;
 * objeto vazio quer dizer que salvou. O que o formulário não edita (`ativo`, `condicaoResultante`) segue como
 * estava.
 */
export function salvarProcedimento(campos: CamposDoProcedimento, id?: string): ErrosDoProcedimento {
  const erros = validarProcedimento(campos, procedimentos.listar().filter((p) => p.id !== id));
  const preco = paraCentavos(campos.preco);
  if (Object.keys(erros).length > 0 || preco === null) return erros;
  const idFinal = id ?? novoId();
  procedimentos.salvar({
    ativo: true,
    ...procedimentos.obter(idFinal),
    id: idFinal,
    codigo: campos.codigo.trim() || undefined,
    nome: campos.nome.trim(),
    especialidade: campos.especialidade.trim(),
    preco,
    duracaoMin: Number(campos.duracao.trim()),
    exigeDente: campos.exigeDente,
    exigeFace: campos.exigeFace,
  });
  return {};
}
