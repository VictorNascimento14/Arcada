import { describe, expect, it } from "vitest";

import { croValido, formatarCro, UFS } from "./cro";

describe("UFS", () => {
  it("são as 27 siglas, em ordem alfabética e sem repetir", () => {
    expect(UFS).toHaveLength(27);
    expect(new Set(UFS).size).toBe(27);
    expect([...UFS]).toEqual([...UFS].sort());
  });
});

describe("croValido", () => {
  it.each(["CRO-SP 12345", "CRO-DF 1", "CRO-RJ 123456", "CRO-MG 00000"])("aceita %s", (cro) => {
    expect(croValido(cro)).toBe(true);
  });

  it("aceita cada uma das 27 UFs", () => {
    for (const uf of UFS) expect(croValido(`CRO-${uf} 123`)).toBe(true);
  });

  it.each([
    ["sem o número", "CRO-SP"],
    ["sem a UF", "CRO 12345"],
    ["número com 7 dígitos", "CRO-SP 1234567"],
    ["número com letra", "CRO-SP 12A45"],
    ["número negativo", "CRO-SP -1234"],
    ["sigla que não é de UF", "CRO-XX 12345"],
    ["\"UF\" escrito no lugar da sigla", "CRO-UF 00000"],
    ["minúsculas", "cro-sp 12345"],
    ["sem espaço entre a UF e o número", "CRO-SP12345"],
    ["barra no lugar do hífen", "CRO/SP 12345"],
    ["espaço nas pontas", " CRO-SP 12345 "],
    ["quebra de linha no fim", "CRO-SP 12345\n"],
    ["texto vazio", ""],
  ])("recusa %s", (_motivo, cro) => {
    expect(croValido(cro)).toBe(false);
  });
});

describe("formatarCro", () => {
  it.each([
    ["CRO-SP 12345", "CRO-SP 12345"],
    ["cro-sp 12345", "CRO-SP 12345"],
    ["cro sp 12345", "CRO-SP 12345"],
    ["CRO/SP 12345", "CRO-SP 12345"],
    ["CRO-SP12345", "CRO-SP 12345"],
    ["  CRO - rj -  987  ", "CRO-RJ 987"],
    ["SP 12345", "CRO-SP 12345"],
    ["sp12345", "CRO-SP 12345"],
    ["CRO-SP 00123", "CRO-SP 00123"],
  ])("leva %j para %s", (digitado, esperado) => {
    expect(formatarCro(digitado)).toBe(esperado);
  });

  it.each(["", "abc", "12345", "CRO 12345", "CRO-SP", "CRO-SP 1234567", "CRO-XX 123", "no 123"])(
    "não mexe no que não reconhece: %j",
    (texto) => {
      expect(formatarCro(texto)).toBe(texto);
    },
  );

  it("apara as pontas do que não reconhece", () => {
    expect(formatarCro("  CRO 12345 ")).toBe("CRO 12345");
  });

  it("devolve algo que croValido aceita, e repetir não muda mais nada", () => {
    for (const digitado of ["cro sp 1", "CRO/mg 654321", "  df 42 "]) {
      const cro = formatarCro(digitado);
      expect(croValido(cro)).toBe(true);
      expect(formatarCro(cro)).toBe(cro);
    }
  });
});
