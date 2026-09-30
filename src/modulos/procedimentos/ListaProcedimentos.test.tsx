import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { procedimentos } from "@/dados/colecoes";
import { formatarReais, type Procedimento } from "@/dominio";
import { ROTAS } from "@/rotas";

// Fictícios, como o catálogo padrão: preço em centavos.
const PROCEDIMENTOS: Procedimento[] = [
  { id: "p1", codigo: "DEN-01", nome: "Restauração em resina composta", especialidade: "Dentística", preco: 22000, duracaoMin: 50, exigeDente: true, exigeFace: true, ativo: true },
  { id: "p2", codigo: "PRE-02", nome: "Profilaxia (limpeza)", especialidade: "Prevenção", preco: 18050, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },
  { id: "p3", codigo: "CIR-01", nome: "Exodontia simples", especialidade: "Cirurgia", preco: 123456, duracaoMin: 30, exigeDente: true, exigeFace: false, ativo: true },
];

beforeEach(() => procedimentos.substituirTudo(PROCEDIMENTOS));
afterEach(() => procedimentos.substituirTudo([]));

// Monta as rotas de verdade: o módulo entra pelo registro, com a coluna e a casca.
async function abrir() {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/procedimentos"] })} />);
  return (await screen.findByRole("searchbox", { name: "Buscar procedimento" })) as HTMLInputElement;
}

/** As linhas da lista, na ordem da tela. */
const linhas = () => within(screen.getByRole("main")).queryAllByRole("listitem");
const especialidade = () => screen.getByRole("combobox", { name: "Especialidade" }) as HTMLSelectElement;

