import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Backup } from "@/dados/backup";

import CartaoDeBackup from "./CartaoDeBackup";

const envelope = (...ids: string[]) => JSON.stringify({ versao: 1, itens: ids.map((id) => ({ id })) });

const BACKUP: Backup = {
  app: "arcada",
  versao: 1,
  exportadoEm: "2026-09-30T15:00:00.000Z",
  dados: { "arcada:pacientes": envelope("p1"), "arcada:sementes:nucleo": "1" },
};

const recarregar = vi.fn();
const criarUrl = vi.fn(() => "blob:teste");
let baixados: string[];

beforeEach(() => {
  localStorage.clear();
  recarregar.mockClear();
  criarUrl.mockClear();
  baixados = [];
  // O jsdom não navega nem implementa URL.createObjectURL: os dublês registram o que o app pediria ao navegador.
  vi.stubGlobal("location", { ...window.location, reload: recarregar });
  Object.assign(URL, { createObjectURL: criarUrl, revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    baixados.push(this.download);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const escolher = (conteudo: string) =>
  fireEvent.change(screen.getByLabelText("Arquivo de backup"), {
    target: { files: [new File([conteudo], "backup.json", { type: "application/json" })] },
  });

describe("exportar", () => {
  it("baixa um arquivo com o dia no nome e só as chaves arcada:*", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 30, 12)); // meio-dia local: o dia não depende do fuso
    localStorage.setItem("arcada:pacientes", envelope("p1"));
    localStorage.setItem("arcada-tema", "escuro");
    render(<CartaoDeBackup />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar backup" }));

    expect(baixados).toEqual(["arcada-backup-2026-09-30.json"]);
    const arquivo = JSON.parse(await (criarUrl.mock.calls[0] as unknown as [Blob])[0].text());
    expect(arquivo).toMatchObject({ app: "arcada", versao: 1, dados: { "arcada:pacientes": envelope("p1") } });
    expect(Object.keys(arquivo.dados)).toEqual(["arcada:pacientes"]);
  });

  it("avisa que o arquivo tem dado de saúde e, sem nada salvo, não baixa arquivo vazio", () => {
    render(<CartaoDeBackup />);
    expect(screen.getByRole("note").textContent).toMatch(/dado de saúde.*lugar seguro/);

    fireEvent.click(screen.getByRole("button", { name: "Exportar backup" }));

    expect(screen.getByRole("alert").textContent).toMatch(/Não há dados/);
    expect(baixados).toEqual([]);
  });
});

describe("importar", () => {
  it("pede confirmação antes de mexer em qualquer coisa; cancelar deixa tudo como estava", async () => {
    localStorage.setItem("arcada:antigo", envelope("a"));
    render(<CartaoDeBackup />);

    escolher(JSON.stringify(BACKUP));
    const dialogo = await screen.findByRole("dialog", { name: "Substituir os dados atuais?" });
    expect(dialogo.textContent).toMatch(/não pode ser desfeito/);
    expect(localStorage.getItem("arcada:antigo")).toBe(envelope("a"));

    fireEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem("arcada:antigo")).toBe(envelope("a"));
    expect(recarregar).not.toHaveBeenCalled();
  });

  it("ao confirmar, troca os dados pelos do arquivo e recarrega a página", async () => {
    localStorage.setItem("arcada:antigo", envelope("a"));
    localStorage.setItem("arcada-tema", "escuro");
    render(<CartaoDeBackup />);

    escolher(JSON.stringify(BACKUP));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Substituir os dados" }));

    expect(Object.fromEntries(Object.entries(localStorage))).toEqual({ ...BACKUP.dados, "arcada-tema": "escuro" });
    expect(recarregar).toHaveBeenCalledOnce();
  });

  it("recusa o arquivo que não é backup, com o motivo, sem abrir a confirmação nem alterar nada", async () => {
    localStorage.setItem("arcada:antigo", envelope("a"));
    render(<CartaoDeBackup />);

    escolher(JSON.stringify({ app: "outro" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/não é um backup do Arcada/);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem("arcada:antigo")).toBe(envelope("a"));
  });

  it("se o navegador não consegue gravar, mostra o erro, mantém os dados e não recarrega", async () => {
    localStorage.setItem("arcada:antigo", envelope("a"));
    render(<CartaoDeBackup />);
    escolher(JSON.stringify(BACKUP));
    const dialogo = await screen.findByRole("dialog");
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, chave: string, valor: string) {
      if (chave === "arcada:sementes:nucleo") throw new DOMException("cheio", "QuotaExceededError");
      original.call(this, chave, valor);
    });

    fireEvent.click(within(dialogo).getByRole("button", { name: "Substituir os dados" }));

    expect(screen.getByRole("alert").textContent).toMatch(/Não foi possível gravar/);
    expect(localStorage.getItem("arcada:antigo")).toBe(envelope("a"));
    expect(recarregar).not.toHaveBeenCalled();
  });
});
