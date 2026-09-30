import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { criarColecao, type Colecao } from "./colecao";
import { useColecao } from "./useColecao";

interface Item {
  id: string;
  nome: string;
}

const A: Item = { id: "a", nome: "Item A" };
const B: Item = { id: "b", nome: "Item B" };

let contador = 0;
function novaColecao() {
  const nome = `hook-${++contador}`;
  return { chave: `arcada:${nome}`, colecao: criarColecao<Item>(nome) };
}

beforeEach(() => localStorage.clear());

describe("useColecao", () => {
  it("devolve os itens e a MESMA referência entre renders: sem laço", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    let renders = 0;
    const { result, rerender } = renderHook(() => {
      renders++;
      return useColecao(colecao);
    });
    const primeira = result.current;

    rerender();
    rerender();

    expect(primeira).toEqual([A]);
    expect(result.current).toBe(primeira);
    expect(renders).toBe(3); // o render inicial e os dois `rerender`, nenhum a mais
  });

  it("re-renderiza com um array novo quando algo é gravado", () => {
    const { colecao } = novaColecao();
    const { result } = renderHook(() => useColecao(colecao));
    const vazia = result.current;

    act(() => colecao.salvar(A));
    expect(result.current).toEqual([A]);
    expect(result.current).not.toBe(vazia);

    act(() => colecao.remover("a"));
    expect(result.current).toEqual([]);
  });

  it("acompanha o que outra aba gravou", () => {
    const { chave, colecao } = novaColecao();
    const { result } = renderHook(() => useColecao(colecao));

    act(() => {
      localStorage.setItem(chave, JSON.stringify({ versao: 1, itens: [B] }));
      window.dispatchEvent(new StorageEvent("storage", { key: chave }));
    });

    expect(result.current).toEqual([B]);
  });

  it("assina uma vez, mesmo com vários renders, e cancela ao desmontar", () => {
    const real = novaColecao().colecao;
    let assinaturas = 0;
    let cancelamentos = 0;
    const colecao: Colecao<Item> = {
      ...real,
      assinar: (ouvinte) => {
        assinaturas++;
        const cancelar = real.assinar(ouvinte);
        return () => {
          cancelamentos++;
          cancelar();
        };
      },
    };

    const { rerender, unmount } = renderHook(() => useColecao(colecao));
    rerender();
    act(() => colecao.salvar(A));
    rerender();
    expect(assinaturas).toBe(1);
    expect(cancelamentos).toBe(0);

    unmount();
    expect(cancelamentos).toBe(1);
  });
});
