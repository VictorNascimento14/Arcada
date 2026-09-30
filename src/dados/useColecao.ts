import { useSyncExternalStore } from "react";

import type { Colecao } from "./colecao";

/**
 * Os itens da coleção, reativos. O snapshot é o próprio array da coleção: só troca quando
 * algo é gravado. Se `listar` devolvesse um array novo a cada chamada, o
 * `useSyncExternalStore` veria mudança em todo render e entraria em laço. Por isso filtro
 * e ordenação se derivam na tela, com `useMemo` — nunca aqui.
 */
export function useColecao<T extends { id: string }>(colecao: Colecao<T>): readonly T[] {
  return useSyncExternalStore(colecao.assinar, colecao.listar);
}
