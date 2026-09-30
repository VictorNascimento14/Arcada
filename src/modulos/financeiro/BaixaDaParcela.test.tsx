import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lancamentos } from "@/dados/colecoes";
import { formatarReais, type Lancamento } from "@/dominio";

import BaixaDaParcela from "./BaixaDaParcela";

// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const PARCELA: Lancamento = { id: "l1", pacienteId: "ana", planoId: "pl1", valor: 3_334, vencimento: "2026-10-15" };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  lancamentos.substituirTudo([PARCELA]);
});
afterEach(() => vi.useRealTimers());

const abrir = () => {
  render(<BaixaDaParcela parcela={PARCELA} quem="Ana Exemplo" />);
  fireEvent.click(screen.getByRole("button", { name: "Dar baixa na parcela de 15/10/2026 de Ana Exemplo" }));
};
const dialogo = () => within(screen.getByRole("dialog"));
const escolher = (forma: string, data?: string) => {
  fireEvent.change(dialogo().getByLabelText("Forma de pagamento"), { target: { value: forma } });
  if (data !== undefined) fireEvent.change(dialogo().getByLabelText("Data do pagamento"), { target: { value: data } });
};
const confirmar = () => fireEvent.click(dialogo().getByRole("button", { name: "Dar baixa" }));

describe("baixa da parcela", () => {
  it("mostra o valor e o vencimento da parcela e não pede valor: a baixa é da parcela inteira", () => {
    abrir();
    const modal = dialogo();

    expect(modal.getByText(reais(3_334))).toBeTruthy();
    expect(modal.getByText("15/10/2026")).toBeTruthy();
    expect(modal.getByText("A baixa quita a parcela inteira.")).toBeTruthy();
    expect(modal.getAllByRole("combobox")).toHaveLength(1); // só a forma
    expect(modal.queryByRole("spinbutton")).toBeNull();
    expect(modal.getAllByRole("option").map((o) => o.textContent)).toEqual(["Escolha a forma", "Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"]);
  });

  it("dá baixa com a forma e o dia escolhidos: grava, fecha e mantém o valor", () => {
    abrir();
    escolher("credito", "2026-10-14");
    confirmar();

    expect(lancamentos.obter("l1")).toEqual({ ...PARCELA, pagoEm: "2026-10-14", forma: "credito" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("o dia parte de hoje e o campo não deixa escolher depois dele", () => {
    abrir();
    const data = dialogo().getByLabelText("Data do pagamento") as HTMLInputElement;
    expect([data.value, data.max]).toEqual(["2026-10-15", "2026-10-15"]);

    escolher("pix");
    confirmar();
    expect(lancamentos.obter("l1")).toMatchObject({ pagoEm: "2026-10-15", forma: "pix" });
  });

  it("forma não escolhida, dia vazio ou depois de hoje mostram o erro no campo, mantêm o modal aberto e não gravam", () => {
    abrir();
    confirmar();
    expect(dialogo().getByText("Escolha a forma de pagamento.")).toBeTruthy();

    escolher("pix", "");
    confirmar();
    expect(dialogo().getByText("Informe o dia do pagamento.")).toBeTruthy();

    escolher("pix", "2026-10-16");
    confirmar();
    expect(dialogo().getByText("O pagamento não pode ser depois de hoje.")).toBeTruthy();
    expect(lancamentos.obter("l1")).toEqual(PARCELA);
  });

  it("cancelar fecha o modal sem gravar", () => {
    abrir();
    escolher("pix");
    fireEvent.click(dialogo().getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(lancamentos.obter("l1")).toEqual(PARCELA);
  });
});
