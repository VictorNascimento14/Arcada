import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ItemPlano, PlanoTratamento } from "@/dominio";

import ProgressoDoPlano from "./ProgressoDoPlano";

const item = (id: string, feito: boolean): ItemPlano => ({ id, procedimentoId: "p1", preco: 10_000, ...(feito ? { realizadoEm: "2026-09-30" } : {}) });
const plano = (...itens: ItemPlano[]): PlanoTratamento => ({ id: "pl1", pacienteId: "pac1", itens, desconto: 0, situacao: "em-andamento" });

describe("ProgressoDoPlano", () => {
  it("mostra a barra com o rótulo acessível e o número ao lado", () => {
    render(<ProgressoDoPlano plano={plano(item("a", true), item("b", true), item("c", false))} />);

    const barra = screen.getByRole("progressbar", { name: "Progresso do tratamento: 2 de 3 itens realizados" });
    expect(barra.getAttribute("aria-valuenow")).toBe("67");
    expect(screen.getByText("2 de 3 realizados")).toBeTruthy();
  });

  it("no singular quando o plano tem um item só", () => {
    render(<ProgressoDoPlano plano={plano(item("a", false))} />);

    expect(screen.getByRole("progressbar", { name: "Progresso do tratamento: 0 de 1 item realizado" }).getAttribute("aria-valuenow")).toBe("0");
    expect(screen.getByText("0 de 1 realizado")).toBeTruthy();
  });

  it("plano concluído por inteiro marca 100%", () => {
    render(<ProgressoDoPlano plano={plano(item("a", true), item("b", true))} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });

  it("plano sem itens não desenha nada", () => {
    const { container } = render(<ProgressoDoPlano plano={plano()} />);
    expect(container.firstChild).toBeNull();
  });
});
