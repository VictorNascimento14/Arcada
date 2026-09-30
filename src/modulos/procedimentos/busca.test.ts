import { describe, expect, it } from "vitest";

import type { Procedimento } from "@/dominio";

import { especialidadesDe, filtrarProcedimentos } from "./busca";

const proc = (id: string, nome: string, especialidade: string, codigo?: string): Procedimento => ({
  id,
  codigo,
  nome,
  especialidade,
  preco: 10000,
  duracaoMin: 30,
  exigeDente: false,
  exigeFace: false,
  ativo: true,
});

const LISTA: Procedimento[] = [
  proc("a", "Restauração em resina composta", "Dentística", "DEN-01"),
  proc("b", "Exodontia simples", "Cirurgia", "CIR-01"),
  proc("c", "Profilaxia (limpeza)", "Prevenção", "PRE-02"),
  proc("d", "Tratamento de canal, dente birradicular", "Endodontia", "END-02"),
  proc("e", "Clareamento de consultório", "Dentística", "DEN-03"),
];

const ids = (lista: Procedimento[]) => lista.map((p) => p.id);
const busca = (termo: string, especialidade = "") => ids(filtrarProcedimentos(LISTA, { termo, especialidade }));

describe("filtrarProcedimentos", () => {
  it("sem termo nem especialidade devolve todos, por especialidade do catálogo e, dentro dela, por nome", () => {
    // Prevenção, Dentística (Clareamento antes de Restauração), Endodontia, Cirurgia.
    expect(busca("")).toEqual(["c", "e", "a", "d", "b"]);
    expect(busca("   ")).toEqual(["c", "e", "a", "d", "b"]);
  });

  it("acha pelo nome sem distinguir acento nem caixa", () => {
    expect(busca("restauracao")).toEqual(["a"]);
    expect(busca("PROFILAXIA")).toEqual(["c"]);
    expect(busca("consultorio")).toEqual(["e"]);
  });

  it("exige todas as palavras, em qualquer ordem", () => {
    expect(busca("resina restauracao")).toEqual(["a"]);
    expect(busca("canal birradicular")).toEqual(["d"]);
    expect(busca("canal simples")).toEqual([]);
  });

  it("acha pelo código, inteiro ou por trecho", () => {
    expect(busca("cir-01")).toEqual(["b"]);
    expect(busca("den-0")).toEqual(["e", "a"]);
  });

  it("filtra pela especialidade e combina com a busca", () => {
    expect(busca("", "Dentística")).toEqual(["e", "a"]);
    expect(busca("resina", "Dentística")).toEqual(["a"]);
    expect(busca("resina", "Cirurgia")).toEqual([]);
  });

  it("procedimento sem código não casa com a palavra undefined", () => {
    const semCodigo = [proc("x", "Faceta em resina", "Dentística")];
    expect(filtrarProcedimentos(semCodigo, { termo: "undefined", especialidade: "" })).toEqual([]);
    expect(ids(filtrarProcedimentos(semCodigo, { termo: "faceta", especialidade: "" }))).toEqual(["x"]);
  });

  it("especialidade de fora do catálogo vem depois das do catálogo, e a lista recebida não é alterada", () => {
    const lista = [proc("z", "Acupuntura", "Outra área"), proc("y", "Exodontia", "Cirurgia")];
    expect(ids(filtrarProcedimentos(lista, { termo: "", especialidade: "" }))).toEqual(["y", "z"]);
    expect(ids(lista)).toEqual(["z", "y"]);
  });
});

describe("especialidadesDe", () => {
  it("lista só as que existem, na ordem do catálogo padrão e sem repetir", () => {
    expect(especialidadesDe(LISTA)).toEqual(["Prevenção", "Dentística", "Endodontia", "Cirurgia"]);
  });

  it("põe as de fora do catálogo depois, em ordem alfabética", () => {
    const lista = [proc("1", "A", "Zeta"), proc("2", "B", "Cirurgia"), proc("3", "C", "Alfa")];
    expect(especialidadesDe(lista)).toEqual(["Cirurgia", "Alfa", "Zeta"]);
  });

  it("sem procedimentos, nenhuma", () => {
    expect(especialidadesDe([])).toEqual([]);
  });
});
