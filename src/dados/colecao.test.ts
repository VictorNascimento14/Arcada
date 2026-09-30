import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { criarColecao, type OpcoesColecao } from "./colecao";

interface Item {
  id: string;
  nome: string;
}

const A: Item = { id: "a", nome: "Item A" };
const B: Item = { id: "b", nome: "Item B" };
const C: Item = { id: "c", nome: "Item C" };

// Cada coleção escuta o evento `storage` da janela até o fim do arquivo: nome único por
// teste impede que a coleção de um teste reaja ao evento disparado em outro.
let contador = 0;
const chaveDe = (nome: string) => `arcada:${nome}`;

/** Nome novo e a chave dele: para semear o storage ANTES de criar a coleção, que lê na criação. */
function nomeNovo() {
  const nome = `teste-${++contador}`;
  return { nome, chave: chaveDe(nome) };
}

function novaColecao(opcoes?: OpcoesColecao<Item>) {
  const { nome, chave } = nomeNovo();
  return { nome, chave, colecao: criarColecao<Item>(nome, opcoes) };
}

/** O que outra aba faria: gravar no storage e deixar o navegador avisar esta. */
function outraAbaGrava(chave: string, itens: Item[]) {
  localStorage.setItem(chave, JSON.stringify({ versao: 1, itens }));
  window.dispatchEvent(new StorageEvent("storage", { key: chave }));
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("CRUD", () => {
  it("nasce vazia", () => {
    const { colecao } = novaColecao();
    expect(colecao.listar()).toEqual([]);
    expect(colecao.obter("a")).toBeUndefined();
  });

  it("salvar insere no fim e obter acha pelo id", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    colecao.salvar(B);
    expect(colecao.listar()).toEqual([A, B]);
    expect(colecao.obter("b")).toEqual(B);
  });

  it("salvar com id que já existe substitui no mesmo lugar", () => {
    const { colecao } = novaColecao();
    colecao.substituirTudo([A, B, C]);
    colecao.salvar({ id: "b", nome: "Item B editado" });
    expect(colecao.listar()).toEqual([A, { id: "b", nome: "Item B editado" }, C]);
  });

  it("remover tira o item; id que não existe é ignorado", () => {
    const { colecao } = novaColecao();
    colecao.substituirTudo([A, B]);
    colecao.remover("a");
    colecao.remover("nao-existe");
    expect(colecao.listar()).toEqual([B]);
  });

  it("substituirTudo troca o conteúdo inteiro e não guarda o array de quem chamou", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    const novos = [B, C];
    colecao.substituirTudo(novos);
    novos.pop();
    expect(colecao.listar()).toEqual([B, C]);
  });

  it("recusa item sem id ou com id repetido, sem mudar nada", () => {
    const { colecao, chave } = novaColecao();
    colecao.salvar(A);
    const gravado = localStorage.getItem(chave);

    expect(() => colecao.salvar({ id: "", nome: "Sem id" })).toThrow(/sem id/);
    expect(() => colecao.substituirTudo([B, B])).toThrow(/id repetido/);
    expect(() => colecao.substituirTudo([{ id: "", nome: "Sem id" }])).toThrow(/sem id/);

    expect(colecao.listar()).toEqual([A]);
    expect(localStorage.getItem(chave)).toBe(gravado);
  });

  it("item que não vira JSON lança antes de mexer no estado", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    const ciclico = { id: "x", nome: "Cíclico" } as Item & { eu?: unknown };
    ciclico.eu = ciclico;

    expect(() => colecao.salvar(ciclico)).toThrow(TypeError);
    expect(colecao.listar()).toEqual([A]);
  });
});

