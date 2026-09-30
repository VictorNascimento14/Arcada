import { describe, expect, it } from "vitest";

import type { Paciente, Profissional } from "@/dominio";

import { dataValida, resolverEscolha } from "./validacao";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" };
const DRA: Profissional = { id: "d1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" };
const ANTIGO: Profissional = { id: "d2", nome: "Dr. Antigo", cro: "CRO-SP 00009", cor: "#4a6fa5", ativo: false };

describe("dataValida", () => {
  it("aceita um dia que existe, inclusive 29 de fevereiro de ano bissexto", () => {
    expect(dataValida("2026-09-30")).toBe(true);
    expect(dataValida("2024-02-29")).toBe(true);
  });

  it("recusa formato errado, campo vazio e dia que o calendário não tem", () => {
    for (const dia of ["", "30/09/2026", "2026-9-1", "2026-02-29", "2026-02-30", "2026-13-01"]) expect(dataValida(dia), dia).toBe(false);
  });
});

describe("resolverEscolha", () => {
  it("acha o paciente e o profissional; sem o campo `ativo`, o profissional conta como ativo", () => {
    const r = resolverEscolha("p1", "d1", [ANA], [DRA, ANTIGO]);

    expect(r.paciente).toBe(ANA);
    expect(r.profissional).toBe(DRA);
    expect(r.erros).toEqual({});
  });

  it("sem escolha, ou com id que não existe mais, devolve o erro de cada campo", () => {
    expect(resolverEscolha("", "", [ANA], [DRA]).erros).toEqual({
      pacienteId: "Escolha o paciente.",
      profissionalId: "Escolha o profissional.",
    });
    const removido = resolverEscolha("p9", "d1", [ANA], [DRA]);
    expect(removido.paciente).toBeUndefined();
    expect(removido.erros).toEqual({ pacienteId: "Escolha o paciente." });
  });

  it("profissional inativo, escolhido antes de ser desativado, não assina", () => {
    const r = resolverEscolha("p1", "d2", [ANA], [DRA, ANTIGO]);

    expect(r.profissional).toBeUndefined();
    expect(r.erros).toEqual({ profissionalId: "Escolha o profissional." });
  });
});
