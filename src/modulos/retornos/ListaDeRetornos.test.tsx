import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consultas, pacientes, planos } from "@/dados/colecoes";
import type { Consulta, Paciente } from "@/dominio";

import { retornos } from "./dados";
import ListaDeRetornos from "./ListaDeRetornos";
import { linkDeRetorno } from "./mensagem";

const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
/** Consulta concluída em `dia`: o retorno cai 6 meses depois. */
const atendida = (pacienteId: string, dia: string): Consulta => ({
  id: `c-${pacienteId}`,
  pacienteId,
  profissionalId: "prof",
  cadeiraId: "cad",
  inicio: `${dia}T09:00`,
  duracaoMin: 30,
  situacao: "concluida",
});

const abrir = () =>
  render(
    <MemoryRouter>
      <ListaDeRetornos />
    </MemoryRouter>,
  );
/** O cartão de uma seção, achado pelo título. */
const cartao = (titulo: string) => within(screen.getByRole("heading", { name: titulo }).parentElement as HTMLElement);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 12)); // 30/09/2026
  pacientes.substituirTudo([paciente("ana", "Ana Exemplo"), paciente("bia", "Bia Exemplo"), paciente("caio", "Caio Exemplo"), paciente("dani", "Dani Exemplo"), paciente("edu", "Edu Exemplo")]);
  consultas.substituirTudo([]);
  planos.substituirTudo([]);
  retornos.substituirTudo([]);
});
afterEach(() => vi.useRealTimers());