describe("persistência", () => {
  it("grava o envelope { versao, itens } em arcada:<nome>", () => {
    const { colecao, chave } = novaColecao();
    colecao.salvar(A);
    expect(JSON.parse(localStorage.getItem(chave)!)).toEqual({ versao: 1, itens: [A] });
  });

  it("outra instância com o mesmo nome lê o que foi gravado (recarregar a página)", () => {
    const { nome, colecao } = novaColecao();
    colecao.substituirTudo([A, B]);
    colecao.remover("a");

    const depoisDeRecarregar = criarColecao<Item>(nome);
    expect(depoisDeRecarregar.listar()).toEqual([B]);
    expect(depoisDeRecarregar.obter("b")).toEqual(B);
  });

  it.each([
    ["JSON corrompido", "{oops"],
    ["não é objeto", "[1,2]"],
    ["sem itens", '{"versao":1}'],
    ["itens que não é lista", '{"versao":1,"itens":{"a":1}}'],
    ["sem versão", '{"itens":[]}'],
  ])("%s: começa vazia, sem quebrar", (_caso, bruto) => {
    const { nome, chave } = nomeNovo();
    localStorage.setItem(chave, bruto);
    const colecao = criarColecao<Item>(nome);
    expect(colecao.listar()).toEqual([]);
    colecao.salvar(A);
    expect(colecao.listar()).toEqual([A]);
  });
});

describe("versão de esquema", () => {
  it("migra o que foi salvo numa versão menor e regrava na versão nova, uma vez só", () => {
    const { nome, chave } = nomeNovo();
    localStorage.setItem(chave, JSON.stringify({ versao: 1, itens: [{ id: "a", titulo: "Item A" }] }));
    const migrar = vi.fn((antigos: unknown[]) =>
      (antigos as { id: string; titulo: string }[]).map(({ id, titulo }) => ({ id, nome: titulo })),
    );

    const colecao = criarColecao<Item>(nome, { versao: 2, migrar });
    expect(colecao.listar()).toEqual([A]);
    expect(migrar).toHaveBeenCalledExactlyOnceWith([{ id: "a", titulo: "Item A" }], 1);
    expect(JSON.parse(localStorage.getItem(chave)!)).toEqual({ versao: 2, itens: [A] });

    // Já está na versão 2: quem carrega depois não migra de novo.
    criarColecao<Item>(nome, { versao: 2, migrar }).listar();
    expect(migrar).toHaveBeenCalledTimes(1);
  });

  it("sem migrar, dado de versão menor passa como está: nada é descartado", () => {
    const { nome, chave } = nomeNovo();
    localStorage.setItem(chave, JSON.stringify({ versao: 1, itens: [A] }));
    expect(criarColecao<Item>(nome, { versao: 2 }).listar()).toEqual([A]);
  });

  it("dado de versão MAIS NOVA que a do código (aba velha) passa como está, sem migrar", () => {
    const { nome, chave } = nomeNovo();
    localStorage.setItem(chave, JSON.stringify({ versao: 3, itens: [A] }));
    const migrar = vi.fn();
    expect(criarColecao<Item>(nome, { versao: 2, migrar }).listar()).toEqual([A]);
    expect(migrar).not.toHaveBeenCalled();
  });

  it("migração que lança não apaga o que estava salvo", () => {
    const { nome, chave } = nomeNovo();
    const salvo = JSON.stringify({ versao: 1, itens: [A] });
    localStorage.setItem(chave, salvo);

    const criar = () =>
      criarColecao<Item>(nome, {
        versao: 2,
        migrar: () => {
          throw new Error("migração com defeito");
        },
      });

    expect(criar).toThrow("migração com defeito");
    expect(localStorage.getItem(chave)).toBe(salvo);
  });
});

