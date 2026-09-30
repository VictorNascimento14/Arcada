import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lancamentos, pacientes } from "@/dados/colecoes";
import { formatarReais, type Lancamento, type Paciente } from "@/dominio";

import ContasAReceber from "./ContasAReceber";

// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const parcela = (id: string, pacienteId: string, valor: number, vencimento: string, extra: Partial<Lancamento> = {}): Lancamento => ({
  id,
  pacienteId,
  planoId: "pl1",
  valor,
  vencimento,
  ...extra,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 15, 23, 30)); // 15/10, de noite: em UTC já seria dia 16, e `diaISO` é o dia local
  pacientes.substituirTudo([paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo")]);
  lancamentos.substituirTudo([]);
});
afterEach(() => vi.useRealTimers());

describe("contas a receber", () => {
  it("lista as parcelas com paciente, vencimento, situação de hoje e valor: em aberto primeiro, pagas no fim", () => {
    lancamentos.substituirTudo([
      parcela("paga", "ana", 5_000, "2026-09-10", { pagoEm: "2026-09-09", forma: "pix" }),
      parcela("futura", "ana", 3_000, "2026-11-15"),
      parcela("hoje", "bruno", 2_000, "2026-10-15"),
      parcela("atrasada", "bruno", 1_000, "2026-10-01"),
    ]);
    render(<ContasAReceber />);

    const linhas = screen.getAllByRole("listitem");
    const esperado = [
      ["Bruno Exemplo", "Vencimento em 01/10/2026", "Vencida", reais(1_000)],
      ["Bruno Exemplo", "Vencimento em 15/10/2026", "Vence hoje", reais(2_000)],
      ["Ana Exemplo", "Vencimento em 15/11/2026", "A vencer", reais(3_000)],
      ["Ana Exemplo", "Vencimento em 10/09/2026 · pago em 09/09/2026 · Pix", "Paga", reais(5_000)],
    ];
    expect(linhas).toHaveLength(esperado.length);
    linhas.forEach((linha, i) => {
      for (const texto of esperado[i]) expect(within(linha).getByText(texto)).toBeTruthy();
    });
    expect(screen.getAllByRole("button", { name: /^Dar baixa/ })).toHaveLength(3); // a paga não tem o botão
  });

  it("dar baixa leva a parcela para o fim como paga, com o dia e a forma, e o resumo deixa de contá-la", () => {
    lancamentos.substituirTudo([parcela("a", "ana", 3_000, "2026-10-20"), parcela("b", "bruno", 2_000, "2026-11-20")]);
    render(<ContasAReceber />);

    fireEvent.click(screen.getByRole("button", { name: "Dar baixa na parcela de 20/10/2026 de Ana Exemplo" }));
    const dialogo = within(screen.getByRole("dialog"));
    fireEvent.change(dialogo.getByLabelText("Forma de pagamento"), { target: { value: "pix" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Dar baixa" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    const [aberta, paga] = screen.getAllByRole("listitem");
    expect(within(aberta).getByText("Bruno Exemplo")).toBeTruthy();
    for (const texto of ["Ana Exemplo", "Vencimento em 20/10/2026 · pago em 15/10/2026 · Pix", "Paga"]) expect(within(paga).getByText(texto)).toBeTruthy();
    expect(within(paga).queryByRole("button")).toBeNull();
    expect(screen.getByText(`1 parcela em aberto, somando ${reais(2_000)}`)).toBeTruthy();
  });

  it("resume quantas parcelas estão em aberto e quanto somam, sem contar as pagas", () => {
    lancamentos.substituirTudo([
      parcela("a", "ana", 3_000, "2026-11-15"),
      parcela("b", "bruno", 2_000, "2026-10-01"),
      parcela("c", "ana", 9_000, "2026-09-10", { pagoEm: "2026-09-09", forma: "dinheiro" }),
    ]);
    render(<ContasAReceber />);
    expect(screen.getByText(`2 parcelas em aberto, somando ${reais(5_000)}`)).toBeTruthy();
  });

  it("no singular quando é uma só; com tudo pago, diz que nada está em aberto", () => {
    lancamentos.substituirTudo([parcela("a", "ana", 3_000, "2026-11-15")]);
    const { unmount } = render(<ContasAReceber />);
    expect(screen.getByText(`1 parcela em aberto, somando ${reais(3_000)}`)).toBeTruthy();
    unmount();

    lancamentos.substituirTudo([parcela("a", "ana", 3_000, "2026-11-15", { pagoEm: "2026-10-01", forma: "pix" })]);
    render(<ContasAReceber />);
    expect(screen.getByText("Nenhuma parcela em aberto.")).toBeTruthy();
  });

  it("parcela de paciente que não existe aparece com o aviso, em vez de sumir", () => {
    lancamentos.substituirTudo([parcela("a", "sumiu", 3_000, "2026-11-15")]);
    render(<ContasAReceber />);
    expect(screen.getByText("Paciente não encontrado")).toBeTruthy();
  });

  it("sem parcelas, diz onde elas nascem", () => {
    render(<ContasAReceber />);
    expect(screen.getByText(/Nenhuma parcela ainda/)).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
