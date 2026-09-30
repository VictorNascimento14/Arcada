import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cadeiras, clinica, CLINICA_ID, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import type { Cadeira, Clinica, Consulta, Paciente, Procedimento, Profissional } from "@/dominio";
import { ROTAS } from "@/rotas";
import { assinarToasts } from "@/ui";

// Tudo fictício: telefones com DDD 00, que não existe; nenhum CPF.
const MANHA = { inicio: "08:00", fim: "12:00" };
const TARDE = { inicio: "13:30", fim: "18:00" };
const CLINICA: Clinica = {
  id: CLINICA_ID,
  nome: "Clínica Exemplo",
  expediente: { 0: [], 1: [MANHA, TARDE], 2: [MANHA, TARDE], 3: [MANHA, TARDE], 4: [MANHA, TARDE], 5: [MANHA, TARDE], 6: [MANHA] },
};
const CADEIRAS: Cadeira[] = [
  { id: "c1", nome: "Cadeira 1" },
  { id: "c2", nome: "Cadeira 2" },
  { id: "c3", nome: "Cadeira 3", ativa: false },
];
const PROFISSIONAIS: Profissional[] = [
  { id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" },
  { id: "p2", nome: "Dr. Exemplo", cro: "CRO-SP 00001", cor: "#4a6fa5" },
  { id: "p3", nome: "Dr. Inativo", cro: "CRO-SP 00002", cor: "#aa5555", ativo: false },
];
const PACIENTES: Paciente[] = [
  { id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" },
  { id: "a2", nome: "João Pedro Alves", nascimento: "2018-05-14", telefone: "(00) 90000-0005" },
];
const PROCEDIMENTOS: Procedimento[] = [
  { id: "pr1", codigo: "PRE-02", nome: "Profilaxia (limpeza)", especialidade: "Prevenção", preco: 18000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },
  { id: "pr2", nome: "Procedimento antigo", especialidade: "Prevenção", preco: 1000, duracaoMin: 20, exigeDente: false, exigeFace: false, ativo: false },
];
/** A Ana ocupa a Cadeira 1, com a Dra. Exemplo, das 08:00 às 08:45 de hoje. */
const EXISTENTE: Consulta = { id: "k1", pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-09-30T08:00", duracaoMin: 45, situacao: "confirmada" };

const TODAS = [clinica, cadeiras, profissionais, pacientes, procedimentos, consultas];

let avisos: string[] = [];
let cancelarAvisos = () => {};

beforeEach(() => {
  // Só o `Date`: os temporizadores reais seguem, e o `findBy` depende deles.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 12)); // quarta-feira
  clinica.substituirTudo([CLINICA]);
  cadeiras.substituirTudo(CADEIRAS);
  profissionais.substituirTudo(PROFISSIONAIS);
  pacientes.substituirTudo(PACIENTES);
  procedimentos.substituirTudo(PROCEDIMENTOS);
  consultas.substituirTudo([EXISTENTE]);
  avisos = [];
  cancelarAvisos = assinarToasts((t) => avisos.push(t.titulo));
});

afterEach(() => {
  cancelarAvisos();
  vi.useRealTimers();
  for (const c of TODAS) c.substituirTudo([]);
});

/** Abre a agenda de hoje e o modal de marcar consulta; devolve as consultas dentro do modal. */
async function abrirModal() {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/agenda"] })} />);
  fireEvent.click(await screen.findByRole("button", { name: "Marcar consulta" }));
  return within(await screen.findByRole("dialog", { name: "Marcar consulta" }));
}

type Modal = Awaited<ReturnType<typeof abrirModal>>;
const escolher = (m: Modal, rotulo: string, valor: string) => fireEvent.change(m.getByLabelText(rotulo), { target: { value: valor } });
const opcoes = (m: Modal, rotulo: string) => Array.from((m.getByLabelText(rotulo) as HTMLSelectElement).options).map((o) => o.textContent);
const marcar = (m: Modal) => m.getByRole("button", { name: "Marcar" }) as HTMLButtonElement;

describe("agenda: marcar consulta", () => {
  it("abre pelo botão da agenda, na data que ela mostra, e oferece só quem está ativo", async () => {
    const m = await abrirModal();

    expect((m.getByLabelText("Data") as HTMLInputElement).value).toBe("2026-09-30");
    expect((m.getByLabelText("Duração (min)") as HTMLInputElement).value).toBe("30");
    expect(opcoes(m, "Paciente")).toEqual(["Escolha o paciente", "Ana Beatriz Moura", "João Pedro Alves"]);
    expect(opcoes(m, "Profissional")).toEqual(["Escolha o profissional", "Dra. Exemplo", "Dr. Exemplo"]); // sem o inativo
    expect(opcoes(m, "Cadeira")).toEqual(["Escolha a cadeira", "Cadeira 1", "Cadeira 2"]);
    expect(opcoes(m, "Procedimento")).toEqual(["Sem procedimento definido", "PRE-02 · Profilaxia (limpeza)"]);
    expect(m.getByText("Escolha a cadeira ou o profissional para ver os horários livres.")).toBeTruthy();
  });

  it("escolher o procedimento preenche a duração prevista, e dá para ajustá-la depois", async () => {
    const m = await abrirModal();

    escolher(m, "Procedimento", "pr1");
    expect((m.getByLabelText("Duração (min)") as HTMLInputElement).value).toBe("40");

    escolher(m, "Duração (min)", "45");
    expect((m.getByLabelText("Duração (min)") as HTMLInputElement).value).toBe("45");
  });

  it("sugere os horários livres da cadeira, e clicar num deles preenche o início", async () => {
    const m = await abrirModal();
    escolher(m, "Cadeira", "c1");

    // Das 08:00 às 08:45 a cadeira está ocupada: uma consulta de 30 min só cabe a partir das 08:45.
    expect(m.queryByRole("button", { name: "08:00" })).toBeNull();
    expect(m.queryByRole("button", { name: "08:30" })).toBeNull();
    const livre = m.getByRole("button", { name: "08:45" });
    expect(livre.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(livre);

    expect((m.getByLabelText("Início") as HTMLInputElement).value).toBe("08:45");
    expect(livre.getAttribute("aria-pressed")).toBe("true");
  });

  it("bloqueia o conflito dizendo quem está ocupado e quando, e trava o botão", async () => {
    const m = await abrirModal();
    escolher(m, "Paciente", "a2");
    escolher(m, "Profissional", "p1"); // a Dra. Exemplo atende a Ana até 08:45...
    escolher(m, "Cadeira", "c2"); // ...em outra cadeira: o conflito é do profissional
    fireEvent.change(m.getByLabelText("Início"), { target: { value: "08:15" } });

    expect(m.getByRole("alert").textContent).toBe("Dra. Exemplo já tem consulta das 08:00 às 08:45 (Ana Beatriz Moura). Escolha outro horário.");
    expect(marcar(m).disabled).toBe(true);

    escolher(m, "Profissional", "p2");
    escolher(m, "Cadeira", "c1"); // agora a colisão é da cadeira
    expect(m.getByRole("alert").textContent).toContain("Cadeira 1 já tem consulta das 08:00 às 08:45");

    fireEvent.change(m.getByLabelText("Início"), { target: { value: "08:45" } }); // encostar não conflita
    expect(m.queryByRole("alert")).toBeNull();
    expect(marcar(m).disabled).toBe(false);
  });

  it("bloqueia o feriado nacional e não sugere horário nele", async () => {
    const m = await abrirModal();
    escolher(m, "Cadeira", "c1");
    fireEvent.change(m.getByLabelText("Data"), { target: { value: "2026-10-12" } });

    expect(m.getByRole("alert").textContent).toBe("Nossa Senhora Aparecida é feriado nacional. A agenda não marca consulta nesse dia: escolha outra data.");
    expect(marcar(m).disabled).toBe(true);
    expect(m.getByText("Nenhum horário livre neste dia para essa duração.")).toBeTruthy();
  });

  it("no ponto facultativo só avisa, e dá para marcar", async () => {
    const m = await abrirModal();
    fireEvent.change(m.getByLabelText("Data"), { target: { value: "2026-02-17" } });

    expect(m.getByRole("status").textContent).toBe("Carnaval é ponto facultativo. Confirme se a clínica abre nesse dia antes de marcar.");
    expect(m.queryByRole("alert")).toBeNull();
    expect(marcar(m).disabled).toBe(false);
  });

  it("envio incompleto mostra o que falta e não grava nada", async () => {
    const m = await abrirModal();
    fireEvent.click(marcar(m));

    for (const texto of ["Escolha o paciente.", "Escolha o profissional.", "Escolha a cadeira.", "Informe o horário de início."]) {
      expect(m.getByText(texto), texto).toBeTruthy();
    }
    expect(consultas.listar()).toEqual([EXISTENTE]);
    expect(screen.getByRole("dialog", { name: "Marcar consulta" })).toBeTruthy(); // o modal segue aberto
  });

  it("marca a consulta, fecha o modal e abre a agenda no dia dela, com o cartão na grade", async () => {
    const m = await abrirModal();
    escolher(m, "Paciente", "a2");
    escolher(m, "Profissional", "p2");
    escolher(m, "Cadeira", "c2");
    escolher(m, "Procedimento", "pr1");
    fireEvent.change(m.getByLabelText("Data"), { target: { value: "2026-10-01" } });
    fireEvent.click(m.getByRole("button", { name: "09:00" }));
    fireEvent.click(marcar(m));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await screen.findByRole("heading", { name: "quinta-feira, 1 de outubro de 2026" })).toBeTruthy();
    const [cartao] = within(screen.getByRole("list", { name: "Consultas da Cadeira 2" })).getAllByRole("article");
    expect(cartao.textContent).toContain("João Pedro Alves");
    expect(cartao.textContent).toContain("09:00–09:40 · Profilaxia (limpeza)");
    expect(cartao.textContent).toContain("Agendada · Dr. Exemplo");
    expect(consultas.listar()).toHaveLength(2);
    expect(avisos).toEqual(["Consulta marcada"]);
  });

  it("Cancelar fecha o modal sem gravar", async () => {
    const m = await abrirModal();
    escolher(m, "Paciente", "a1");

    fireEvent.click(m.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(consultas.listar()).toEqual([EXISTENTE]);
  });
});
