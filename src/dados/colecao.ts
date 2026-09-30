// O repositório local da v1 (ADR-001 no cofre). É o ÚNICO ponto do app que toca o
// `localStorage` com dado do domínio: a tela lê por `useColecao` e escreve pelas funções
// de escrita de cada coleção. Trocar o armazenamento por uma API mexe aqui — as telas não mudam.
//
// A API é síncrona de propósito: com tudo em memória, uma tela nunca precisa de estado
// de carregamento para ler. Uma coleção guarda os itens no `localStorage` (uma chave por
// coleção, `arcada:<nome>`) e os espelha num array em memória, que é o que a tela enxerga.
//
// Crie UMA coleção por nome, no escopo do módulo: duas instâncias do mesmo nome não se
// enxergam dentro da mesma aba (o evento `storage` só chega às outras abas).

/** Tudo o que o repositório guarda mora sob este prefixo, uma chave por coleção. */
export const PREFIXO = "arcada:";

type Ouvinte = () => void;

export interface OpcoesColecao<T> {
  /** Versão do esquema dos itens. Sobe quando o formato muda. Padrão 1. */
  versao?: number;
  /**
   * Leva o que foi salvo numa versão menor ao formato atual, de uma vez: quem migra decide
   * os passos por `versaoAntiga`. Roda uma vez, porque o resultado é regravado já na versão
   * nova. Se lançar, nada é apagado: `criarColecao` propaga o erro e o dado salvo continua lá.
   */
  migrar?: (itensAntigos: unknown[], versaoAntiga: number) => T[];
}

/**
 * Os itens são imutáveis: para mudar um, `salvar` um objeto novo — nunca mexa num item
 * devolvido por `listar`/`obter`, que é o mesmo objeto da memória da coleção.
 * As funções são fechamentos, sem `this`: dá para passá-las soltas.
 */
export interface Colecao<T extends { id: string }> {
  /** Os itens, na ordem em que entraram. É o MESMO array até algo ser gravado. */
  listar: () => readonly T[];
  obter: (id: string) => T | undefined;
  /** Insere no fim, ou substitui no mesmo lugar quando o `id` já existe. Lança se o item não tem `id`. */
  salvar: (item: T) => void;
  /** `id` que não existe é ignorado, sem gravar nem avisar ninguém. */
  remover: (id: string) => void;
  /** Troca tudo de uma vez (semente, backup, restaurar a demonstração). Lança se faltar `id` ou se repetir. */
  substituirTudo: (itens: readonly T[]) => void;
  /** Avisa a cada mudança, inclusive as vindas de outra aba. Devolve a função que cancela. */
  assinar: (ouvinte: Ouvinte) => () => void;
}

/**
 * `localStorage` quando existe. Só o ACESSO à propriedade já pode lançar (SecurityError com o
 * site bloqueado): quem chama tem de estar dentro de um try.
 */
const armazenamento = (): Storage | null => globalThis.localStorage ?? null;

/** O envelope salvo, ou `null` se não há nada legível (storage inacessível, chave ausente, JSON corrompido). */
function lerEnvelope(chave: string): { versao?: unknown; itens?: unknown } | null {
  try {
    const bruto = armazenamento()?.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

/** Item sem `id`, ou dois com o mesmo, e `obter`/`salvar` não sabem mais de qual se fala: a escrita recusa. */
function exigirIds(nome: string, itens: readonly { id: string }[]): void {
  if (itens.some((i) => !i.id) || new Set(itens.map((i) => i.id)).size !== itens.length) {
    throw new Error(`coleção "${nome}": item sem id ou com id repetido`);
  }
}

export function criarColecao<T extends { id: string }>(
  nome: string,
  { versao = 1, migrar }: OpcoesColecao<T> = {},
): Colecao<T> {
  const chave = PREFIXO + nome;
  const ouvintes = new Set<Ouvinte>();
  const avisar = () => ouvintes.forEach((o) => o());

  // ponytail: falha de gravação (cota cheia, storage bloqueado) segue em memória e não avisa
  // a tela. Se a interface precisar dizer "não foi salvo", expor o erro por um `assinar` próprio.
  function escrever(lista: readonly T[]): void {
    // Serializa antes de tocar no estado: item que não vira JSON (BigInt, ciclo) lança aqui.
    const texto = JSON.stringify({ versao, itens: lista });
    try {
      armazenamento()?.setItem(chave, texto);
    } catch {
      /* segue em memória, nesta aba. */
    }
  }

  function ler(): readonly T[] {
    const salvo = lerEnvelope(chave);
    if (!salvo || typeof salvo.versao !== "number" || !Array.isArray(salvo.itens)) return [];
    // ponytail: sem `migrar`, ou com dado de versão MAIS NOVA que a do código (aba ou build
    // velho), os itens passam como estão — só se descarta o que nem se lê. O teto: a aba velha
    // que gravar carimba a versão velha por cima. Se doer, recusar a escrita nesse caso.
    if (salvo.versao >= versao || !migrar) return salvo.itens as T[];
    const migrados = migrar(salvo.itens, salvo.versao);
    escrever(migrados); // já na versão nova: a migração não roda de novo na próxima carga
    return migrados;
  }

  let itens = ler();

  function gravar(proximos: readonly T[]): void {
    escrever(proximos);
    itens = proximos;
    avisar();
  }

  // Outra aba gravou (o evento não dispara na aba que gravou): relê, para as abas não divergirem.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== null && e.key !== chave) return; // `null`: outra aba limpou o storage inteiro
      itens = ler();
      avisar();
    });
  }

  return {
    listar: () => itens,
    obter: (id) => itens.find((i) => i.id === id),
    salvar: (item) => {
      exigirIds(nome, [item]);
      const posicao = itens.findIndex((x) => x.id === item.id);
      gravar(posicao < 0 ? [...itens, item] : itens.map((x, i) => (i === posicao ? item : x)));
    },
    remover: (id) => {
      if (itens.some((x) => x.id === id)) gravar(itens.filter((x) => x.id !== id));
    },
    substituirTudo: (novos) => {
      exigirIds(nome, novos);
      gravar([...novos]);
    },
    assinar: (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}