describe("sem localStorage", () => {
  // Cada ambiente hostil devolve o espião: o teste confere que a coleção de fato esbarrou nele.
  const ambientes: [string, () => object][] = [
    [
      "acesso bloqueado (lança SecurityError)",
      () =>
        vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
          throw new DOMException("bloqueado", "SecurityError");
        }),
    ],
    ["ausente", () => vi.spyOn(window, "localStorage", "get").mockReturnValue(undefined as never)],
    [
      "gravação recusada (cota cheia)",
      () =>
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
          throw new DOMException("cheio", "QuotaExceededError");
        }),
    ],
  ];

  it.each(ambientes)("%s: segue em memória, sem quebrar", (_caso, prepara) => {
    const espiao = prepara();
    const { colecao } = novaColecao();
    const avisos = vi.fn();
    colecao.assinar(avisos);

    expect(colecao.listar()).toEqual([]);
    colecao.salvar(A);
    colecao.salvar(B);
    colecao.remover("a");

    expect(espiao).toHaveBeenCalled();
    expect(colecao.listar()).toEqual([B]);
    expect(colecao.obter("b")).toEqual(B);
    expect(avisos).toHaveBeenCalledTimes(3);
  });
});

describe("assinatura e outras abas", () => {
  it("avisa a cada mudança e para de avisar depois de cancelar", () => {
    const { colecao } = novaColecao();
    const avisos = vi.fn();
    const cancelar = colecao.assinar(avisos);

    colecao.salvar(A);
    colecao.remover("a");
    colecao.substituirTudo([B]);
    expect(avisos).toHaveBeenCalledTimes(3);

    cancelar();
    colecao.salvar(C);
    expect(avisos).toHaveBeenCalledTimes(3);
  });

  it("não avisa quando nada mudou (remover de id inexistente, escrita recusada)", () => {
    const { colecao } = novaColecao();
    const avisos = vi.fn();
    colecao.assinar(avisos);

    colecao.remover("nao-existe");
    expect(() => colecao.salvar({ id: "", nome: "Sem id" })).toThrow();
    expect(avisos).not.toHaveBeenCalled();
  });

  it("outra aba grava: relê e avisa", () => {
    const { colecao, chave } = novaColecao();
    colecao.salvar(A);
    const avisos = vi.fn();
    colecao.assinar(avisos);

    outraAbaGrava(chave, [B, C]);

    expect(colecao.listar()).toEqual([B, C]);
    expect(avisos).toHaveBeenCalledTimes(1);
  });

  it("evento de outra chave é ignorado", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    const antes = colecao.listar();
    const avisos = vi.fn();
    colecao.assinar(avisos);

    outraAbaGrava(chaveDe("outra-colecao"), [B]);

    expect(colecao.listar()).toBe(antes);
    expect(avisos).not.toHaveBeenCalled();
  });

  it("outra aba limpa o storage inteiro: a coleção esvazia", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    const avisos = vi.fn();
    colecao.assinar(avisos);

    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    expect(colecao.listar()).toEqual([]);
    expect(avisos).toHaveBeenCalledTimes(1);
  });
});

describe("snapshot estável", () => {
  it("listar devolve o MESMO array enquanto nada é gravado", () => {
    const { colecao } = novaColecao();
    colecao.substituirTudo([A, B]);
    expect(colecao.listar()).toBe(colecao.listar());
  });

  it("vazia também é estável (o [] de antes de qualquer gravação)", () => {
    const { colecao } = novaColecao();
    expect(colecao.listar()).toBe(colecao.listar());
  });

  it("a referência troca a cada gravação, e só nela", () => {
    const { colecao } = novaColecao();
    colecao.salvar(A);
    const depoisDeSalvar = colecao.listar();

    colecao.remover("nao-existe");
    expect(colecao.listar()).toBe(depoisDeSalvar);

    colecao.salvar(B);
    expect(colecao.listar()).not.toBe(depoisDeSalvar);
    expect(depoisDeSalvar).toEqual([A]); // o array antigo não foi mutado
  });

  it("obter devolve o mesmo objeto enquanto o item não muda", () => {
    const { colecao } = novaColecao();
    colecao.substituirTudo([A, B]);
    const b = colecao.obter("b");
    colecao.salvar(C);
    expect(colecao.obter("b")).toBe(b);
  });
});