describe("lista de retornos", () => {
  it("põe os vencidos e os a vencer cada um no seu cartão, com as datas, o prazo e o link para a ficha", () => {
    consultas.substituirTudo([
      atendida("ana", "2026-03-25"), // venceu em 25/09
      atendida("bia", "2026-03-30"), // vence hoje
      atendida("caio", "2026-04-29"), // vence em 29/10
      atendida("dani", "2026-05-01"), // 01/11: depois da janela
    ]);
    abrir();

    const vencidos = cartao("Vencidos");
    expect(vencidos.getByText("1 paciente")).toBeTruthy();
    expect(vencidos.getByText("Último atendimento em 25/03/2026 · retorno previsto em 25/09/2026")).toBeTruthy();
    expect(vencidos.getByText("Vencido há 5 dias")).toBeTruthy();
    expect(vencidos.getByRole("link", { name: "Ana Exemplo" }).getAttribute("href")).toBe("/pacientes/ana");

    const aVencer = cartao("A vencer nos próximos 30 dias");
    expect(aVencer.getByText("2 pacientes")).toBeTruthy();
    expect(aVencer.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("Bia Exemplo"),
      expect.stringContaining("Caio Exemplo"),
    ]);
    expect(aVencer.getByText("Vence hoje")).toBeTruthy();
    expect(aVencer.getByText("Vence em 29 dias")).toBeTruthy();

    expect(screen.queryByText("Dani Exemplo")).toBeNull(); // fora da janela
    expect(screen.queryByText("Edu Exemplo")).toBeNull(); // nunca foi atendido
  });

  it("no singular: um dia de atraso e um dia para vencer", () => {
    consultas.substituirTudo([atendida("ana", "2026-03-29"), atendida("bia", "2026-04-01")]); // retornos em 29/09 e 01/10
    abrir();

    expect(cartao("Vencidos").getByText("Vencido há 1 dia")).toBeTruthy();
    expect(cartao("A vencer nos próximos 30 dias").getByText("Vence em 1 dia")).toBeTruthy();
  });

  it("sem retorno vencido nem a vencer, cada cartão diz que não há", () => {
    consultas.substituirTudo([atendida("ana", "2026-09-01")]);
    abrir();

    expect(screen.getByText("Nenhum retorno vencido.")).toBeTruthy();
    expect(screen.getByText("Nenhum retorno a vencer nos próximos 30 dias.")).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("oferece o WhatsApp com a mensagem pronta só a quem tem telefone que serve, e a todos o atalho para a agenda", () => {
    const ana = { ...paciente("ana", "Ana Beatriz Exemplo"), telefone: "(11) 91234-5678" };
    pacientes.substituirTudo([ana, paciente("bia", "Bia Exemplo")]); // a Bia não tem telefone
    consultas.substituirTudo([atendida("ana", "2026-03-25"), atendida("bia", "2026-03-25")]);
    abrir();

    const whatsapp = screen.getByRole("link", { name: "WhatsApp de Ana Beatriz Exemplo, abre em outra aba" });
    expect(whatsapp.getAttribute("href")).toBe(linkDeRetorno(ana));
    expect(whatsapp.getAttribute("href")).toContain(encodeURIComponent("Olá, Ana!"));
    expect(whatsapp.getAttribute("href")).not.toContain("Beatriz");
    expect(whatsapp.getAttribute("target")).toBe("_blank");
    expect(screen.getAllByRole("link", { name: /^WhatsApp/ })).toHaveLength(1);

    for (const nome of ["Ana Beatriz Exemplo", "Bia Exemplo"]) {
      expect(screen.getByRole("link", { name: `Marcar consulta para ${nome}` }).getAttribute("href")).toBe("/agenda");
    }
  });
});

describe("adiar e dispensar o retorno", () => {
  const clicar = (nome: string) => fireEvent.click(screen.getByRole("button", { name: nome }));

  it("adia: pede os dias (sete de saída), conta de hoje e leva o paciente para os a vencer, marcado como adiado", () => {
    consultas.substituirTudo([atendida("ana", "2026-03-25")]); // venceu em 25/09, há 5 dias
    abrir();
    clicar("Adiar o retorno de Ana Exemplo");

    const campo = screen.getByLabelText("Adiar por quantos dias?") as HTMLInputElement;
    expect(campo.value).toBe("7");
    fireEvent.change(campo, { target: { value: "15" } });
    clicar("Confirmar");

    expect(retornos.obter("ana")).toEqual({ id: "ana", ultimoAtendimento: "2026-03-25", adiadoAte: "2026-10-15" });
    expect(screen.getByText("Nenhum retorno vencido.")).toBeTruthy();
    const aVencer = cartao("A vencer nos próximos 30 dias");
    expect(aVencer.getByText("Último atendimento em 25/03/2026 · retorno adiado para 15/10/2026")).toBeTruthy();
    expect(aVencer.getByText("Vence em 15 dias")).toBeTruthy();
    expect(screen.queryByLabelText("Adiar por quantos dias?")).toBeNull(); // o campo fechou
  });

  it("mostra o erro do campo quando os dias não servem e deixa o retorno como estava; Voltar fecha sem gravar", () => {
    consultas.substituirTudo([atendida("ana", "2026-03-25")]);
    abrir();
    clicar("Adiar o retorno de Ana Exemplo");
    fireEvent.change(screen.getByLabelText("Adiar por quantos dias?"), { target: { value: "0" } });
    clicar("Confirmar");

    expect(screen.getByText("Informe de 1 a 365 dias.")).toBeTruthy();
    expect(retornos.listar()).toHaveLength(0);

    clicar("Voltar");
    expect(screen.queryByLabelText("Adiar por quantos dias?")).toBeNull();
    expect(screen.getByRole("button", { name: "Dispensar o retorno de Ana Exemplo" })).toBeTruthy();
  });

  it("dispensa com o motivo, que é obrigatório: o paciente sai dos cartões, aparece em Dispensados e Reativar o traz de volta", () => {
    consultas.substituirTudo([atendida("ana", "2026-03-25")]);
    abrir();
    clicar("Dispensar o retorno de Ana Exemplo");
    clicar("Confirmar");
    expect(screen.getByText("Diga o motivo da dispensa.")).toBeTruthy();
    expect(retornos.listar()).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("Motivo da dispensa"), { target: { value: "Mudou de cidade" } });
    expect(screen.queryByText("Diga o motivo da dispensa.")).toBeNull(); // digitar apaga o erro
    clicar("Confirmar");

    expect(retornos.obter("ana")).toMatchObject({ dispensadoEm: "2026-09-30", motivo: "Mudou de cidade" });
    expect(screen.getByText("Nenhum retorno vencido.")).toBeTruthy();
    const dispensados = cartao("Dispensados");
    expect(dispensados.getByRole("link", { name: "Ana Exemplo" })).toBeTruthy();
    expect(dispensados.getByText("Dispensado em 30/09/2026 · motivo: Mudou de cidade")).toBeTruthy();

    clicar("Reativar o retorno de Ana Exemplo");
    expect(retornos.listar()).toHaveLength(0);
    expect(cartao("Vencidos").getByText("Vencido há 5 dias")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Dispensados" })).toBeNull(); // sem dispensado, sem cartão
  });
});
