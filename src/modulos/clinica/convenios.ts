/**
 * Os convênios aceitos pela clínica: uma lista simples de nomes, guardada no registro da clínica
 * (`Clinica.convenios`), sem repetir e em ordem alfabética. Regra pura mais a gravação, sem React.
 *
 * ponytail: só o nome. Sem código, plano ou tabela de preços por convênio, e sem renomear (remove-se e acrescenta-se
 * de novo). `Paciente.convenio` segue texto livre: a lista ainda não o restringe, e tirar um convênio da lista não
 * mexe nos pacientes.
 */
import { clinica, CLINICA_ID } from "@/dados/colecoes";

import { SEMANA_FECHADA } from "./dadosDaClinica";

export const LIMITE_DO_NOME_DO_CONVENIO = 60;

const porNome = new Intl.Collator("pt-BR").compare;
// `base` ignora caixa e acento: `Convênio Exemplo` e `convenio exemplo` são o mesmo convênio.
const mesmoNome = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** O nome como fica guardado: aparado e com um espaço só entre as palavras. */
const limpar = (nome: string) => nome.trim().replace(/\s+/g, " ");

/** A mensagem de erro do nome, ou `undefined` quando serve. `existentes` são os convênios já cadastrados. */
export function validarConvenio(nome: string, existentes: readonly string[] = []): string | undefined {
  const limpo = limpar(nome);
  if (!limpo) return "Informe o nome do convênio.";
  if (limpo.length > LIMITE_DO_NOME_DO_CONVENIO) return `Use no máximo ${LIMITE_DO_NOME_DO_CONVENIO} caracteres.`;
  if (existentes.some((c) => mesmoNome.compare(c, limpo) === 0)) return "Este convênio já está na lista.";
  return undefined;
}

/**
 * Valida e acrescenta o convênio à lista da clínica — a validação da tela é conforto, esta é a regra. Devolve a
 * mensagem de erro; `undefined` quer dizer que gravou. O resto do registro da clínica não é tocado.
 */
export function adicionarConvenio(nome: string): string | undefined {
  // Sem registro (nunca semeado), cria como `salvarDadosDaClinica`: o nome se preenche no cartão de dados.
  const atual = clinica.obter(CLINICA_ID) ?? { id: CLINICA_ID, nome: "", expediente: SEMANA_FECHADA };
  const existentes = atual.convenios ?? [];
  const erro = validarConvenio(nome, existentes);
  if (erro) return erro;
  clinica.salvar({ ...atual, convenios: [...existentes, limpar(nome)].sort(porNome) });
  return undefined;
}

/** Tira o convênio da lista da clínica. Nome que não está nela é ignorado. */
export function removerConvenio(nome: string): void {
  const atual = clinica.obter(CLINICA_ID);
  if (!atual?.convenios?.includes(nome)) return;
  clinica.salvar({ ...atual, convenios: atual.convenios.filter((c) => c !== nome) });
}
