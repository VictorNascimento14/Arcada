import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { pacientes } from "@/dados/colecoes";
import { ROTAS } from "@/rotas";

let router: ReturnType<typeof createMemoryRouter>;

// As rotas de verdade: o cadastro entra pelo registro de módulos, e salvar navega de fato.
async function abrir() {
  router = createMemoryRouter(ROTAS, { initialEntries: ["/pacientes/novo"] });
  render(<RouterProvider router={router} />);
  await screen.findByRole("heading", { name: "Dados do paciente" });
}

const campo = (rotulo: string) => screen.getByLabelText(rotulo) as HTMLInputElement;
const digitar = (rotulo: string, valor: string) => fireEvent.change(campo(rotulo), { target: { value: valor } });
const enviar = () => fireEvent.click(screen.getByRole("button", { name: "Cadastrar paciente" }));
const caminho = () => router.state.location.pathname;
/** A mensagem está escrita no campo (o `alert` só para leitor de tela repete o texto e fica de fora). */
const noCampo = (mensagem: string) => screen.queryAllByText(mensagem).some((el) => el.getAttribute("role") !== "alert");

beforeEach(() => pacientes.substituirTudo([]));

describe("cadastro de paciente", () => {
  it("enviar em branco mostra o que falta, põe o foco no primeiro campo e não grava", async () => {
    await abrir();
    expect(noCampo("Informe o nome do paciente.")).toBe(false); // formulário novo não nasce com erro

    enviar();

    expect(noCampo("Informe o nome do paciente.")).toBe(true);
    expect(noCampo("Informe a data de nascimento.")).toBe(true);
    expect(screen.getByRole("alert").textContent).toBe("Informe o nome do paciente. Informe a data de nascimento.");
    expect(document.activeElement).toBe(campo("Nome completo"));
    expect(pacientes.listar()).toHaveLength(0);
    expect(caminho()).toBe("/pacientes/novo");

    digitar("Nome completo", "Paciente Exemplo"); // corrigir tira a mensagem do campo
    expect(noCampo("Informe o nome do paciente.")).toBe(false);
    expect(noCampo("Informe a data de nascimento.")).toBe(true);
  });

  it("mascara o CPF enquanto digita e recusa o inválido", async () => {
    await abrir();
    digitar("CPF (opcional)", "1234567");
    expect(campo("CPF (opcional)").value).toBe("123.456.7");

    digitar("CPF (opcional)", "11111111111"); // os onze iguais nunca são CPF
    digitar("Nome completo", "Paciente Exemplo");
    digitar("Data de nascimento", "1990-06-12");
    enviar();

    expect(campo("CPF (opcional)").value).toBe("111.111.111-11");
    expect(noCampo("CPF inválido. Confira os 11 dígitos.")).toBe(true);
    expect(pacientes.listar()).toHaveLength(0);
  });

  it("cadastra com os dados aparados, Particular sem convênio, e leva à ficha", async () => {
    await abrir();
    digitar("Nome completo", "  Paciente   Exemplo ");
    digitar("Data de nascimento", "1990-06-12");
    digitar("Telefone", "(11) 90000-0001");
    digitar("Observações", "Prefere o fim da tarde.");
    enviar();

    const [salvo] = pacientes.listar();
    expect(pacientes.listar()).toHaveLength(1);
    expect(salvo).toMatchObject({
      nome: "Paciente Exemplo",
      nascimento: "1990-06-12",
      telefone: "(11) 90000-0001",
      convenio: "Particular",
      observacoes: "Prefere o fim da tarde.",
    });
    expect(salvo.cpf).toBeUndefined();
    await waitFor(() => expect(caminho()).toBe(`/pacientes/${salvo.id}`));
    expect(await screen.findByRole("heading", { name: "Paciente Exemplo" })).toBeTruthy(); // a ficha abre
  });

  it("Cancelar volta à lista sem gravar", async () => {
    await abrir();
    digitar("Nome completo", "Paciente Exemplo");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(caminho()).toBe("/pacientes"));
    expect(pacientes.listar()).toHaveLength(0);
  });
});
