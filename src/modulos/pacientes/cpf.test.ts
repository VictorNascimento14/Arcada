import { describe, expect, it } from "vitest";

import { cpfValido, formatarCpf, limparCpf } from "./cpf";

/**
 * Completa 9 dígitos quaisquer com os dois verificadores. Todo CPF que este arquivo usa nasce aqui —
 * nenhum é escrito à mão. A conta está feita de outro jeito que a do módulo (pesos contados da direita,
 * `(soma × 10) mod 11`), para o teste não repetir o código que confere.
 */
function comVerificadores(base: string): string {
  const verificador = (digitos: number[]) => {
    const soma = [...digitos].reverse().reduce((acc, n, i) => acc + n * (i + 2), 0);
    return ((soma * 10) % 11) % 10;
  };
  const d1 = verificador(Array.from(base, Number));
  const d2 = verificador(Array.from(`${base}${d1}`, Number));
  return `${base}${d1}${d2}`;
}

/** Mil bases de 9 dígitos, com zeros à esquerda nas primeiras — passam pelos dois ramos do resto. */
const bases = Array.from({ length: 1000 }, (_, i) => String((i + 1) * 104_729).padStart(9, "0"));
const cpf = comVerificadores(bases[500]);

describe("limparCpf", () => {
  it("deixa só os dígitos, com os zeros à esquerda", () => {
    expect(limparCpf(" 012.345.67-8 x")).toBe("012345678");
  });

  it("desfaz a máscara", () => {
    expect(limparCpf(formatarCpf(cpf))).toBe(cpf);
  });
});

describe("formatarCpf", () => {
  it.each([
    ["", ""],
    ["1", "1"],
    ["123", "123"],
    ["1234", "123.4"],
    ["123456", "123.456"],
    ["1234567", "123.456.7"],
    ["123456789", "123.456.789"],
    ["1234567890", "123.456.789-0"],
  ])("mascara a digitação parcial %j como %j", (entrada, esperado) => {
    expect(formatarCpf(entrada)).toBe(esperado);
  });

  it("mascara o CPF completo e não muda ao mascarar de novo", () => {
    const mascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    expect(formatarCpf(cpf)).toBe(mascarado);
    expect(formatarCpf(mascarado)).toBe(mascarado);
  });

  it("ignora o que não é dígito e o que passa de 11 dígitos", () => {
    expect(formatarCpf("12a3b4")).toBe("123.4");
    expect(formatarCpf(`${cpf}999`)).toBe(formatarCpf(cpf));
  });

  it("nunca termina em separador, então o backspace não trava", () => {
    const cheio = formatarCpf(cpf);
    for (let n = cheio.length; n >= 0; n--) {
      expect(formatarCpf(cheio.slice(0, n))).not.toMatch(/[.-]$/);
    }
  });
});

describe("cpfValido", () => {
  it("aceita todo CPF calculado, com e sem máscara", () => {
    for (const base of bases) {
      const calculado = comVerificadores(base);
      expect(cpfValido(calculado), base).toBe(true);
      expect(cpfValido(formatarCpf(calculado)), base).toBe(true);
    }
  });

  it("recusa o CPF com um dos dois verificadores trocado", () => {
    const troca = (c: string, pos: number) => `${c.slice(0, pos)}${(Number(c[pos]) + 1) % 10}${c.slice(pos + 1)}`;
    for (const base of bases) {
      const calculado = comVerificadores(base);
      expect(cpfValido(troca(calculado, 9)), base).toBe(false);
      expect(cpfValido(troca(calculado, 10)), base).toBe(false);
    }
  });

  it.each(Array.from({ length: 10 }, (_, d) => String(d)))("recusa os 11 dígitos %s iguais", (d) => {
    // A conta do módulo 11 fecha para as dez repetições: sem a regra explícita, elas passariam.
    expect(comVerificadores(d.repeat(9))).toBe(d.repeat(11));
    expect(cpfValido(d.repeat(11))).toBe(false);
    expect(cpfValido(formatarCpf(d.repeat(11)))).toBe(false);
  });

  it("recusa o que não tem 11 dígitos", () => {
    expect(cpfValido("")).toBe(false);
    expect(cpfValido("abc")).toBe(false);
    expect(cpfValido(cpf.slice(0, 10))).toBe(false);
    expect(cpfValido(`${cpf}0`)).toBe(false);
  });
});
