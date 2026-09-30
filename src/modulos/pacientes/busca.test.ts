import { describe, expect, it } from "vitest";

import type { Paciente } from "@/dominio";

import { filtrarPacientes } from "./busca";

const paciente = (id: string, nome: string, telefone = ""): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone });

// Tudo fictício: telefones com DDD 00, que não existe.
const LISTA = [
  paciente("joao", "João Pedro Alves", "(00) 90000-0005"),
  paciente("ana", "Ana Beatriz Moura", "(00) 90000-0002"),
  paciente("angela", "Ângela Prado", "+55 (00) 91111-2222"),
  paciente("sebastiao", "Sebastião Ribeiro", "(00) 3333-4444"),
];

const ids = (r: Paciente[]) => r.map((p) => p.id);

describe("filtrarPacientes", () => {
  it("sem termo devolve todos em ordem alfabética, sem o acento deslocar ninguém", () => {
    expect(ids(filtrarPacientes(LISTA, ""))).toEqual(["ana", "angela", "joao", "sebastiao"]);
    expect(ids(filtrarPacientes(LISTA, "   "))).toEqual(["ana", "angela", "joao", "sebastiao"]);
  });

  it("não altera a lista recebida", () => {
    filtrarPacientes(LISTA, "");
    expect(ids(LISTA)).toEqual(["joao", "ana", "angela", "sebastiao"]);
  });

  it("acha o nome sem distinguir acento nem caixa", () => {
    expect(ids(filtrarPacientes(LISTA, "joao"))).toEqual(["joao"]);
    expect(ids(filtrarPacientes(LISTA, "JOÃO"))).toEqual(["joao"]);
    expect(ids(filtrarPacientes(LISTA, "angela"))).toEqual(["angela"]);
    expect(ids(filtrarPacientes(LISTA, "sebastião"))).toEqual(["sebastiao"]);
  });

  it("acha o nome por trecho, em qualquer posição, ignorando espaço a mais", () => {
    expect(ids(filtrarPacientes(LISTA, "pedro"))).toEqual(["joao"]);
    expect(ids(filtrarPacientes(LISTA, "  ana   beatriz "))).toEqual(["ana"]);
  });

  it("acha o telefone pelos dígitos, com ou sem máscara", () => {
    expect(ids(filtrarPacientes(LISTA, "0005"))).toEqual(["joao"]);
    expect(ids(filtrarPacientes(LISTA, "(00) 90000-0002"))).toEqual(["ana"]);
    expect(ids(filtrarPacientes(LISTA, "3333-4444"))).toEqual(["sebastiao"]);
    expect(ids(filtrarPacientes(LISTA, "90000"))).toEqual(["ana", "joao"]);
  });

  it("aceita o número completo com +55, guardado ou não com o país", () => {
    expect(ids(filtrarPacientes(LISTA, "+55 (00) 90000-0005"))).toEqual(["joao"]);
    expect(ids(filtrarPacientes(LISTA, "+55 (00) 91111-2222"))).toEqual(["angela"]);
    expect(ids(filtrarPacientes(LISTA, "(00) 91111-2222"))).toEqual(["angela"]);
  });

  it("termo com letra e número é nome: não vira busca de telefone", () => {
    expect(filtrarPacientes(LISTA, "ana 9")).toEqual([]);
  });

  it("devolve lista vazia quando ninguém casa", () => {
    expect(filtrarPacientes(LISTA, "zzz")).toEqual([]);
    expect(filtrarPacientes(LISTA, "99999")).toEqual([]);
  });

  it("paciente sem telefone não é achado por dígitos e não quebra a busca", () => {
    expect(filtrarPacientes([paciente("x", "Sem Telefone")], "0005")).toEqual([]);
  });
});
