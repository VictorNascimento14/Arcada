import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import AbaOdontograma from "./AbaOdontograma";
import { odontogramas } from "./dados";

beforeEach(() => odontogramas.substituirTudo([]));

// O nome da face traz a condição depois de dois-pontos: casa pelo começo.
const face = (nome: string, dente: number) => screen.getByRole("button", { name: new RegExp(`^face ${nome} do dente ${dente}`) });
const nomeDaFace = (nome: string, dente: number) => face(nome, dente).getAttribute("aria-label");
const escolher = (condicao: string) => fireEvent.click(screen.getByRole("radio", { name: condicao }));
const numero = (dente: number) => screen.getByRole("button", { name: `dente ${dente} inteiro` });
const nomeDoDente = (dente: number) => screen.getByRole("group", { name: new RegExp(`^Dente ${dente},`) }).getAttribute("aria-label");
const aviso = () => screen.getByRole("status").textContent;

describe("AbaOdontograma", () => {
  it("abre com a cárie escolhida e diz onde clicar", () => {
    render(<AbaOdontograma pacienteId="p1" />);

    expect((screen.getByRole("radio", { name: "Cárie" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("Clique numa face do dente para marcar ou desmarcar cárie.")).toBeTruthy();
  });

  it("aplica a condição na face clicada, avisa e a remove no segundo clique", () => {
    render(<AbaOdontograma pacienteId="p1" />);

    fireEvent.click(face("oclusal", 16));
    expect(nomeDaFace("oclusal", 16)).toBe("face oclusal do dente 16: cárie");
    expect(odontogramas.obter("p1")?.marcas).toEqual([{ dente: 16, face: "O", condicao: "carie" }]);
    expect(aviso()).toBe("Marcado: cárie na face oclusal do dente 16.");

    fireEvent.click(face("oclusal", 16));
    expect(nomeDaFace("oclusal", 16)).toBe("face oclusal do dente 16");
    expect(aviso()).toBe("Desmarcado: cárie na face oclusal do dente 16.");
  });

  it("marca também pelo teclado, com Enter na face", () => {
    render(<AbaOdontograma pacienteId="p1" />);

    fireEvent.keyDown(face("mesial", 26), { key: "Enter" });

    expect(nomeDaFace("mesial", 26)).toBe("face mesial do dente 26: cárie");
  });

  it("outra condição de face substitui a que estava na face", () => {
    render(<AbaOdontograma pacienteId="p1" />);
    fireEvent.click(face("oclusal", 16));

    escolher("Restauração");
    fireEvent.click(face("oclusal", 16));

    expect(nomeDaFace("oclusal", 16)).toBe("face oclusal do dente 16: restauração");
    expect(odontogramas.obter("p1")?.marcas).toHaveLength(1);
  });

  it("marca o dente inteiro pelo número, e as condições dele convivem", () => {
    render(<AbaOdontograma pacienteId="p1" />);

    escolher("Tratamento de canal");
    expect(screen.getByText("Clique no número do dente para marcar ou desmarcar tratamento de canal.")).toBeTruthy();
    fireEvent.click(numero(16));
    escolher("Coroa");
    fireEvent.click(numero(16));
    expect(nomeDoDente(16)).toBe("Dente 16, primeiro molar superior direito. Condições do dente: tratamento de canal, coroa");
    expect(aviso()).toBe("Marcado: coroa no dente 16.");

    fireEvent.click(numero(16));
    expect(nomeDoDente(16)).toBe("Dente 16, primeiro molar superior direito. Condições do dente: tratamento de canal");
    expect(aviso()).toBe("Desmarcado: coroa no dente 16.");
  });

  it("só marca onde a condição escolhida vale: na face, ou no número", () => {
    render(<AbaOdontograma pacienteId="p1" />);
    expect(screen.queryByRole("button", { name: "dente 16 inteiro" })).toBeNull();

    escolher("Coroa");
    expect(face("mesial", 16).getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(face("mesial", 16));

    expect(odontogramas.listar()).toEqual([]);
  });

  it("guarda por paciente: as marcas voltam ao reabrir a aba e não aparecem no outro paciente", () => {
    const { unmount } = render(<AbaOdontograma pacienteId="p1" />);
    fireEvent.click(face("oclusal", 16));
    unmount();

    const { unmount: fechar } = render(<AbaOdontograma pacienteId="p1" />);
    expect(nomeDaFace("oclusal", 16)).toBe("face oclusal do dente 16: cárie");
    fechar();

    render(<AbaOdontograma pacienteId="p2" />);
    expect(nomeDaFace("oclusal", 16)).toBe("face oclusal do dente 16");
  });
});
