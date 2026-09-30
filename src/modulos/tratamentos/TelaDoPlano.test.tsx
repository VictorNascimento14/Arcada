import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { pacientes, planos, procedimentos } from "@/dados/colecoes";
import { formatarReais, type Paciente, type PlanoTratamento, type Procedimento } from "@/dominio";

import TelaDoPlano from "./TelaDoPlano";

const PACIENTE: Paciente = { id: "pac1", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "" };
const proc = (p: Pick<Procedimento, "id" | "nome"> & Partial<Procedimento>): Procedimento => ({
  especialidade: "Dentística",
  preco: 10_000,
  duracaoMin: 30,
  exigeDente: false,
  exigeFace: false,
  ativo: true,
  ...p,
});
const RESINA = proc({ id: "resina", codigo: "DEN-01", nome: "Restauração em resina", preco: 22_000, exigeDente: true, exigeFace: true });
const CANAL = proc({ id: "canal", nome: "Canal", especialidade: "Endodontia", preco: 60_000, exigeDente: true });
const LIMPEZA = proc({ id: "limpeza", nome: "Profilaxia", especialidade: "Prevenção", preco: 18_000 });
const ANTIGO = proc({ id: "antigo", nome: "Procedimento antigo", ativo: false });

const PLANO: PlanoTratamento = { id: "pl1", pacienteId: "pac1", itens: [], desconto: 0, situacao: "proposto" };
const COM_ITEM: PlanoTratamento = { ...PLANO, itens: [{ id: "i1", procedimentoId: "limpeza", preco: 20_000 }] };

beforeEach(() => {
  pacientes.substituirTudo([PACIENTE]);
  procedimentos.substituirTudo([RESINA, CANAL, LIMPEZA, ANTIGO]);
  planos.substituirTudo([PLANO]);
});

function abrir(id = "pl1") {
  const rotas = [
    { path: "/planos/:planoId", Component: TelaDoPlano },
    { path: "/pacientes", element: <p>Lista</p> },
    { path: "/pacientes/:id", element: <p>Ficha</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: [`/planos/${id}`] })} />);
}

const dialogo = () => screen.getByRole("dialog");
const campo = (rotulo: string) => within(dialogo()).getByLabelText(rotulo);
const escolher = (rotulo: string, valor: string) => fireEvent.change(campo(rotulo), { target: { value: valor } });
const marcar = (face: RegExp) => fireEvent.click(within(dialogo()).getByRole("checkbox", { name: face }));
const faces = () => within(dialogo()).queryAllByRole("checkbox").map((c) => c.closest("label")?.textContent);
const abrirFormulario = () => fireEvent.click(screen.getByRole("button", { name: "Adicionar item" }));
const adicionar = () => fireEvent.click(within(dialogo()).getByRole("button", { name: "Adicionar ao plano" }));
const valorDa = (linha: string) => screen.getByText(linha).nextElementSibling?.textContent;
const itens = () => planos.obter("pl1")?.itens ?? [];

