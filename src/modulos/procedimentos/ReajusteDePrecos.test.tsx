import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { procedimentos } from "@/dados/colecoes";
import { formatarReais, type Procedimento } from "@/dominio";

import ReajusteDePrecos from "./ReajusteDePrecos";

const proc = (id: string, nome: string, preco: number): Procedimento => ({
  id,
  nome,
  especialidade: "Dentística",
  preco,
  duracaoMin: 30,
  exigeDente: false,
  exigeFace: false,
  ativo: true,
});

const LIMPEZA = proc("a", "Profilaxia (limpeza)", 18000);
const SELANTE = proc("b", "Selante", 5700);
const FORA = proc("c", "Fora da escolha", 4500);

const aoFechar = vi.fn();
const aoAplicar = vi.fn();

const dialogo = () => screen.getByRole("dialog");
const digitar = (valor: string) => fireEvent.change(within(dialogo()).getByLabelText("Percentual (%)"), { target: { value: valor } });
const aplicar = () => within(dialogo()).getByRole("button", { name: "Aplicar reajuste" }) as HTMLButtonElement;
const precos = () => procedimentos.listar().map((p) => p.preco);

beforeEach(() => {
  localStorage.clear();
  aoFechar.mockClear();
  aoAplicar.mockClear();
  procedimentos.substituirTudo([LIMPEZA, SELANTE, FORA]);
});

const abrir = (escolhidos: readonly Procedimento[] = [LIMPEZA, SELANTE]) =>
  render(<ReajusteDePrecos escolhidos={escolhidos} aoFechar={aoFechar} aoAplicar={aoAplicar} />);

describe("reajuste de preços em lote", () => {
  it("mostra a prévia do preço atual e do novo de cada escolhido, sem gravar; só aplicar grava", () => {
    abrir();
    expect(within(dialogo()).getByText(/Digite o percentual/)).toBeTruthy();

    digitar("10");

    const [limpeza, selante] = within(dialogo()).getAllByRole("listitem");
    expect(limpeza.textContent).toContain("Profilaxia (limpeza)");
    expect(limpeza.textContent).toContain(`${formatarReais(18000)}`);
    expect(limpeza.textContent).toContain(formatarReais(19800));
    expect(selante.textContent).toContain(formatarReais(6270));
    expect(precos()).toEqual([18000, 5700, 4500]); // a prévia não grava
    expect(aoFechar).not.toHaveBeenCalled();

    fireEvent.click(aplicar());

    expect(precos()).toEqual([19800, 6270, 4500]); // o que ficou fora da escolha não muda
    expect(aoAplicar).toHaveBeenCalledOnce();
    expect(aoFechar).toHaveBeenCalledOnce();
  });

  it("aceita percentual negativo, com vírgula", () => {
    abrir([LIMPEZA]);

    digitar("-2,5");
    fireEvent.click(aplicar());

    expect(procedimentos.obter("a")!.preco).toBe(17550);
  });

  it("não deixa aplicar sem um percentual válido nem um que não muda preço nenhum", () => {
    abrir([proc("d", "Cortesia", 10)]);
    expect(aplicar().disabled).toBe(true);

    digitar("abc");
    expect(within(dialogo()).getByText(/Informe um percentual de -100 a 1000/)).toBeTruthy();
    expect(aplicar().disabled).toBe(true);

    digitar("-100,5");
    expect(aplicar().disabled).toBe(true);

    digitar("1"); // 1% de 10 centavos não chega a um centavo
    expect(within(dialogo()).getByText("Nenhum preço muda com este percentual.")).toBeTruthy();
    expect(aplicar().disabled).toBe(true);

    fireEvent.submit(dialogo().querySelector("form")!); // Enter no campo também não aplica
    expect(aoAplicar).not.toHaveBeenCalled();
    expect(precos()).toEqual([18000, 5700, 4500]);
  });

  it("cancelar fecha sem gravar", () => {
    abrir();

    digitar("10");
    fireEvent.click(within(dialogo()).getByRole("button", { name: "Cancelar" }));

    expect(aoFechar).toHaveBeenCalledOnce();
    expect(aoAplicar).not.toHaveBeenCalled();
    expect(precos()).toEqual([18000, 5700, 4500]);
  });
});
