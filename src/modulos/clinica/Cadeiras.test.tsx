import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { cadeiras } from "@/dados/colecoes";
import type { Cadeira } from "@/dominio";

import Cadeiras from "./Cadeiras";

const C10: Cadeira = { id: "c10", nome: "Cadeira 10" };
const C2: Cadeira = { id: "c2", nome: "Cadeira 2" };
const RESERVA: Cadeira = { id: "c0", nome: "Cadeira reserva", ativa: false };

const dialogo = () => screen.getByRole("dialog");
const salvar = () => fireEvent.click(within(dialogo()).getByRole("button", { name: "Salvar" }));
const linhas = () => screen.getAllByRole("listitem");

beforeEach(() => {
  localStorage.clear();
  cadeiras.substituirTudo([RESERVA, C10, C2]);
});

describe("Cadeiras", () => {
  it("lista as ativas primeiro, com o número por valor, e marca a inativa", () => {
    render(<Cadeiras />);

    expect(linhas().map((li) => li.textContent)).toEqual([
      "Cadeira 2Editar",
      "Cadeira 10Editar",
      "Cadeira reservaInativaEditar",
    ]);
  });

  it("cadastra uma cadeira nova, ativa, e ela aparece na lista", () => {
    render(<Cadeiras />);

    fireEvent.click(screen.getByRole("button", { name: /nova cadeira/i }));
    fireEvent.change(within(dialogo()).getByLabelText("Nome"), { target: { value: "  Sala 3 " } });
    salvar();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cadeiras.listar().find((c) => c.nome === "Sala 3")).toMatchObject({ ativa: true });
    expect(linhas().some((li) => li.textContent?.startsWith("Sala 3"))).toBe(true);
  });

  it("sem nome, mostra o erro, mantém o modal aberto e não grava", () => {
    render(<Cadeiras />);

    fireEvent.click(screen.getByRole("button", { name: /nova cadeira/i }));
    salvar();

    expect(within(dialogo()).getByText("Informe o nome da cadeira.")).toBeTruthy();
    expect(within(dialogo()).getByLabelText("Nome").getAttribute("aria-invalid")).toBe("true");
    expect(cadeiras.listar()).toHaveLength(3);
  });

  it("edita e desativa: continua na lista, marcada como inativa, com o mesmo id", () => {
    render(<Cadeiras />);

    fireEvent.click(screen.getByRole("button", { name: "Editar Cadeira 2" }));
    expect(within(dialogo()).getByRole("heading", { name: "Editar cadeira" })).toBeTruthy();
    expect((within(dialogo()).getByLabelText("Nome") as HTMLInputElement).value).toBe("Cadeira 2");
    fireEvent.click(within(dialogo()).getByLabelText(/cadeira ativa/i));
    salvar();

    expect(cadeiras.listar()).toHaveLength(3);
    expect(cadeiras.obter("c2")).toEqual({ id: "c2", nome: "Cadeira 2", ativa: false });
    expect(linhas().find((li) => li.textContent?.startsWith("Cadeira 2"))?.textContent).toContain("Inativa");
  });

  it("reativa uma cadeira inativa", () => {
    render(<Cadeiras />);

    fireEvent.click(screen.getByRole("button", { name: "Editar Cadeira reserva" }));
    expect((within(dialogo()).getByLabelText(/cadeira ativa/i) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(within(dialogo()).getByLabelText(/cadeira ativa/i));
    salvar();

    expect(cadeiras.obter("c0")?.ativa).toBe(true);
  });
});
