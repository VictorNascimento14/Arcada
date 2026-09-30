import { describe, expect, it } from "vitest";

import type { Consulta, Paciente, Profissional } from "@/dominio";

import { linkDeConfirmacao, mensagemDeConfirmacao } from "./confirmacao";

// Tudo fictício. O telefone com DDD válido é o mesmo dos testes de contato; o com DDD 00 é o das sementes.
const PACIENTE: Paciente = { id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(11) 91234-5678" };
const PROFISSIONAL: Profissional = { id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" };
const CONSULTA: Consulta = {
  id: "k1", pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-09-30T08:00", duracaoMin: 45, situacao: "agendada", procedimentoId: "pr1",
};

describe("mensagemDeConfirmacao", () => {
  it("chama o paciente pelo primeiro nome e diz o dia por extenso, o horário e o profissional", () => {
    expect(mensagemDeConfirmacao(PACIENTE, CONSULTA, PROFISSIONAL)).toBe(
      "Olá, Ana! Confirmamos sua consulta em quarta-feira, 30 de setembro de 2026 às 08:00 com Dra. Exemplo. " +
        "Responda esta mensagem para confirmar sua presença ou, se precisar remarcar, é só avisar.",
    );
  });

  it("sem o profissional, não cita ninguém; espaços sobrando no nome não atrapalham", () => {
    const m = mensagemDeConfirmacao({ ...PACIENTE, nome: "  Ana   Beatriz " }, CONSULTA);

    expect(m).toContain("Olá, Ana! Confirmamos sua consulta em quarta-feira, 30 de setembro de 2026 às 08:00. Responda");
  });
});

describe("linkDeConfirmacao", () => {
  it("abre o wa.me do paciente com a mensagem codificada", () => {
    const link = linkDeConfirmacao(PACIENTE, CONSULTA, PROFISSIONAL)!;

    expect(link).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);
    expect(decodeURIComponent(link.split("?text=")[1])).toBe(mensagemDeConfirmacao(PACIENTE, CONSULTA, PROFISSIONAL));
  });

  it("telefone que não serve (DDD 00 das sementes, curto, vazio) não dá link", () => {
    for (const telefone of ["(00) 90000-0002", "12345", ""]) {
      expect(linkDeConfirmacao({ ...PACIENTE, telefone }, CONSULTA, PROFISSIONAL), telefone).toBeNull();
    }
  });
});
