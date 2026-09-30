import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { procedimentos } from "@/dados/colecoes";
import type { Procedimento } from "@/dominio";

import EditorDeProcedimento from "./EditorDeProcedimento";

const EXISTENTE: Procedimento = {
  id: "p1",
  codigo: "DEN-01",
  nome: "Restauração em resina composta",
  especialidade: "Dentística",
  preco: 123456,
  duracaoMin: 50,
  exigeDente: true,
  exigeFace: true,
  condicaoResultante: "restauracao",
  ativo: true,
};

const aoFechar = vi.fn();

const dialogo = () => screen.getByRole("dialog");
const campo = (nome: string | RegExp) => within(dialogo()).getByLabelText(nome) as HTMLInputElement;
const digitar = (nome: string | RegExp, valor: string) => fireEvent.change(campo(nome), { target: { value: valor } });
const salvar = () => fireEvent.click(within(dialogo()).getByRole("button", { name: "Salvar" }));

beforeEach(() => {
  localStorage.clear();
  aoFechar.mockClear();
  procedimentos.substituirTudo([EXISTENTE]);
});

describe("cadastro de procedimento", () => {
  it("cadastra um novo: o preço em reais vira centavos, o procedimento entra ativo e o modal fecha", () => {
    render(<EditorDeProcedimento aoFechar={aoFechar} />);

    expect(within(dialogo()).getByRole("heading", { name: "Novo procedimento" })).toBeTruthy();
    digitar("Nome", "  Consulta de retorno ");
    digitar("Especialidade", "Prevenção");
    digitar("Código (opcional)", "PRE-09");
    digitar("Preço (R$)", "1.234,56");
    digitar("Duração (minutos)", "45");
    fireEvent.click(campo(/exige dente/i));
    salvar();

    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(procedimentos.listar()).toHaveLength(2);
    expect(procedimentos.listar().find((p) => p.codigo === "PRE-09")).toMatchObject({
      nome: "Consulta de retorno",
      especialidade: "Prevenção",
      preco: 123456,
      duracaoMin: 45,
      exigeDente: true,
      exigeFace: false,
      ativo: true,
    });
  });

  it("sem nada preenchido mostra o erro de cada campo, mantém o modal aberto e não grava", () => {
    render(<EditorDeProcedimento aoFechar={aoFechar} />);

    salvar();

    for (const erro of [
      "Informe o nome do procedimento.",
      "Escolha a especialidade.",
      "Informe o preço em reais, como 180,00.",
      "Informe a duração em minutos, de 1 a 480.",
    ]) {
      expect(within(dialogo()).getByText(erro)).toBeTruthy();
    }
    expect(campo("Nome").getAttribute("aria-invalid")).toBe("true");
    expect(aoFechar).not.toHaveBeenCalled();
    expect(procedimentos.listar()).toEqual([EXISTENTE]);
  });

  it("preço fora do padrão brasileiro (três casas decimais) não grava", () => {
    render(<EditorDeProcedimento aoFechar={aoFechar} />);

    digitar("Nome", "Consulta de retorno");
    digitar("Especialidade", "Prevenção");
    digitar("Preço (R$)", "12,345");
    digitar("Duração (minutos)", "30");
    salvar();

    expect(within(dialogo()).getByText("Informe o preço em reais, como 180,00.")).toBeTruthy();
    expect(aoFechar).not.toHaveBeenCalled();
    expect(procedimentos.listar()).toEqual([EXISTENTE]);
  });

  it("edita no lugar: abre com os valores, o preço como se digita, e mantém o que o formulário não edita", () => {
    const inativo = { ...EXISTENTE, ativo: false };
    procedimentos.substituirTudo([inativo]);
    render(<EditorDeProcedimento procedimento={inativo} aoFechar={aoFechar} />);

    expect(within(dialogo()).getByRole("heading", { name: "Editar procedimento" })).toBeTruthy();
    expect(campo("Nome").value).toBe("Restauração em resina composta");
    expect(campo("Código (opcional)").value).toBe("DEN-01");
    expect(campo("Especialidade").value).toBe("Dentística");
    expect(campo("Preço (R$)").value).toBe("1.234,56");
    expect(campo("Duração (minutos)").value).toBe("50");
    expect(campo(/exige dente/i).checked).toBe(true);
    expect(campo(/exige face/i).checked).toBe(true);

    digitar("Preço (R$)", "1.300");
    salvar();

    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(procedimentos.listar()).toEqual([{ ...inativo, preco: 130000 }]); // `ativo` e a condição resultante seguem como estavam
  });

  it("desativa: «Procedimento ativo» abre marcado no ativo, e desmarcar e salvar o deixa inativo, sem tocar no resto", () => {
    render(<EditorDeProcedimento procedimento={EXISTENTE} aoFechar={aoFechar} />);

    expect(campo(/procedimento ativo/i).checked).toBe(true);
    fireEvent.click(campo(/procedimento ativo/i));
    salvar();

    expect(procedimentos.listar()).toEqual([{ ...EXISTENTE, ativo: false }]);
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("reativa: o inativo abre desmarcado, e marcar e salvar o volta às escolhas", () => {
    const inativo = { ...EXISTENTE, ativo: false };
    procedimentos.substituirTudo([inativo]);
    render(<EditorDeProcedimento procedimento={inativo} aoFechar={aoFechar} />);

    expect(campo(/procedimento ativo/i).checked).toBe(false);
    fireEvent.click(campo(/procedimento ativo/i));
    salvar();

    expect(procedimentos.listar()).toEqual([EXISTENTE]);
  });

  it("a face só se marca com o dente: sem ele fica desabilitada, e desmarcar o dente desmarca a face", () => {
    render(<EditorDeProcedimento aoFechar={aoFechar} />);

    expect(campo(/exige face/i).disabled).toBe(true);
    fireEvent.click(campo(/exige dente/i));
    expect(campo(/exige face/i).disabled).toBe(false);
    fireEvent.click(campo(/exige face/i));
    expect(campo(/exige face/i).checked).toBe(true);

    fireEvent.click(campo(/exige dente/i));

    expect(campo(/exige face/i).checked).toBe(false);
    expect(campo(/exige face/i).disabled).toBe(true);
  });

  it("oferece as oito especialidades do catálogo e as de fora que a tabela já tem", () => {
    procedimentos.substituirTudo([EXISTENTE, { ...EXISTENTE, id: "p9", codigo: "OUT-01", especialidade: "Odontopediatria" }]);
    render(<EditorDeProcedimento aoFechar={aoFechar} />);

    expect(within(campo("Especialidade")).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Escolha…",
      "Prevenção",
      "Dentística",
      "Endodontia",
      "Periodontia",
      "Cirurgia",
      "Prótese",
      "Implantodontia",
      "Ortodontia",
      "Odontopediatria",
    ]);
  });

  it("Cancelar fecha sem gravar", () => {
    render(<EditorDeProcedimento aoFechar={aoFechar} />);

    digitar("Nome", "Rascunho");
    fireEvent.click(within(dialogo()).getByRole("button", { name: "Cancelar" }));

    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(procedimentos.listar()).toEqual([EXISTENTE]);
  });
});
