import { describe, expect, it } from "vitest";

import { feriadoDoDia, feriadosDoAno, pascoa } from "./feriados";

describe("pascoa", () => {
  it.each([
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2000, "2000-04-23"],
    // Os extremos: a Páscoa mais cedo (22/03) e a mais tarde (25/04) possíveis.
    [1818, "1818-03-22"],
    [1943, "1943-04-25"],
    // Os anos em que a fórmula sem a correção do termo `m` erra em uma semana.
    [1954, "1954-04-18"],
    [1981, "1981-04-19"],
    [2049, "2049-04-18"],
    [2076, "2076-04-19"],
  ])("a Páscoa de %i cai em %s", (ano, esperado) => {
    expect(pascoa(ano)).toBe(esperado);
  });

  it("recusa ano fora do calendário gregoriano", () => {
    expect(() => pascoa(1582)).toThrow(RangeError);
    expect(() => pascoa(10000)).toThrow(RangeError);
    expect(() => pascoa(2026.5)).toThrow(RangeError);
    expect(() => pascoa(NaN)).toThrow(RangeError);
  });
});

describe("feriadosDoAno", () => {
  it("lista os 12 feriados de 2026 em ordem de data", () => {
    expect(feriadosDoAno(2026)).toEqual([
      { dia: "2026-01-01", nome: "Confraternização Universal", tipo: "feriado" },
      { dia: "2026-02-17", nome: "Carnaval", tipo: "facultativo" },
      { dia: "2026-04-03", nome: "Sexta-feira Santa", tipo: "feriado" },
      { dia: "2026-04-21", nome: "Tiradentes", tipo: "feriado" },
      { dia: "2026-05-01", nome: "Dia do Trabalho", tipo: "feriado" },
      { dia: "2026-06-04", nome: "Corpus Christi", tipo: "facultativo" },
      { dia: "2026-09-07", nome: "Independência do Brasil", tipo: "feriado" },
      { dia: "2026-10-12", nome: "Nossa Senhora Aparecida", tipo: "feriado" },
      { dia: "2026-11-02", nome: "Finados", tipo: "feriado" },
      { dia: "2026-11-15", nome: "Proclamação da República", tipo: "feriado" },
      { dia: "2026-11-20", nome: "Dia da Consciência Negra", tipo: "feriado" },
      { dia: "2026-12-25", nome: "Natal", tipo: "feriado" },
    ]);
  });

  it("marca só Carnaval e Corpus Christi como ponto facultativo", () => {
    const facultativos = feriadosDoAno(2025).filter((f) => f.tipo === "facultativo");
    expect(facultativos.map((f) => [f.nome, f.dia])).toEqual([
      ["Carnaval", "2025-03-04"],
      ["Corpus Christi", "2025-06-19"],
    ]);
  });

  it("acompanha a Páscoa: Carnaval 47 dias antes, Sexta-feira Santa 2 antes, Corpus Christi 60 depois", () => {
    const dia = (ano: number, nome: string) => feriadosDoAno(ano).find((f) => f.nome === nome)?.dia;
    expect(dia(2024, "Carnaval")).toBe("2024-02-13");
    expect(dia(2024, "Sexta-feira Santa")).toBe("2024-03-29");
    expect(dia(2024, "Corpus Christi")).toBe("2024-05-30");
    expect(dia(2027, "Sexta-feira Santa")).toBe("2027-03-26");
  });

  it("atravessa o fim de fevereiro certo em ano bissexto e em ano comum", () => {
    // Páscoa em 27/03/2016: 47 dias antes passa pelo 29/02.
    expect(feriadosDoAno(2016).find((f) => f.nome === "Carnaval")?.dia).toBe("2016-02-09");
    // Páscoa em 05/04/2026: 47 dias antes passa pelo 28/02.
    expect(feriadosDoAno(2026).find((f) => f.nome === "Carnaval")?.dia).toBe("2026-02-17");
  });

  it("só conta o Dia da Consciência Negra como nacional a partir de 2024", () => {
    const tem = (ano: number) => feriadosDoAno(ano).some((f) => f.dia === `${ano}-11-20`);
    expect(tem(2023)).toBe(false);
    expect(tem(2024)).toBe(true);
    expect(feriadosDoAno(2023)).toHaveLength(11);
    expect(feriadosDoAno(2024)).toHaveLength(12);
  });

  it("mantém os dois quando a Sexta-feira Santa cai num feriado fixo (Tiradentes, em 2000)", () => {
    const do21 = feriadosDoAno(2000).filter((f) => f.dia === "2000-04-21");
    expect(do21.map((f) => f.nome)).toEqual(["Tiradentes", "Sexta-feira Santa"]);
  });

  it("devolve lista vazia fora do calendário gregoriano ou com ano que não é inteiro", () => {
    expect(feriadosDoAno(1582)).toEqual([]);
    expect(feriadosDoAno(10000)).toEqual([]);
    expect(feriadosDoAno(2026.5)).toEqual([]);
    expect(feriadosDoAno(NaN)).toEqual([]);
  });
});

describe("feriadoDoDia", () => {
  it("acha feriado fixo, móvel e ponto facultativo", () => {
    expect(feriadoDoDia("2026-09-07")).toEqual({ dia: "2026-09-07", nome: "Independência do Brasil", tipo: "feriado" });
    expect(feriadoDoDia("2026-04-03")).toEqual({ dia: "2026-04-03", nome: "Sexta-feira Santa", tipo: "feriado" });
    expect(feriadoDoDia("2026-02-17")).toEqual({ dia: "2026-02-17", nome: "Carnaval", tipo: "facultativo" });
  });

  it("devolve undefined em dia comum, inclusive o domingo de Páscoa e a segunda de Carnaval", () => {
    expect(feriadoDoDia("2026-09-08")).toBeUndefined();
    expect(feriadoDoDia("2026-04-05")).toBeUndefined();
    expect(feriadoDoDia("2026-02-16")).toBeUndefined();
  });

  it("no dia em que dois coincidem, devolve o primeiro da lista", () => {
    expect(feriadoDoDia("2000-04-21")?.nome).toBe("Tiradentes");
  });

  it.each(["", "abcd", "07/09/2026", "2026-9-7", "2026-09-07 ", "2026-13-01", "1200-01-01"])(
    "devolve undefined para %j, sem lançar",
    (dia) => {
      expect(feriadoDoDia(dia)).toBeUndefined();
    },
  );
});
