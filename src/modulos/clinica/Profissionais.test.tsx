import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { profissionais } from "@/dados/colecoes";
import type { Profissional } from "@/dominio";

import Profissionais from "./Profissionais";

const DRA: Profissional = { id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", especialidade: "Endodontia", cor: "#1f6f5b" };
const DR_INATIVO: Profissional = { id: "p2", nome: "Dr. Antigo", cro: "CRO-SP 00001", cor: "#4a6fa5", ativo: false };

const abrirNovo = () => fireEvent.click(screen.getByRole("button", { name: /novo profissional/i }));
const dialogo = () => screen.getByRole("dialog");
const digitar = (rotulo: string, valor: string) => fireEvent.change(within(dialogo()).getByLabelText(rotulo), { target: { value: valor } });
const salvar = () => fireEvent.click(within(dialogo()).getByRole("button", { name: "Salvar" }));

beforeEach(() => {
  localStorage.clear();
  profissionais.substituirTudo([DR_INATIVO, DRA]);
});

describe("Profissionais", () => {
  it("lista com CRO, especialidade e cor, ativos primeiro, e marca o inativo", () => {
    render(<Profissionais />);

    const [primeiro, segundo] = screen.getAllByRole("listitem");
    expect(primeiro.textContent).toContain("Dra. Exemplo");
    expect(primeiro.textContent).toContain("CRO-SP 00000 · Endodontia");
    expect(primeiro.textContent).not.toContain("Inativo");
    expect((primeiro.querySelector("[style]") as HTMLElement).style.backgroundColor).toBe("rgb(31, 111, 91)");
    expect(segundo.textContent).toContain("Dr. Antigo");
    expect(segundo.textContent).toContain("Inativo");
  });

  it("cadastra: o CRO digitado solto sai no formato e a cor escolhida vai no style", () => {
    render(<Profissionais />);

    abrirNovo();
    digitar("Nome", "Dra. Nova");
    digitar("Registro no CRO", "cro sp 123");
    fireEvent.click(within(dialogo()).getByRole("radio", { name: "Roxo" }));
    salvar();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(profissionais.listar().find((p) => p.nome === "Dra. Nova")).toMatchObject({ cro: "CRO-SP 123", cor: "#7a5299", ativo: true });
    const linha = screen.getAllByRole("listitem").find((li) => li.textContent?.includes("Dra. Nova"))!;
    expect(linha.textContent).toContain("CRO-SP 123");
    expect((linha.querySelector("[style]") as HTMLElement).style.backgroundColor).toBe("rgb(122, 82, 153)");
  });

  it("CRO fora do formato: mostra o erro, mantém o modal aberto e não grava", () => {
    render(<Profissionais />);

    abrirNovo();
    digitar("Nome", "Dra. Nova");
    digitar("Registro no CRO", "12345");
    salvar();

    expect(within(dialogo()).getByText(/use o formato CRO-SP 00000/i)).toBeTruthy();
    expect(within(dialogo()).getByLabelText("Registro no CRO").getAttribute("aria-invalid")).toBe("true");
    expect(profissionais.listar()).toHaveLength(2);
  });

  it("edita e desativa: continua na lista, marcado como inativo, com o mesmo id", () => {
    render(<Profissionais />);

    fireEvent.click(screen.getByRole("button", { name: "Editar Dra. Exemplo" }));
    expect(within(dialogo()).getByRole("heading", { name: "Editar profissional" })).toBeTruthy();
    expect((within(dialogo()).getByLabelText("Nome") as HTMLInputElement).value).toBe("Dra. Exemplo");
    expect((within(dialogo()).getByRole("radio", { name: "Verde" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(within(dialogo()).getByLabelText(/profissional ativo/i));
    salvar();

    expect(profissionais.listar()).toHaveLength(2);
    expect(profissionais.obter("p1")).toMatchObject({ nome: "Dra. Exemplo", especialidade: "Endodontia", ativo: false });
    const linha = screen.getAllByRole("listitem").find((li) => li.textContent?.includes("Dra. Exemplo"))!;
    expect(linha.textContent).toContain("Inativo");
  });

  it("cancelar fecha sem gravar", () => {
    render(<Profissionais />);

    abrirNovo();
    digitar("Nome", "Dra. Nova");
    fireEvent.click(within(dialogo()).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(profissionais.listar()).toHaveLength(2);
  });
});