describe("adicionar item ao plano", () => {
  it("dente e faces: o preço da tabela vem no campo, pode ser ajustado, e o item entra no plano e no total", () => {
    abrir();
    abrirFormulario();

    escolher("Procedimento", "resina");
    expect((campo("Preço") as HTMLInputElement).value).toBe("220,00");
    expect(within(dialogo()).getByText("Escolha o dente para ver as faces dele.")).toBeTruthy(); // as faces esperam o dente

    escolher("Dente", "16");
    expect(faces()).toEqual(["V vestibular", "M mesial", "D distal", "P palatina", "O oclusal"]);
    marcar(/oclusal/);
    marcar(/mesial/);
    fireEvent.change(campo("Preço"), { target: { value: "200,00" } });
    adicionar();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(itens()).toMatchObject([{ procedimentoId: "resina", dente: 16, faces: ["M", "O"], preco: 20_000 }]);
    expect(screen.getByText("Restauração em resina")).toBeTruthy();
    expect(screen.getByText("Dente 16 · primeiro molar superior direito · faces mesial, oclusal")).toBeTruthy();
    expect(valorDa("Total")).toBe(formatarReais(20_000));
  });

  it("as faces são as do dente escolhido, e trocar de dente tira a marcada que o novo não tem", () => {
    abrir();
    abrirFormulario();
    escolher("Procedimento", "resina");

    escolher("Dente", "36"); // inferior: lingual, não palatina
    expect(faces()).toEqual(["V vestibular", "M mesial", "D distal", "L lingual", "O oclusal"]);

    marcar(/oclusal/);
    escolher("Dente", "11"); // incisivo: incisal, não oclusal
    expect(faces()).toEqual(["V vestibular", "M mesial", "D distal", "P palatina", "I incisal"]);
    expect(within(dialogo()).queryAllByRole("checkbox", { checked: true })).toHaveLength(0);

    marcar(/incisal/);
    adicionar();
    expect(itens()).toMatchObject([{ dente: 11, faces: ["I"] }]);
  });

  it("só pede dente e face quando o procedimento exige", () => {
    abrir();
    abrirFormulario();

    escolher("Procedimento", "limpeza");
    expect(campo("Preço")).toHaveProperty("value", "180,00");
    expect(within(dialogo()).queryByLabelText("Dente")).toBeNull();
    expect(within(dialogo()).queryByText("Faces")).toBeNull();

    escolher("Procedimento", "canal"); // só o dente
    expect(campo("Dente")).toBeTruthy();
    expect(within(dialogo()).queryByText("Faces")).toBeNull();
    expect(campo("Preço")).toHaveProperty("value", "600,00");
  });

  it("só os procedimentos ativos entram na escolha", () => {
    abrir();
    abrirFormulario();

    const opcoes = within(campo("Procedimento")).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toEqual(["Escolha o procedimento", "DEN-01 · Restauração em resina", "Canal", "Profilaxia"]);
  });

  it("mostra o erro de cada campo, mantém o modal aberto e não grava", () => {
    abrir();
    abrirFormulario();

    adicionar();
    expect(within(dialogo()).getByText("Escolha o procedimento.")).toBeTruthy();
    expect(within(dialogo()).getByText("Informe o preço, como 220,00.")).toBeTruthy();
    expect(campo("Procedimento").getAttribute("aria-invalid")).toBe("true");

    escolher("Procedimento", "resina");
    adicionar();
    expect(within(dialogo()).getByText("Escolha o dente.")).toBeTruthy();

    escolher("Dente", "16");
    adicionar();
    expect(within(dialogo()).getByText("Marque ao menos uma face.")).toBeTruthy();
    expect(itens()).toEqual([]);
  });

  it("remove um item do plano", () => {
    planos.substituirTudo([COM_ITEM]);
    abrir();

    fireEvent.click(screen.getByRole("button", { name: "Remover Profilaxia" }));

    expect(itens()).toEqual([]);
    expect(screen.getByText("Nenhum item ainda. Adicione o primeiro procedimento.")).toBeTruthy();
  });
});

describe("orçamento e situação", () => {
  beforeEach(() => planos.substituirTudo([COM_ITEM]));

  it("aplica o desconto percentual e o de valor, com o total abatido", () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Percentual de desconto"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar desconto" }));
    expect(planos.obter("pl1")?.desconto).toBe(2_000);
    expect(valorDa("Desconto")).toBe(`− ${formatarReais(2_000)}`);
    expect(valorDa("Total")).toBe(formatarReais(18_000));

    fireEvent.change(screen.getByLabelText("Tipo do desconto"), { target: { value: "valor" } });
    fireEvent.change(screen.getByLabelText("Valor do desconto"), { target: { value: "50,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar desconto" }));
    expect(planos.obter("pl1")?.desconto).toBe(5_000);
    expect(valorDa("Total")).toBe(formatarReais(15_000));
  });

  it("desconto que não é número mostra o erro e não grava", () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Percentual de desconto"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar desconto" }));

    expect(screen.getByText("Informe o percentual, como 10 ou 12,5.")).toBeTruthy();
    expect(planos.obter("pl1")?.desconto).toBe(0);
  });

  it("aprovar muda a situação e trava itens e desconto; o próximo passo é iniciar o tratamento", () => {
    abrir();

    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(planos.obter("pl1")?.situacao).toBe("aprovado");
    expect(screen.getByText("Aprovado")).toBeTruthy();
    expect(screen.getByText("Só o plano proposto muda de itens e de desconto.")).toBeTruthy();
    for (const nome of ["Adicionar item", "Aplicar desconto", "Remover Profilaxia", "Aprovar", "Recusar"]) {
      expect(screen.queryByRole("button", { name: nome })).toBeNull();
    }
    expect(screen.getByRole("button", { name: "Iniciar tratamento" })).toBeTruthy();
  });

  it("recusar é o fim: nenhum botão de situação sobra", () => {
    abrir();

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    expect(planos.obter("pl1")?.situacao).toBe("recusado");
    expect(screen.queryAllByRole("button", { name: /Aprovar|Recusar|Iniciar|Concluir/ })).toHaveLength(0);
  });

  it("sem itens não se aprova: o botão fica desabilitado, com o motivo", () => {
    planos.substituirTudo([PLANO]);
    abrir();

    expect((screen.getByRole("button", { name: "Aprovar" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Adicione ao menos um item para aprovar o plano.")).toBeTruthy();
  });
});

describe("plano que não existe", () => {
  it("mostra a mensagem e o caminho de volta", () => {
    abrir("nao-existe");

    expect(screen.getByRole("heading", { name: "Plano não encontrado" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar à lista de pacientes" }).getAttribute("href")).toBe("/pacientes");
  });
});
