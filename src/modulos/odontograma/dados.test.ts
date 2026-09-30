import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { alternarMarcaDoPaciente, odontogramas, useMarcas } from "./dados";

beforeEach(() => odontogramas.substituirTudo([]));

describe("alternarMarcaDoPaciente", () => {
  it("guarda a marca no odontograma do paciente e a remove ao repetir", () => {
    const marca = { dente: 16, face: "O", condicao: "carie" } as const;

    expect(alternarMarcaDoPaciente("p1", marca)).toBe(true);
    expect(odontogramas.obter("p1")).toEqual({ id: "p1", marcas: [marca] });

    expect(alternarMarcaDoPaciente("p1", marca)).toBe(false);
    expect(odontogramas.obter("p1")?.marcas).toEqual([]);
  });

  it("cada paciente tem o seu odontograma", () => {
    alternarMarcaDoPaciente("p1", { dente: 16, condicao: "coroa" });
    alternarMarcaDoPaciente("p2", { dente: 26, condicao: "implante" });

    expect(odontogramas.obter("p1")?.marcas).toEqual([{ dente: 16, condicao: "coroa" }]);
    expect(odontogramas.obter("p2")?.marcas).toEqual([{ dente: 26, condicao: "implante" }]);
  });

  it("recusa a marca que não faz sentido, sem gravar nada", () => {
    expect(() => alternarMarcaDoPaciente("p1", { dente: 16, face: "I", condicao: "carie" })).toThrow(RangeError);
    expect(odontogramas.listar()).toEqual([]);
  });

  it("recusa paciente sem id", () => {
    expect(() => alternarMarcaDoPaciente("", { dente: 16, condicao: "coroa" })).toThrow();
  });
});

describe("useMarcas", () => {
  it("devolve sempre o mesmo array vazio a quem nunca foi marcado e acompanha as gravações", () => {
    const { result, rerender } = renderHook(() => useMarcas("p1"));
    const vazio = result.current;
    expect(vazio).toEqual([]);
    rerender();
    expect(result.current).toBe(vazio);

    act(() => {
      alternarMarcaDoPaciente("p1", { dente: 16, condicao: "coroa" });
    });
    expect(result.current).toEqual([{ dente: 16, condicao: "coroa" }]);
  });
});
