import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Clinica } from "@/dominio";

import Convenios from "./Convenios";

const EXPEDIENTE: Clinica["expediente"] = { 0: [], 1: [{ inicio: "08:00", fim: "12:00" }], 2: [], 3: [], 4: [], 5: [], 6: [] };
const CLINICA: Clinica = { id: CLINICA_ID, nome: "Clínica Exemplo", expediente: EXPEDIENTE };

const campo = () => screen.getByLabelText("Nome do convênio") as HTMLInputElement;
const digitar = (valor: string) => fireEvent.change(campo(), { target: { value: valor } });
const adicionar = () => fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
const nomes = () => screen.queryAllByRole("listitem").map((li) => li.textContent);

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([{ ...CLINICA, convenios: ["Plano Alfa", "Saúde Beta"] }]);
});

describe("Convenios", () => {
  it("lista os convênios cadastrados; sem nenhum, avisa", () => {
    const { unmount } = render(<Convenios />);
    expect(nomes()).toEqual(["Plano AlfaRemover", "Saúde BetaRemover"]);
    unmount();

    clinica.substituirTudo([CLINICA]); // registro sem o campo
    render(<Convenios />);
    expect(nomes()).toEqual([]);
    expect(screen.getByText("Nenhum convênio cadastrado ainda.")).toBeTruthy();
  });

  it("adiciona pelo botão e pelo Enter: aparece na lista, em ordem, e o campo esvazia", () => {
    render(<Convenios />);

    digitar("  Ágil Saúde ");
    adicionar();

    expect(nomes()).toEqual(["Ágil SaúdeRemover", "Plano AlfaRemover", "Saúde BetaRemover"]);
    expect(clinica.obter(CLINICA_ID)!.convenios).toEqual(["Ágil Saúde", "Plano Alfa", "Saúde Beta"]);
    expect(campo().value).toBe("");

    digitar("Convênio Exemplo");
    fireEvent.submit(campo().closest("form")!); // Enter no campo
    expect(nomes()).toContain("Convênio ExemploRemover");
  });

  it("nome vazio ou repetido mostra o erro no campo, mantém o que foi digitado e não grava", () => {
    render(<Convenios />);

    adicionar();
    expect(screen.getByText("Informe o nome do convênio.")).toBeTruthy();
    expect(campo().getAttribute("aria-invalid")).toBe("true");

    digitar("plano alfa");
    adicionar();
    expect(screen.getByText("Este convênio já está na lista.")).toBeTruthy();
    expect(campo().value).toBe("plano alfa");
    expect(clinica.obter(CLINICA_ID)!.convenios).toEqual(["Plano Alfa", "Saúde Beta"]);
  });

  it("remove pelo botão do nome e deixa os outros", () => {
    render(<Convenios />);

    fireEvent.click(screen.getByRole("button", { name: "Remover Plano Alfa" }));

    expect(nomes()).toEqual(["Saúde BetaRemover"]);
    expect(clinica.obter(CLINICA_ID)!.convenios).toEqual(["Saúde Beta"]);
  });
});
