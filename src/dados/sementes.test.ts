import { beforeEach, describe, expect, it, vi } from "vitest";

import { cadeiras, clinica, pacientes, profissionais } from "./colecoes";
import { carregarSementes, semeadorDoNucleo } from "./sementes";

beforeEach(() => {
  localStorage.clear();
  for (const c of [clinica, profissionais, cadeiras, pacientes]) c.substituirTudo([]);
});

describe("carregarSementes", () => {
  it("planta o núcleo na primeira carga", () => {
    carregarSementes([semeadorDoNucleo]);
    expect(clinica.listar()).toHaveLength(1);
    expect(profissionais.listar()).toHaveLength(2);
    expect(cadeiras.listar()).toHaveLength(2);
    expect(pacientes.listar()).toHaveLength(8);
  });

  it("roda uma vez por versão", () => {
    const semear = vi.fn();
    carregarSementes([{ chave: "teste", versao: 1, semear }]);
    carregarSementes([{ chave: "teste", versao: 1, semear }]);
    expect(semear).toHaveBeenCalledTimes(1);
    carregarSementes([{ chave: "teste", versao: 2, semear }]);
    expect(semear).toHaveBeenCalledTimes(2);
  });

  it("não sobrescreve o que o usuário já tem", () => {
    pacientes.substituirTudo([{ id: "meu", nome: "Paciente Exemplo", nascimento: "2000-01-01", telefone: "(00) 90000-0000" }]);
    carregarSementes([semeadorDoNucleo]);
    expect(pacientes.listar().map((p) => p.id)).toEqual(["meu"]);
  });

  it("não traz CPF nas sementes", () => {
    carregarSementes([semeadorDoNucleo]);
    expect(pacientes.listar().some((p) => p.cpf)).toBe(false);
  });
});
