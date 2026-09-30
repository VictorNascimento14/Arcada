import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";

import AbaPeriodonto from "./AbaPeriodonto";
import { examesPerio, type ExameSalvo } from "./dados";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(11) 90000-0002" };
const BRUNO: Paciente = { id: "p2", nome: "Bruno Cardoso Lima", nascimento: "1990-06-10", telefone: "(11) 90000-0003" };

const MARGEM = "Margem (+ recessão, − coronal)";
const campo = (rotulo: string, dente: number, sitio: string) => screen.getByLabelText(`${rotulo}, dente ${dente}, ${sitio}`) as HTMLInputElement;
const tabela = (arcada: "superior" | "inferior") => within(screen.getByRole("table", { name: `Arcada ${arcada}` }));
const digitar = (input: HTMLInputElement, valor: string) => fireEvent.change(input, { target: { value: valor } });
const exameDeHoje = (pacienteId = "p1") => examesPerio.listar().find((e) => e.pacienteId === pacienteId && e.data === "2026-09-30");

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([ANA, BRUNO]);
  examesPerio.substituirTudo([]);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 10, 0));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  pacientes.substituirTudo([]);
  examesPerio.substituirTudo([]);
});

describe("AbaPeriodonto", () => {
  it("abre com o exame de hoje em branco e as duas arcadas, a superior primeiro, na ordem em que se desenham", () => {
    render(<AbaPeriodonto pacienteId="p1" />);

    expect(screen.getByRole("heading", { name: "Exame periodontal de 30/09/2026" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Arcada superior", "Arcada inferior"]);
    expect(tabela("superior").getAllByRole("rowheader").map((d) => d.textContent)).toEqual(
      [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(String),
    );
    expect(tabela("inferior").getAllByRole("rowheader").map((d) => d.textContent)).toEqual(
      [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(String),
    );
    expect(screen.getAllByRole("spinbutton").every((c) => (c as HTMLInputElement).value === "")).toBe(true);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(32 * 12);
  });

  it("chama de palatino o lado de dentro da arcada superior — MP, P e DP —, e o campo da margem diz o sinal", () => {
    render(<AbaPeriodonto pacienteId="p1" />);

    expect(tabela("superior").getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
      "Dente",
      "Profundidade",
      MARGEM,
      ...["MV", "V", "DV", "MP", "P", "DP"],
      ...["MV", "V", "DV", "MP", "P", "DP"],
    ]);
    expect(campo(MARGEM, 16, "mesiopalatino")).toBeTruthy();
    expect(campo("Profundidade", 16, "distopalatino")).toBeTruthy();
  });

  it("chama de lingual o lado de dentro da arcada inferior — ML, L e DL —, e grava nela como na superior", () => {
    render(<AbaPeriodonto pacienteId="p1" />);

    expect(tabela("inferior").getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
      "Dente",
      "Profundidade",
      MARGEM,
      ...["MV", "V", "DV", "ML", "L", "DL"],
      ...["MV", "V", "DV", "ML", "L", "DL"],
    ]);
    digitar(campo("Profundidade", 36, "mesiolingual"), "5");
    digitar(campo(MARGEM, 36, "distolingual"), "-1");

    expect(exameDeHoje()?.dentes[36]?.sitios).toEqual({ ML: { profundidade: 5 }, DL: { margem: -1 } });
  });

  it("grava no exame de hoje o que se digita, e o campo mostra o valor gravado", () => {
    render(<AbaPeriodonto pacienteId="p1" />);

    digitar(campo("Profundidade", 16, "mesiovestibular"), "3");
    digitar(campo(MARGEM, 16, "mesiovestibular"), "-2");
    digitar(campo(MARGEM, 16, "vestibular"), "0");

    expect(exameDeHoje()?.dentes[16]?.sitios).toEqual({ MV: { profundidade: 3, margem: -2 }, V: { margem: 0 } });
    expect(campo("Profundidade", 16, "mesiovestibular").value).toBe("3");
    expect(campo(MARGEM, 16, "mesiovestibular").value).toBe("-2");
    expect(campo(MARGEM, 16, "vestibular").value).toBe("0"); // zero é medida, não campo vazio
  });

  it("esvaziar o campo apaga a medida", () => {
    render(<AbaPeriodonto pacienteId="p1" />);
    digitar(campo("Profundidade", 26, "palatino"), "4");

    digitar(campo("Profundidade", 26, "palatino"), "");

    expect(exameDeHoje()?.dentes[26]?.sitios?.L?.profundidade).toBeUndefined();
    expect(campo("Profundidade", 26, "palatino").value).toBe("");
  });

  it("rolar a roda do mouse sobre o campo em foco não muda a medida: o campo solta o foco", () => {
    render(<AbaPeriodonto pacienteId="p1" />);
    const c = campo("Profundidade", 16, "vestibular");
    digitar(c, "3");
    c.focus();

    fireEvent.wheel(c, { deltaY: -100 });

    expect(document.activeElement).not.toBe(c);
    expect(c.value).toBe("3");
  });

  it("recusa o valor fora do intervalo com um aviso, e o campo volta ao que estava", () => {
    render(<AbaPeriodonto pacienteId="p1" />);
    digitar(campo("Profundidade", 16, "vestibular"), "3");

    digitar(campo("Profundidade", 16, "vestibular"), "20");
    expect(screen.getByRole("status").textContent).toBe("Profundidade: use um número inteiro de 0 a 15 mm.");
    expect(campo("Profundidade", 16, "vestibular").value).toBe("3");
    expect(exameDeHoje()?.dentes[16]?.sitios?.V?.profundidade).toBe(3);

    digitar(campo(MARGEM, 16, "vestibular"), "2.5");
    expect(screen.getByRole("status").textContent).toBe("Margem (+ recessão, − coronal): use um número inteiro de −15 a 15 mm.");

    digitar(campo("Profundidade", 16, "vestibular"), "4"); // um valor bom limpa o aviso
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("reabre com o exame de hoje já gravado e ignora o de outro dia", () => {
    const hoje: ExameSalvo = { id: "e1", pacienteId: "p1", data: "2026-09-30", dentes: { 11: { sitios: { DV: { profundidade: 6, margem: 1 } } } } };
    const antigo: ExameSalvo = { id: "e0", pacienteId: "p1", data: "2026-09-01", dentes: { 11: { sitios: { DV: { profundidade: 9 } } } } };
    examesPerio.substituirTudo([antigo, hoje]);

    render(<AbaPeriodonto pacienteId="p1" />);

    expect(campo("Profundidade", 11, "distovestibular").value).toBe("6");
    expect(campo(MARGEM, 11, "distovestibular").value).toBe("1");
  });

  it("cada paciente tem o seu exame, e o aviso de um não aparece na tela do outro", () => {
    const { rerender } = render(<AbaPeriodonto pacienteId="p1" />);
    digitar(campo("Profundidade", 16, "vestibular"), "3");
    digitar(campo("Profundidade", 16, "vestibular"), "99");
    expect(screen.getByRole("status").textContent).not.toBe("");

    rerender(<AbaPeriodonto pacienteId="p2" />);

    expect(screen.getByRole("status").textContent).toBe("");
    expect(campo("Profundidade", 16, "vestibular").value).toBe("");
    digitar(campo("Profundidade", 16, "vestibular"), "2");
    expect(exameDeHoje("p2")?.dentes[16]?.sitios?.V?.profundidade).toBe(2);
    expect(exameDeHoje("p1")?.dentes[16]?.sitios?.V?.profundidade).toBe(3);
  });

  describe("teclado", () => {
    const tecla = (alvo: HTMLElement, key: string, mais: KeyboardEventInit = {}) => fireEvent.keyDown(alvo, { key, ...mais });
    const foco = () => document.activeElement?.getAttribute("aria-label");
    /** Foca o campo e aperta a tecla nele; devolve o rótulo de quem ficou com o foco. */
    const apertar = (key: string, rotulo: string, dente: number, sitio: string) => {
      const c = campo(rotulo, dente, sitio);
      c.focus();
      tecla(c, key);
      return foco();
    };

    it("a ordem do Tab é a da grade: os seis sítios da profundidade, depois os da margem, e então o dente seguinte", () => {
      render(<AbaPeriodonto pacienteId="p1" />);
      const sitios = ["mesiovestibular", "vestibular", "distovestibular", "mesiopalatino", "palatino", "distopalatino"];

      // Sem `tabindex`, o Tab segue a ordem do documento.
      expect(screen.getAllByRole("spinbutton").slice(0, 13).map((c) => c.getAttribute("aria-label"))).toEqual([
        ...sitios.map((s) => `Profundidade, dente 18, ${s}`),
        ...sitios.map((s) => `${MARGEM}, dente 18, ${s}`),
        "Profundidade, dente 17, mesiovestibular",
      ]);
    });

    it("a seta para a direita vai ao sítio seguinte, com o conteúdo selecionado, e a para a esquerda volta", () => {
      render(<AbaPeriodonto pacienteId="p1" />);
      const selecionar = vi.spyOn(HTMLInputElement.prototype, "select");

      expect(apertar("ArrowRight", "Profundidade", 16, "mesiovestibular")).toBe("Profundidade, dente 16, vestibular");
      expect(selecionar).toHaveBeenCalledTimes(1);
      expect(apertar("ArrowLeft", "Profundidade", 16, "vestibular")).toBe("Profundidade, dente 16, mesiovestibular");
    });

    it("da profundidade a seta segue para a margem, e da ponta da linha ao primeiro campo do dente seguinte", () => {
      render(<AbaPeriodonto pacienteId="p1" />);

      expect(apertar("ArrowRight", "Profundidade", 16, "distopalatino")).toBe(`${MARGEM}, dente 16, mesiovestibular`);
      expect(apertar("ArrowRight", MARGEM, 16, "distopalatino")).toBe("Profundidade, dente 15, mesiovestibular");
      expect(apertar("ArrowLeft", "Profundidade", 15, "mesiovestibular")).toBe(`${MARGEM}, dente 16, distopalatino`);
    });

    it("as setas para cima e para baixo vão ao mesmo campo do dente vizinho, na ordem em que a grade desenha", () => {
      render(<AbaPeriodonto pacienteId="p1" />);

      expect(apertar("ArrowDown", MARGEM, 16, "palatino")).toBe(`${MARGEM}, dente 15, palatino`);
      expect(apertar("ArrowUp", MARGEM, 15, "palatino")).toBe(`${MARGEM}, dente 16, palatino`);
      expect(apertar("ArrowUp", MARGEM, 16, "palatino")).toBe(`${MARGEM}, dente 17, palatino`);
    });

    it("passa da arcada superior para a inferior e volta", () => {
      render(<AbaPeriodonto pacienteId="p1" />);

      expect(apertar("ArrowDown", "Profundidade", 28, "vestibular")).toBe("Profundidade, dente 48, vestibular");
      expect(apertar("ArrowUp", "Profundidade", 48, "vestibular")).toBe("Profundidade, dente 28, vestibular");
    });

    it("nas pontas da grade a seta não sai dela nem soma ao valor", () => {
      render(<AbaPeriodonto pacienteId="p1" />);
      digitar(campo("Profundidade", 18, "mesiovestibular"), "3");

      expect(apertar("ArrowUp", "Profundidade", 18, "mesiovestibular")).toBe("Profundidade, dente 18, mesiovestibular");
      expect(apertar("ArrowLeft", "Profundidade", 18, "mesiovestibular")).toBe("Profundidade, dente 18, mesiovestibular");
      expect(apertar("ArrowDown", MARGEM, 38, "distolingual")).toBe(`${MARGEM}, dente 38, distolingual`);
      expect(apertar("ArrowRight", MARGEM, 38, "distolingual")).toBe(`${MARGEM}, dente 38, distolingual`);
      expect(campo("Profundidade", 18, "mesiovestibular").value).toBe("3");
    });

    it("só as setas sem modificador são da grade: Tab, dígitos e Shift+seta seguem com o navegador", () => {
      render(<AbaPeriodonto pacienteId="p1" />);
      const c = campo("Profundidade", 16, "vestibular");
      c.focus();

      expect(tecla(c, "ArrowRight")).toBe(false); // desviada: o `preventDefault` devolve `false`
      c.focus();
      expect(tecla(c, "Tab")).toBe(true);
      expect(tecla(c, "5")).toBe(true);
      expect(tecla(c, "ArrowRight", { shiftKey: true })).toBe(true);
      expect(foco()).toBe("Profundidade, dente 16, vestibular");
    });
  });
});
