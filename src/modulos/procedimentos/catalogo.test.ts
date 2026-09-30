import { describe, expect, it } from "vitest";

import { CONDICOES } from "@/modulos/odontograma/condicoes";

import { CATALOGO, ESPECIALIDADES } from "./catalogo";

const especialidades: readonly string[] = ESPECIALIDADES;

describe("catálogo padrão de procedimentos", () => {
  it("tem cerca de trinta procedimentos, e cada especialidade da lista aparece", () => {
    expect(CATALOGO.length).toBeGreaterThanOrEqual(30);
    expect(CATALOGO.every((p) => especialidades.includes(p.especialidade))).toBe(true);
    for (const e of ESPECIALIDADES) expect(CATALOGO.some((p) => p.especialidade === e), e).toBe(true);
  });

  it("id, código e nome não se repetem", () => {
    for (const campo of ["id", "codigo", "nome"] as const) {
      expect(new Set(CATALOGO.map((p) => p[campo])).size, campo).toBe(CATALOGO.length);
    }
  });

  it("o código é próprio (sigla e dois dígitos, não os oito dígitos da TUSS) e a sigla é de uma especialidade só", () => {
    const dono = new Map<string, string>();
    for (const p of CATALOGO) {
      expect(p.codigo, p.nome).toMatch(/^[A-Z]{3}-\d{2}$/);
      const sigla = p.codigo!.slice(0, 3);
      expect(dono.get(sigla) ?? p.especialidade, p.nome).toBe(p.especialidade);
      dono.set(sigla, p.especialidade);
    }
  });

  it("entra ativo, com preço em centavos inteiros e duração em minutos inteiros, todos positivos", () => {
    for (const p of CATALOGO) {
      expect(p.ativo, p.nome).toBe(true);
      expect(Number.isInteger(p.preco) && p.preco > 0, `${p.nome}: preço`).toBe(true);
      expect(Number.isInteger(p.duracaoMin) && p.duracaoMin > 0, `${p.nome}: duração`).toBe(true);
    }
  });

  it("exigir a face implica exigir o dente", () => {
    for (const p of CATALOGO) if (p.exigeFace) expect(p.exigeDente, p.nome).toBe(true);
  });

  it("a condição resultante é do odontograma, e o procedimento exige o dente e, se a condição é de face, a face", () => {
    for (const p of CATALOGO) {
      if (p.condicaoResultante === undefined) continue;
      const condicao = CONDICOES.find((c) => c.id === p.condicaoResultante);
      expect(condicao, `${p.nome}: condição "${p.condicaoResultante}"`).toBeDefined();
      expect(p.exigeDente, p.nome).toBe(true);
      expect(p.exigeFace, p.nome).toBe(condicao?.escopo === "face");
    }
  });

  it("restauração, selante, exodontia, canal, coroa e implante deixam a marca certa no dente", () => {
    const condicao = (codigo: string) => CATALOGO.find((p) => p.codigo === codigo)?.condicaoResultante;
    expect(condicao("DEN-01")).toBe("restauracao");
    expect(condicao("PRE-04")).toBe("selante");
    expect(condicao("CIR-01")).toBe("ausente");
    expect(condicao("CIR-03")).toBe("ausente");
    expect(condicao("END-02")).toBe("tratamentoDeCanal");
    expect(condicao("PRO-01")).toBe("coroa");
    expect(condicao("IMP-01")).toBe("implante");
    expect(condicao("PRE-02")).toBeUndefined(); // limpeza não muda o desenho do dente
  });
});
