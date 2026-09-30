// A busca da lista de pacientes: por nome (sem acento nem caixa) e por telefone (só os dígitos).
// Regra pura, sem React: a tela só chama `filtrarPacientes`.

import type { Paciente } from "@/dominio";

// Uma vez só: `localeCompare` com locale monta um colador a cada comparação, e a ordenação faz N log N delas.
const porNome = new Intl.Collator("pt-BR").compare;

/** Minúsculas, sem acento e com um espaço só entre as palavras: `"  João   Pedro"` vira `"joao pedro"`. */
function chave(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Dígitos e a pontuação de máscara de telefone (`+55 (11) 91234-5678`). */
const FEITO_DE_TELEFONE = /^[\d\s()+.-]+$/;

/**
 * Os pacientes cujo nome ou telefone casa com `termo`, em ordem alfabética. Termo em branco devolve todos.
 *
 * - **Nome**: por trecho, sem distinguir acento nem caixa (`joao` acha `João Pedro`).
 * - **Telefone**: por trecho dos dígitos, com ou sem máscara. Só vale quando o termo inteiro é feito de dígitos e
 *   máscara: `ana 9` é nome, e não pode acender todo telefone que tem um 9. O `55` do país é tirado de um número
 *   completo (mais de 11 dígitos), como em `contato.ts`.
 *
 * ponytail: `+55` com o número ainda incompleto não casa — `55` sozinho também é um DDD, e a lista de DDDs
 * é o que separaria os dois casos.
 */
export function filtrarPacientes(lista: readonly Paciente[], termo: string): Paciente[] {
  const ordenados = [...lista].sort((a, b) => porNome(a.nome, b.nome));
  const nome = chave(termo);
  if (!nome) return ordenados;

  let digitos = /\d/.test(nome) && FEITO_DE_TELEFONE.test(nome) ? nome.replace(/\D/g, "") : "";
  if (digitos.length > 11 && digitos.startsWith("55")) digitos = digitos.slice(2);

  return ordenados.filter(
    (p) => chave(p.nome).includes(nome) || (digitos !== "" && p.telefone.replace(/\D/g, "").includes(digitos)),
  );
}
