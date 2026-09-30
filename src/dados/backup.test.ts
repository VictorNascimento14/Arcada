import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportarBackup, lerBackup, substituirPor, VERSAO_DO_BACKUP, type Backup } from "./backup";
import { criarColecao } from "./colecao";

const envelope = (...ids: string[]) => JSON.stringify({ versao: 1, itens: ids.map((id) => ({ id })) });

/** Tudo o que há no `localStorage`, chave → valor. */
const foto = () =>
  Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!).map((k) => [k, localStorage.getItem(k)]));

const valido = (): Backup => ({
  app: "arcada",
  versao: 1,
  exportadoEm: "2026-09-30T15:00:00.000Z",
  dados: { "arcada:pacientes": envelope("p1"), "arcada:sementes:nucleo": "1" },
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("exportarBackup", () => {
  it("leva as chaves arcada:* — coleções e marcas de semente — e deixa de fora o kit e outros apps", () => {
    localStorage.setItem("arcada:pacientes", envelope("p1"));
    localStorage.setItem("arcada:sementes:nucleo", "1");
    localStorage.setItem("arcada-tema", "escuro");
    localStorage.setItem("arcada-sidebar-collapsed", "1");
    localStorage.setItem("outro-app:x", "y");

    expect(exportarBackup(new Date("2026-09-30T15:00:00Z"))).toEqual(valido());
  });

  it("leva o que uma coleção de verdade grava: o prefixo é o mesmo do repositório", () => {
    criarColecao<{ id: string }>("backup-teste").salvar({ id: "a" });

    expect(Object.keys(exportarBackup().dados)).toEqual(["arcada:backup-teste"]);
  });

  it("com o armazenamento bloqueado, exporta vazio em vez de lançar", () => {
    vi.spyOn(globalThis, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("bloqueado", "SecurityError");
    });

    expect(exportarBackup().dados).toEqual({});
    expect(substituirPor(valido())).toMatch(/bloqueou o armazenamento/);
  });
});

describe("lerBackup", () => {
  it("aceita o que exportarBackup gera depois de ir e voltar por texto", () => {
    localStorage.setItem("arcada:pacientes", envelope("p1", "p2"));
    localStorage.setItem("arcada:sementes:nucleo", "1");
    const exportado = exportarBackup();

    expect(lerBackup(JSON.stringify(exportado))).toEqual({ backup: exportado });
  });

  const casos: [string, unknown, RegExp][] = [
    ["texto que não é JSON", "isto não é json", /JSON válido/],
    ["JSON de outro app", { ...valido(), app: "outro" }, /não é um backup do Arcada/],
    ["JSON que nem é objeto", [1, 2], /não é um backup do Arcada/],
    ["sem versão", { ...valido(), versao: undefined }, /fora do formato/],
    ["versão zero", { ...valido(), versao: 0 }, /fora do formato/],
    ["versão quebrada", { ...valido(), versao: 1.5 }, /fora do formato/],
    ["versão mais nova que a do app", { ...valido(), versao: VERSAO_DO_BACKUP + 1 }, /versão mais nova/],
    ["sem a data da exportação", { ...valido(), exportadoEm: undefined }, /fora do formato/],
    ["data da exportação que não é data", { ...valido(), exportadoEm: "ontem" }, /fora do formato/],
    ["dados que não é objeto", { ...valido(), dados: [] }, /fora do formato/],
    ["chave de fora do Arcada (o tema do kit)", { ...valido(), dados: { "arcada-tema": "escuro" } }, /fora do formato/],
    ["valor que não é texto", { ...valido(), dados: { "arcada:pacientes": [] } }, /fora do formato/],
    ["coleção que não é JSON", { ...valido(), dados: { "arcada:pacientes": "{quebrado" } }, /fora do formato/],
    ["coleção sem itens", { ...valido(), dados: { "arcada:pacientes": JSON.stringify({ versao: 1 }) } }, /fora do formato/],
    [
      "item sem id",
      { ...valido(), dados: { "arcada:pacientes": JSON.stringify({ versao: 1, itens: [{ nome: "sem id" }] }) } },
      /fora do formato/,
    ],
  ];

  it.each(casos)("recusa %s, com o motivo e sem tocar no armazenamento", (_nome, conteudo, motivo) => {
    localStorage.setItem("arcada:pacientes", envelope("antes"));

    const leitura = lerBackup(typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo));

    expect("erro" in leitura && leitura.erro).toMatch(motivo);
    expect(foto()).toEqual({ "arcada:pacientes": envelope("antes") });
  });
});

describe("substituirPor", () => {
  it("troca as chaves do Arcada pelas do backup e não toca no resto do armazenamento", () => {
    localStorage.setItem("arcada:antigo", envelope("a"));
    localStorage.setItem("arcada:sementes:velha", "1");
    localStorage.setItem("arcada-tema", "escuro");
    localStorage.setItem("outro-app:x", "y");

    expect(substituirPor(valido())).toBeUndefined();

    expect(foto()).toEqual({ ...valido().dados, "arcada-tema": "escuro", "outro-app:x": "y" });
  });

  it("se a gravação falha no meio, devolve o erro e restaura o que havia", () => {
    localStorage.setItem("arcada:antigo", envelope("a"));
    localStorage.setItem("arcada-tema", "escuro");
    const antes = foto();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, chave: string, valor: string) {
      if (chave === "arcada:sementes:nucleo") throw new DOMException("cheio", "QuotaExceededError"); // a 2ª chave do backup
      original.call(this, chave, valor);
    });

    expect(substituirPor(valido())).toMatch(/Não foi possível gravar/);

    expect(foto()).toEqual(antes);
  });
});