describe("lista de procedimentos", () => {
  it("entra na coluna lateral pelo registro de módulos e o item leva à lista", async () => {
    render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

    fireEvent.click((await screen.findAllByRole("button", { name: /Procedimentos/ }))[0]);

    expect(await screen.findByRole("searchbox", { name: "Buscar procedimento" })).toBeTruthy();
  });

  it("lista por especialidade e nome, com código, exigência, preço em reais e duração", async () => {
    await abrir();

    const [profilaxia, restauracao, exodontia] = linhas();
    expect(linhas()).toHaveLength(3);
    expect(profilaxia.textContent).toContain("Profilaxia (limpeza)");
    expect(profilaxia.textContent).toContain("PRE-02 · Prevenção");
    expect(profilaxia.textContent).toContain(formatarReais(18050));
    expect(profilaxia.textContent).toContain("40 min");
    expect(profilaxia.textContent).not.toContain("Exige");
    expect(restauracao.textContent).toContain("DEN-01 · Dentística · Exige dente e face");
    expect(exodontia.textContent).toContain("CIR-01 · Cirurgia · Exige dente");
    expect(exodontia.textContent).not.toContain("dente e face");
    expect(exodontia.textContent).toContain(formatarReais(123456)); // milhar e centavos
    expect(screen.getByText("3 procedimentos")).toBeTruthy();
  });

  it("busca o nome sem acento e a contagem acompanha", async () => {
    const campo = await abrir();
    fireEvent.change(campo, { target: { value: "restauracao resina" } });

    expect(linhas()).toHaveLength(1);
    expect(linhas()[0].textContent).toContain("Restauração em resina composta");
    expect(screen.getByText("1 de 3 procedimentos")).toBeTruthy();
  });

  it("busca pelo código", async () => {
    const campo = await abrir();
    fireEvent.change(campo, { target: { value: "cir-01" } });

    expect(linhas().map((l) => l.textContent)).toEqual([expect.stringContaining("Exodontia simples")]);
  });

  it("o filtro oferece só as especialidades da tabela e combina com a busca", async () => {
    const campo = await abrir();
    const select = especialidade();
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["Todas", "Prevenção", "Dentística", "Cirurgia"]);

    fireEvent.change(select, { target: { value: "Dentística" } });
    expect(linhas()).toHaveLength(1);
    expect(screen.getByText("1 de 3 procedimentos")).toBeTruthy();

    fireEvent.change(campo, { target: { value: "exodontia" } }); // outra área: nada sobra
    expect(linhas()).toHaveLength(0);
  });

  it("sem resultado avisa, e Limpar filtros traz a lista de volta", async () => {
    const campo = await abrir();
    fireEvent.change(campo, { target: { value: "zzz" } });
    fireEvent.change(especialidade(), { target: { value: "Cirurgia" } });

    expect(screen.getByText("Nenhum procedimento encontrado")).toBeTruthy();
    expect(screen.getByText("0 de 3 procedimentos")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(campo.value).toBe("");
    expect(especialidade().value).toBe("");
    expect(linhas()).toHaveLength(3);
  });

  it("se a especialidade escolhida deixa de existir na tabela, o filtro volta a Todas", async () => {
    await abrir();
    fireEvent.change(especialidade(), { target: { value: "Cirurgia" } });
    expect(linhas()).toHaveLength(1);

    act(() => procedimentos.substituirTudo(PROCEDIMENTOS.filter((p) => p.especialidade !== "Cirurgia")));

    expect(especialidade().value).toBe("");
    expect(linhas()).toHaveLength(2);
  });

  it("sem nenhum procedimento cadastrado mostra o estado vazio, não a busca sem resultado", async () => {
    procedimentos.substituirTudo([]);
    await abrir();

    expect(screen.getByText("Nenhum procedimento cadastrado ainda")).toBeTruthy();
    expect(screen.queryByText("Nenhum procedimento encontrado")).toBeNull();
    expect(linhas()).toHaveLength(0);
  });

  it("Novo procedimento abre o cadastro, e o procedimento salvo entra na lista com o preço em reais", async () => {
    await abrir();

    fireEvent.click(screen.getByRole("button", { name: "Novo procedimento" }));
    const dialogo = screen.getByRole("dialog");
    fireEvent.change(within(dialogo).getByLabelText("Nome"), { target: { value: "Consulta de retorno" } });
    fireEvent.change(within(dialogo).getByLabelText("Especialidade"), { target: { value: "Prevenção" } });
    fireEvent.change(within(dialogo).getByLabelText("Preço (R$)"), { target: { value: "95,90" } });
    fireEvent.change(within(dialogo).getByLabelText("Duração (minutos)"), { target: { value: "20" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("4 procedimentos")).toBeTruthy();
    const nova = linhas().find((l) => l.textContent?.includes("Consulta de retorno"));
    expect(nova?.textContent).toContain(formatarReais(9590));
    expect(nova?.textContent).toContain("20 min");
  });

  it("Editar abre o cadastro daquele procedimento, e a lista mostra o valor novo", async () => {
    await abrir();

    fireEvent.click(screen.getByRole("button", { name: "Editar Profilaxia (limpeza)" }));
    const dialogo = screen.getByRole("dialog");
    expect((within(dialogo).getByLabelText("Preço (R$)") as HTMLInputElement).value).toBe("180,50");
    fireEvent.change(within(dialogo).getByLabelText("Preço (R$)"), { target: { value: "200" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(linhas()).toHaveLength(3);
    expect(linhas()[0].textContent).toContain("Profilaxia (limpeza)");
    expect(linhas()[0].textContent).toContain(formatarReais(20000));
  });
});

describe("procedimento inativo", () => {
  it("continua na lista, marcado como inativo; os ativos não levam a marca", async () => {
    procedimentos.substituirTudo([PROCEDIMENTOS[0], { ...PROCEDIMENTOS[1], ativo: false }, PROCEDIMENTOS[2]]);
    await abrir();

    const [profilaxia, restauracao, exodontia] = linhas();
    expect(linhas()).toHaveLength(3);
    expect(profilaxia.textContent).toContain("Inativo");
    expect(restauracao.textContent).not.toContain("Inativo");
    expect(exodontia.textContent).not.toContain("Inativo");
  });

  it("desativa e reativa pelo modal de edição, e a lista mostra a mudança", async () => {
    await abrir();
    const editar = (nome: string) => fireEvent.click(screen.getByRole("button", { name: `Editar ${nome}` }));
    const ativo = () => within(screen.getByRole("dialog")).getByLabelText(/procedimento ativo/i);
    const salvar = () => fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Salvar" }));

    editar("Profilaxia (limpeza)");
    fireEvent.click(ativo());
    salvar();
    expect(linhas()[0].textContent).toContain("Inativo");
    expect(procedimentos.obter("p2")!.ativo).toBe(false);

    editar("Profilaxia (limpeza)");
    fireEvent.click(ativo());
    salvar();
    expect(linhas()[0].textContent).not.toContain("Inativo");
    expect(procedimentos.obter("p2")!.ativo).toBe(true);
  });
});

describe("reajuste de preços em lote", () => {
  const reajustar = () => screen.getByRole("button", { name: "Reajustar preços" }) as HTMLButtonElement;
  const marcar = (nome: string) => fireEvent.click(screen.getByRole("checkbox", { name: `Selecionar ${nome}` }));
  const status = () => screen.getByRole("status").textContent;

  it("só habilita o reajuste com procedimento selecionado e conta os selecionados", async () => {
    await abrir();
    expect(reajustar().disabled).toBe(true);

    marcar("Profilaxia (limpeza)");

    expect(reajustar().disabled).toBe(false);
    expect(status()).toBe("3 procedimentos · 1 selecionado");

    marcar("Profilaxia (limpeza)");
    expect(reajustar().disabled).toBe(true);
    expect(status()).toBe("3 procedimentos");
  });

  it("seleciona todos os visíveis, e o reajuste só alcança o que se vê marcado", async () => {
    const busca = await abrir();

    fireEvent.change(busca, { target: { value: "resina" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar os visíveis" }));
    expect(status()).toBe("1 de 3 procedimentos · 1 selecionado");

    fireEvent.change(busca, { target: { value: "" } }); // a marca sobrevive ao filtro
    expect(status()).toBe("3 procedimentos · 1 selecionado");
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar todos" }));
    expect(status()).toBe("3 procedimentos · 3 selecionados");
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar todos" }));
    expect(status()).toBe("3 procedimentos");

    marcar("Exodontia simples");
    fireEvent.change(busca, { target: { value: "profilaxia" } }); // esconde a marcada: nada visível está marcado
    expect(status()).toBe("1 de 3 procedimentos");
    expect(reajustar().disabled).toBe(true);
  });

  it("reajusta os selecionados só depois da prévia, mostra o preço novo e limpa a seleção", async () => {
    await abrir();
    marcar("Profilaxia (limpeza)");
    marcar("Exodontia simples");

    fireEvent.click(reajustar());
    const dialogo = screen.getByRole("dialog");
    fireEvent.change(within(dialogo).getByLabelText("Percentual (%)"), { target: { value: "-10" } });

    expect(within(dialogo).getAllByRole("listitem")).toHaveLength(2); // só os dois selecionados
    expect(procedimentos.obter("p2")!.preco).toBe(18050); // ainda não gravou

    fireEvent.click(within(dialogo).getByRole("button", { name: "Aplicar reajuste" }));

    expect(procedimentos.obter("p2")!.preco).toBe(16245);
    expect(procedimentos.obter("p3")!.preco).toBe(111110); // 111110,4 centavos
    expect(procedimentos.obter("p1")!.preco).toBe(22000);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(linhas()[0].textContent).toContain(formatarReais(16245));
    expect(status()).toBe("3 procedimentos");
  });
});
