// A busca e o filtro da lista de procedimentos: por nome e código (sem acento nem caixa) e por especialidade.
// Regra pura, sem React: a tela só chama `filtrarProcedimentos` e `especialidadesDe`.

import type { Procedimento } from "@/dominio";

import { ESPECIALIDADES } from "./catalogo";

const porNome = new Intl.Collator("pt-BR").compare;

/** Minúsculas, sem acento e com um espaço só entre as palavras (a mesma normalização de `pacientes/busca.ts`). */
function chave(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** A posição na lista do catálogo padrão; as especialidades de fora dela vêm depois. */
function posicao(especialidade: string): number {
  const i = (ESPECIALIDADES as readonly string[]).indexOf(especialidade);
  return i < 0 ? ESPECIALIDADES.length : i;
}

const porEspecialidade = (a: string, b: string) => posicao(a) - posicao(b) || porNome(a, b);

/** As especialidades que a lista tem: as do catálogo padrão na ordem dele e, depois, as de fora, em ordem alfabética. */
export function especialidadesDe(lista: readonly Procedimento[]): string[] {
  return [...new Set(lista.map((p) => p.especialidade))].sort(porEspecialidade);
}

type Filtro = {
  /** O que foi digitado na busca. */
  termo: string;
  /** Uma especialidade exata; vazio não filtra. */
  especialidade: string;
};

/**
 * Os procedimentos que casam com o filtro, por especialidade (na ordem do catálogo padrão) e, dentro dela, por
 * nome. Termo em branco e especialidade vazia não filtram nada.
 *
 * - **Termo**: cada palavra digitada tem de aparecer no nome ou no código, em qualquer ordem e sem distinguir
 *   acento nem caixa: `restauracao resina` acha `Restauração em resina composta`, e `cir-01` acha pelo código.
 * - **Especialidade**: a igual, como a lista de `especialidadesDe` a oferece.
 */
export function filtrarProcedimentos(lista: readonly Procedimento[], { termo, especialidade }: Filtro): Procedimento[] {
  const palavras = chave(termo).split(" ").filter(Boolean);
  return lista
    .filter((p) => {
      if (especialidade && p.especialidade !== especialidade) return false;
      const alvo = chave(`${p.nome} ${p.codigo ?? ""}`);
      return palavras.every((palavra) => alvo.includes(palavra));
    })
    .sort((a, b) => porEspecialidade(a.especialidade, b.especialidade) || porNome(a.nome, b.nome));
}
