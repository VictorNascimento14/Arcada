import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Clinica } from "@/dominio";

import DadosDaClinica from "./DadosDaClinica";

const EXPEDIENTE: Clinica["expediente"] = { 0: [], 1: [{ inicio: "08:00", fim: "12:00" }], 2: [], 3: [], 4: [], 5: [], 6: [] };

const campo = (rotulo: string) => screen.getByLabelText(rotulo) as HTMLInputElement | HTMLSelectElement;
const digitar = (rotulo: string, valor: string) => fireEvent.change(campo(rotulo), { target: { value: valor } });
const salvar = () => fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([{ id: CLINICA_ID, nome: "Clínica Exemplo", cidade: "Cidade Exemplo", uf: "MG", expediente: EXPEDIENTE }]);
});

describe("DadosDaClinica", () => {
  it("abre com o que está salvo", () => {
    render(<DadosDaClinica />);

    expect(campo("Nome da clínica").value).toBe("Clínica Exemplo");
    expect(campo("Cidade").value).toBe("Cidade Exemplo");
    expect(campo("UF").value).toBe("MG");
    expect(campo("Telefone").value).toBe("");
  });

  it("salva o que foi digitado, aparado, sem tocar no expediente", () => {
    render(<DadosDaClinica />);

    digitar("Nome da clínica", "  Clínica Boa  ");
    digitar("Telefone", "(00) 3000-0000");
    digitar("Endereço", "Rua Exemplo, 100");
    digitar("UF", "SP");
    salvar();

    expect(clinica.obter(CLINICA_ID)).toMatchObject({
      nome: "Clínica Boa",
      telefone: "(00) 3000-0000",
      endereco: "Rua Exemplo, 100",
      cidade: "Cidade Exemplo",
      uf: "SP",
      expediente: EXPEDIENTE,
    });
    expect(campo("Nome da clínica").value).toBe("Clínica Boa"); // o campo mostra o que ficou salvo
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sem nome, mostra o erro no campo, avisa e não grava", () => {
    render(<DadosDaClinica />);

    digitar("Nome da clínica", "   ");
    salvar();

    expect(screen.getByText("Informe o nome da clínica.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Revise");
    expect(campo("Nome da clínica").getAttribute("aria-invalid")).toBe("true");
    expect(clinica.obter(CLINICA_ID)!.nome).toBe("Clínica Exemplo");
  });
});
