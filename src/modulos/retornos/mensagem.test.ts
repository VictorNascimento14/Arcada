import { describe, expect, it } from "vitest";

import type { Paciente } from "@/dominio";

import { linkDeRetorno, mensagemDeRetorno } from "./mensagem";

const paciente = (nome: string, telefone: string): Paciente => ({ id: "p1", nome, nascimento: "1990-01-01", telefone });

describe("mensagemDeRetorno", () => {
  it("chama o paciente só pelo primeiro nome", () => {
    const mensagem = mensagemDeRetorno(paciente("  Ana Beatriz   Moura ", ""));

    expect(mensagem).toBe("Olá, Ana! Está na hora do seu retorno ao consultório. Vamos marcar um horário? É só responder esta mensagem.");
    expect(mensagem).not.toContain("Beatriz");
    expect(mensagem).not.toContain("Moura");
  });

  it("não leva data nem número: nada do que o paciente fez na clínica", () => {
    expect(mensagemDeRetorno(paciente("Ana Moura", ""))).not.toMatch(/\d/);
  });
});

describe("linkDeRetorno", () => {
  it("abre o WhatsApp do paciente com a mensagem pronta na URL", () => {
    const ana = paciente("Ana Moura", "(11) 91234-5678");

    expect(linkDeRetorno(ana)).toBe(`https://wa.me/5511912345678?text=${encodeURIComponent(mensagemDeRetorno(ana))}`);
  });

  it("é null quando o telefone não serve: vazio, curto demais ou o DDD 00 das sementes", () => {
    for (const telefone of ["", "1234", "(00) 90000-0001"]) expect(linkDeRetorno(paciente("Ana Moura", telefone)), telefone).toBeNull();
  });
});
