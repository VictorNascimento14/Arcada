import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
];
const PROFISSIONAIS: Profissional[] = [
  { id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" },
  { id: "p2", nome: "Dr. Exemplo", cro: "CRO-SP 00001", cor: "#4a6fa5" },
];
const PACIENTES: Paciente[] = [
  { id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" },
  { id: "a2", nome: "João Pedro Alves", nascimento: "2018-05-14", telefone: "(00) 90000-0005" },
  { id: "a3", nome: "Helena Duarte", nascimento: "1996-12-30", telefone: "(00) 90000-0004" },
];
const PROCEDIMENTOS: Procedimento[] = [
  { id: "pr1", nome: "Restauração", especialidade: "Dentística", preco: 15000, duracaoMin: 45, exigeDente: true, exigeFace: true, ativo: true },
];
const CONSULTAS: Consulta[] = [
  { id: "k1", pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-09-30T08:00", duracaoMin: 45, situacao: "confirmada", procedimentoId: "pr1" },
  { id: "k2", pacienteId: "a2", profissionalId: "p2", cadeiraId: "c2", inicio: "2026-09-30T10:30", duracaoMin: 90, situacao: "agendada" },
  { id: "k3", pacienteId: "a3", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-09-30T14:00", duracaoMin: 30, situacao: "cancelada" },
  { id: "k4", pacienteId: "a3", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-10-01T09:00", duracaoMin: 30, situacao: "agendada" },
];

const TODAS = [clinica, cadeiras, profissionais, pacientes, procedimentos, consultas];

/** Fixa "hoje" ao meio-dia de `dia`. Só o `Date`: os temporizadores reais seguem, e o `findBy` depende deles. */
const hojeE = (a: number, m: number, d: number) => vi.setSystemTime(new Date(a, m - 1, d, 12));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  hojeE(2026, 9, 30); // quarta-feira
  clinica.substituirTudo([CLINICA]);
  cadeiras.substituirTudo(CADEIRAS);
  profissionais.substituirTudo(PROFISSIONAIS);
  pacientes.substituirTudo(PACIENTES);
  procedimentos.substituirTudo(PROCEDIMENTOS);
  consultas.substituirTudo(CONSULTAS);
});

afterEach(() => {
  vi.useRealTimers();
  for (const c of TODAS) c.substituirTudo([]);
});

// Monta as rotas de verdade: o módulo entra pelo registro, com a coluna e a casca.
async function abrir(titulo = "quarta-feira, 30 de setembro de 2026") {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/agenda"] })} />);
  await screen.findByRole("heading", { name: titulo });
}

const cartoes = (cadeira: string) =>
  within(screen.getByRole("list", { name: `Consultas da ${cadeira}` })).queryAllByRole("article");

describe("agenda: visão do dia", () => {
  it("entra na coluna lateral pelo registro de módulos e abre no dia de hoje", async () => {
    render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

    fireEvent.click((await screen.findAllByRole("button", { name: /Agenda/ }))[0]);

    expect(await screen.findByRole("heading", { name: "quarta-feira, 30 de setembro de 2026" })).toBeTruthy();
  });

  it("monta uma coluna por cadeira, com as horas do expediente, só com as consultas do dia que não foram canceladas", async () => {
    await abrir();

    expect(screen.getByRole("heading", { level: 3, name: "Cadeira 1" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Cadeira 2" })).toBeTruthy();
    expect(cartoes("Cadeira 1")).toHaveLength(1); // a cancelada e a de amanhã ficam de fora
    expect(cartoes("Cadeira 2")).toHaveLength(1);
    expect(screen.getByText("2 consultas neste dia")).toBeTruthy();
    expect(screen.getByText("08:00")).toBeTruthy();
    expect(screen.getByText("18:00")).toBeTruthy();
    expect(screen.queryByText("Helena Duarte")).toBeNull();
  });

  it("o cartão traz paciente, horário, procedimento, profissional e situação, na cor do profissional", async () => {
    await abrir();

    const [ana] = cartoes("Cadeira 1");
    expect(ana.textContent).toContain("Ana Beatriz Moura");
    expect(ana.textContent).toContain("08:00–08:45 · Restauração");
    expect(ana.textContent).toContain("Confirmada · Dra. Exemplo");
    expect(ana.style.borderLeftColor).toBe("rgb(31, 111, 91)"); // #1f6f5b

    // Sem procedimento, a linha do horário fica só com o horário.
    const [joao] = cartoes("Cadeira 2");
    expect(joao.textContent).toContain("João Pedro Alves");
    expect(within(joao).getByText("10:30–12:00")).toBeTruthy(); // só o horário: sem " · procedimento"
    expect(joao.style.borderLeftColor).toBe("rgb(74, 111, 165)"); // #4a6fa5
  });

  it("o cartão começa na hora e tem o tamanho da duração (7 rem por hora, a partir da abertura)", async () => {
    await abrir();

    const ana = cartoes("Cadeira 1")[0].parentElement!;
    expect(parseFloat(ana.style.top)).toBe(0); // 08:00, a abertura
    expect(ana.style.height).toBe("5.25rem"); // 45 min
    const joao = cartoes("Cadeira 2")[0].parentElement!;
    expect(joao.style.top).toBe("17.5rem"); // 10:30, duas horas e meia depois
    expect(joao.style.height).toBe("10.5rem"); // 90 min
  });

  it("navega de dia em dia e Hoje volta", async () => {
    await abrir();
    const hoje = screen.getByRole("button", { name: "Hoje" }) as HTMLButtonElement;
    expect(hoje.disabled).toBe(true); // já está em hoje

    fireEvent.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(await screen.findByRole("heading", { name: "quinta-feira, 1 de outubro de 2026" })).toBeTruthy();
    expect(cartoes("Cadeira 1")[0].textContent).toContain("Helena Duarte");
    expect(screen.getByText("1 consulta neste dia")).toBeTruthy();
    expect(hoje.disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Dia anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Dia anterior" }));
    expect(await screen.findByRole("heading", { name: "terça-feira, 29 de setembro de 2026" })).toBeTruthy();
    expect(screen.getByText("Nenhuma consulta neste dia")).toBeTruthy();

    fireEvent.click(hoje);
    expect(await screen.findByRole("heading", { name: "quarta-feira, 30 de setembro de 2026" })).toBeTruthy();
    expect(hoje.disabled).toBe(true);
  });

  it("avisa o feriado", async () => {
    hojeE(2026, 9, 7);
    await abrir("segunda-feira, 7 de setembro de 2026");
    expect(screen.getByText("Feriado: Independência do Brasil.")).toBeTruthy();
  });

  it("avisa o ponto facultativo", async () => {
    hojeE(2026, 2, 17);
    await abrir("terça-feira, 17 de fevereiro de 2026");
    expect(screen.getByText("Ponto facultativo: Carnaval.")).toBeTruthy();
  });

  it("dia em que a clínica não atende mostra o aviso, e não a grade", async () => {
    hojeE(2026, 10, 4); // domingo
    await abrir("domingo, 4 de outubro de 2026");

    expect(screen.getByText("Clínica fechada neste dia")).toBeTruthy();
    expect(screen.queryByRole("list", { name: /Consultas da/ })).toBeNull();
  });

  it("consulta marcada num dia fechado não some: a grade aparece e o resumo avisa", async () => {
    hojeE(2026, 10, 4);
    consultas.salvar({ ...CONSULTAS[0], id: "k5", inicio: "2026-10-04T09:00" });
    await abrir("domingo, 4 de outubro de 2026");

    expect(cartoes("Cadeira 1")).toHaveLength(1);
    expect(screen.getByText("1 consulta neste dia — a clínica não atende neste dia")).toBeTruthy();
  });

  it("cadeira inativa sai da agenda, menos no dia em que ainda tem consulta", async () => {
    cadeiras.salvar({ id: "c3", nome: "Cadeira 3", ativa: false });
    await abrir();
    expect(screen.queryByRole("heading", { name: "Cadeira 3" })).toBeNull();

    act(() => consultas.salvar({ ...CONSULTAS[0], id: "k6", cadeiraId: "c3", profissionalId: "p2", inicio: "2026-09-30T15:00" }));
    expect(screen.getByRole("heading", { name: "Cadeira 3" })).toBeTruthy();
    expect(cartoes("Cadeira 3")).toHaveLength(1);
  });

  it("cadastro removido depois da marcação aparece como removido, e a consulta continua na grade", async () => {
    consultas.substituirTudo([{ ...CONSULTAS[0], pacienteId: "sumiu", profissionalId: "sumiu" }]);
    await abrir();

    const [cartao] = cartoes("Cadeira 1");
    expect(cartao.textContent).toContain("Paciente removido");
    expect(cartao.textContent).toContain("Confirmada · Profissional removido");
  });

  it("sem nenhuma cadeira ativa, pede o cadastro em vez de desenhar a grade", async () => {
    cadeiras.substituirTudo([]);
    consultas.substituirTudo([]);
    await abrir();

    expect(screen.getByText("Nenhuma cadeira cadastrada")).toBeTruthy();
  });
});

// O cartão é o botão que abre o detalhe da consulta.
const abrirCartao = async (paciente: string) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(paciente) }));
  return within(await screen.findByRole("dialog", { name: `Consulta de ${paciente}` }));
};
type Detalhe = Awaited<ReturnType<typeof abrirCartao>>;
const botoes = (d: Detalhe) => within(d.getByRole("group", { name: "Mudar a situação" })).getAllByRole("button").map((b) => b.textContent);

describe("agenda: situação da consulta", () => {
  it("clicar no cartão abre o detalhe: quem, quando, onde e a situação", async () => {
    await abrir();
    const d = await abrirCartao("Ana Beatriz Moura");

    expect(d.getByText("quarta-feira, 30 de setembro de 2026, das 08:00 às 08:45")).toBeTruthy();
    expect(d.getByText("Dra. Exemplo")).toBeTruthy();
    expect(d.getByText("Cadeira 1")).toBeTruthy();
    expect(d.getByText("Restauração")).toBeTruthy();
    expect(d.getByText("Confirmada")).toBeTruthy();
  });

  it("consulta sem procedimento e com o profissional removido continua abrindo", async () => {
    consultas.substituirTudo([{ ...CONSULTAS[1], profissionalId: "sumiu" }]);
    await abrir();
    const d = await abrirCartao("João Pedro Alves");

    expect(d.getByText("Sem procedimento definido")).toBeTruthy();
    expect(d.getByText("Profissional removido")).toBeTruthy();
  });

  it.each([
    ["João Pedro Alves", "agendada", ["Confirmar consulta", "Iniciar atendimento", "Marcar falta"]],
    ["Ana Beatriz Moura", "confirmada", ["Iniciar atendimento", "Marcar falta"]],
  ])("de %s (%s), só os botões das transições válidas", async (paciente, _situacao, esperados) => {
    await abrir();
    expect(botoes(await abrirCartao(paciente))).toEqual(esperados);
  });

  it("o botão grava a situação, fecha o detalhe e o cartão mostra a nova", async () => {
    const avisos: string[] = [];
    const cancelar = assinarToasts((a) => avisos.push(`${a.titulo} | ${a.corpo}`));
    await abrir();
    const d = await abrirCartao("João Pedro Alves");

    fireEvent.click(d.getByRole("button", { name: "Confirmar consulta" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(consultas.obter("k2")?.situacao).toBe("confirmada");
    expect(cartoes("Cadeira 2")[0].textContent).toContain("Confirmada · Dr. Exemplo");
    expect(avisos).toEqual(["Situação atualizada | João Pedro Alves · Confirmada"]);
    cancelar();
  });

  it("segue o atendimento até concluir, e a situação final não tem botão", async () => {
    await abrir();
    fireEvent.click((await abrirCartao("Ana Beatriz Moura")).getByRole("button", { name: "Iniciar atendimento" }));
    expect(cartoes("Cadeira 1")[0].textContent).toContain("Em atendimento · Dra. Exemplo");

    const emAtendimento = await abrirCartao("Ana Beatriz Moura");
    expect(botoes(emAtendimento)).toEqual(["Concluir atendimento"]);
    fireEvent.click(emAtendimento.getByRole("button", { name: "Concluir atendimento" }));

    const concluida = await abrirCartao("Ana Beatriz Moura");
    expect(concluida.queryByRole("group", { name: "Mudar a situação" })).toBeNull();
    expect(concluida.getByText("Situação final: esta consulta não muda mais.")).toBeTruthy();
  });

  it("marcar falta tira os botões e o cartão continua na grade", async () => {
    await abrir();
    fireEvent.click((await abrirCartao("João Pedro Alves")).getByRole("button", { name: "Marcar falta" }));

    expect(cartoes("Cadeira 2")[0].textContent).toContain("Faltou · Dr. Exemplo");
  });
});

describe("agenda: remarcar e cancelar", () => {
  const remarcando = async (paciente: string) => {
    await abrir();
    fireEvent.click((await abrirCartao(paciente)).getByRole("button", { name: "Remarcar" }));
    return within(await screen.findByRole("dialog", { name: "Remarcar consulta" }));
  };
  const valor = (f: Detalhe, rotulo: string) => (f.getByLabelText(rotulo) as HTMLInputElement | HTMLSelectElement).value;
  const botao = (f: Detalhe, nome: string) => f.getByRole("button", { name: nome }) as HTMLButtonElement;

  it("Remarcar troca o detalhe pelo formulário de marcar, com os dados da consulta e o paciente travado", async () => {
    const f = await remarcando("João Pedro Alves");

    expect(screen.queryByRole("dialog", { name: /Consulta de/ })).toBeNull();
    expect(valor(f, "Paciente")).toBe("a2");
    expect((f.getByLabelText("Paciente") as HTMLSelectElement).disabled).toBe(true);
    expect(valor(f, "Profissional")).toBe("p2");
    expect(valor(f, "Cadeira")).toBe("c2");
    expect(valor(f, "Data")).toBe("2026-09-30");
    expect(valor(f, "Início")).toBe("10:30");
    expect(valor(f, "Duração (min)")).toBe("90");
  });

  it("remarcar regrava a mesma consulta: o cartão vai para o horário novo e a agenda abre no dia dele", async () => {
    const f = await remarcando("João Pedro Alves");
    fireEvent.change(f.getByLabelText("Data"), { target: { value: "2026-10-01" } });
    fireEvent.change(f.getByLabelText("Início"), { target: { value: "15:00" } });
    fireEvent.click(botao(f, "Remarcar"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(consultas.listar()).toHaveLength(4); // remarcou, não criou outra
    expect(consultas.obter("k2")).toMatchObject({ inicio: "2026-10-01T15:00", situacao: "agendada" });
    expect(await screen.findByRole("heading", { name: "quinta-feira, 1 de outubro de 2026" })).toBeTruthy();
    expect(cartoes("Cadeira 2")[0].textContent).toContain("15:00–16:30");
  });

  it("a própria consulta não conta como conflito: o horário dela está livre e dá para ir por cima", async () => {
    const f = await remarcando("João Pedro Alves"); // 10:30–12:00
    fireEvent.change(f.getByLabelText("Início"), { target: { value: "11:00" } });

    expect(f.queryByRole("alert")).toBeNull();
    expect(botao(f, "Remarcar").disabled).toBe(false);
    expect(f.getByRole("button", { name: "10:30" })).toBeTruthy(); // sugestão: o horário atual conta como livre
  });

  it("conflito com outra consulta trava o botão e diz quem está ocupado", async () => {
    const f = await remarcando("João Pedro Alves");
    fireEvent.change(f.getByLabelText("Cadeira"), { target: { value: "c1" } });
    fireEvent.change(f.getByLabelText("Início"), { target: { value: "08:15" } }); // a Ana ocupa a Cadeira 1 das 08:00 às 08:45

    expect(f.getByRole("alert").textContent).toContain("Cadeira 1 já tem consulta das 08:00 às 08:45 (Ana Beatriz Moura)");
    expect(botao(f, "Remarcar").disabled).toBe(true);
  });

  it("a consulta confirmada avisa que volta a agendada, e volta", async () => {
    const f = await remarcando("Ana Beatriz Moura");
    expect(f.getByText(/volta para agendada/)).toBeTruthy();
    fireEvent.change(f.getByLabelText("Início"), { target: { value: "09:00" } });
    fireEvent.click(botao(f, "Remarcar"));

    expect(cartoes("Cadeira 1")[0].textContent).toContain("Agendada · Dra. Exemplo");
  });

  it("consulta cujo profissional ficou inativo pede um ativo antes de remarcar", async () => {
    profissionais.salvar({ ...PROFISSIONAIS[1], ativo: false });
    const f = await remarcando("João Pedro Alves");
    fireEvent.click(botao(f, "Remarcar"));

    expect(f.getByText("Escolha um profissional ativo.")).toBeTruthy();
    expect(consultas.obter("k2")?.inicio).toBe("2026-09-30T10:30");
  });

  it("só a consulta que aguarda o atendimento remarca e cancela", async () => {
    await abrir();
    const aguardando = await abrirCartao("Ana Beatriz Moura");
    expect(aguardando.getByRole("button", { name: "Remarcar" })).toBeTruthy();
    expect(aguardando.getByRole("button", { name: "Cancelar consulta" })).toBeTruthy();
    fireEvent.click(aguardando.getByRole("button", { name: "Iniciar atendimento" }));

    const emAtendimento = await abrirCartao("Ana Beatriz Moura");
    expect(emAtendimento.queryByRole("button", { name: "Remarcar" })).toBeNull();
    expect(emAtendimento.queryByRole("button", { name: "Cancelar consulta" })).toBeNull();
  });

  it("cancelar pede o motivo: sem ele não cancela, com ele a consulta sai da grade e o guarda", async () => {
    await abrir();
    const d = await abrirCartao("João Pedro Alves");
    fireEvent.click(d.getByRole("button", { name: "Cancelar consulta" }));

    expect(d.queryByRole("group", { name: "Mudar a situação" })).toBeNull(); // o campo ocupa o lugar dos botões
    fireEvent.click(botao(d, "Confirmar cancelamento"));
    expect(d.getByText("Informe o motivo do cancelamento.")).toBeTruthy();
    expect(consultas.obter("k2")?.situacao).toBe("agendada");

    fireEvent.change(d.getByLabelText("Motivo do cancelamento"), { target: { value: "Paciente pediu para desmarcar" } });
    expect(d.queryByText("Informe o motivo do cancelamento.")).toBeNull(); // corrigir limpa o erro
    fireEvent.click(botao(d, "Confirmar cancelamento"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(consultas.obter("k2")).toMatchObject({ situacao: "cancelada", motivoCancelamento: "Paciente pediu para desmarcar" });
    expect(cartoes("Cadeira 2")).toHaveLength(0);
    expect(screen.getByText("1 consulta neste dia")).toBeTruthy();
  });

  it("Voltar desiste de cancelar e traz os botões de volta", async () => {
    await abrir();
    const d = await abrirCartao("João Pedro Alves");
    fireEvent.click(d.getByRole("button", { name: "Cancelar consulta" }));
    fireEvent.click(d.getByRole("button", { name: "Voltar" }));

    expect(d.getByRole("group", { name: "Mudar a situação" })).toBeTruthy();
    expect(consultas.obter("k2")?.situacao).toBe("agendada");
  });
});
