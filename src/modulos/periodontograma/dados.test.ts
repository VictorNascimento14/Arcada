import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";

import { alternarSinal, examesPerio, registrarMedida, type ExameSalvo } from "./dados";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(11) 90000-0002" };
const BRUNO: Paciente = { id: "p2", nome: "Bruno Cardoso Lima", nascimento: "1990-06-10", telefone: "(11) 90000-0003" };

const exameDe = (pacienteId: string, data: string) => examesPerio.listar().find((e) => e.pacienteId === pacienteId && e.data === data);

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([ANA, BRUNO]);
  examesPerio.substituirTudo([]);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 23, 30)); // 23h30 local: `toISOString()` já daria o dia seguinte no Brasil
});

afterEach(() => {
  vi.useRealTimers();
  pacientes.substituirTudo([]);
  examesPerio.substituirTudo([]);
});

describe("registrarMedida", () => {
  it("cria o exame de hoje, com id próprio e o dia local, na primeira medida", () => {
    expect(registrarMedida("p1", 16, "MV", "profundidade", 3)).toBe(true);

    expect(examesPerio.listar()).toHaveLength(1);
    expect(examesPerio.listar()[0]).toMatchObject({
      pacienteId: "p1",
      data: "2026-09-30",
      dentes: { 16: { sitios: { MV: { profundidade: 3 } } } },
    });
    expect(examesPerio.listar()[0].id).toBeTruthy();
  });

  it("edita o mesmo exame no dia: profundidade e margem do sítio, e os outros sítios e dentes ficam", () => {
    registrarMedida("p1", 16, "MV", "profundidade", 3);
    registrarMedida("p1", 16, "MV", "margem", -2); // margem coronal: negativa
    registrarMedida("p1", 16, "V", "profundidade", 4);
    registrarMedida("p1", 26, "DL", "margem", 1);

    expect(examesPerio.listar()).toHaveLength(1);
    expect(exameDe("p1", "2026-09-30")?.dentes).toEqual({
      16: { sitios: { MV: { profundidade: 3, margem: -2 }, V: { profundidade: 4 } } },
      26: { sitios: { DL: { margem: 1 } } },
    });
  });

  it("não mexe no exame de outro dia nem no de outro paciente", () => {
    const anterior: ExameSalvo = { id: "antigo", pacienteId: "p1", data: "2026-09-01", dentes: { 16: { sitios: { MV: { profundidade: 5 } } } } };
    examesPerio.substituirTudo([anterior]);

    registrarMedida("p1", 16, "MV", "profundidade", 3);
    registrarMedida("p2", 16, "MV", "profundidade", 2);

    expect(examesPerio.obter("antigo")).toEqual(anterior);
    expect(exameDe("p1", "2026-09-30")?.dentes[16]?.sitios?.MV).toEqual({ profundidade: 3 });
    expect(exameDe("p2", "2026-09-30")?.dentes[16]?.sitios?.MV).toEqual({ profundidade: 2 });
    expect(examesPerio.listar()).toHaveLength(3);
  });

  it("apaga o campo com `undefined`, e apagar o que não existe não cria exame", () => {
    expect(registrarMedida("p1", 16, "MV", "profundidade", undefined)).toBe(true);
    expect(examesPerio.listar()).toEqual([]);

    registrarMedida("p1", 16, "MV", "profundidade", 3);
    registrarMedida("p1", 16, "MV", "margem", 1);
    registrarMedida("p1", 16, "MV", "profundidade", undefined);

    expect(exameDe("p1", "2026-09-30")?.dentes[16]?.sitios?.MV).toEqual({ margem: 1 });
    expect("profundidade" in (exameDe("p1", "2026-09-30")?.dentes[16]?.sitios?.MV ?? {})).toBe(false);
  });

  it("recusa, sem gravar, o valor fora do intervalo ou não inteiro", () => {
    expect(registrarMedida("p1", 16, "MV", "profundidade", 16)).toBe(false);
    expect(registrarMedida("p1", 16, "MV", "profundidade", -1)).toBe(false);
    expect(registrarMedida("p1", 16, "MV", "profundidade", 2.5)).toBe(false);
    expect(registrarMedida("p1", 16, "MV", "margem", -16)).toBe(false);
    expect(registrarMedida("p1", 16, "MV", "margem", Number.NaN)).toBe(false);

    expect(examesPerio.listar()).toEqual([]);
  });

  it("recusa dente que a FDI não tem e paciente que não existe", () => {
    expect(registrarMedida("p1", 19, "MV", "profundidade", 3)).toBe(false);
    expect(registrarMedida("nao-existe", 16, "MV", "profundidade", 3)).toBe(false);

    expect(examesPerio.listar()).toEqual([]);
  });
});

describe("alternarSinal", () => {
  it("liga o sinal do sítio no exame de hoje e o desliga no segundo toque, tirando o campo", () => {
    expect(alternarSinal("p1", 16, "MV", "sangramento")).toBe(true);
    expect(exameDe("p1", "2026-09-30")?.dentes[16]?.sitios?.MV).toEqual({ sangramento: true });

    expect(alternarSinal("p1", 16, "MV", "sangramento")).toBe(true);
    const medida = exameDe("p1", "2026-09-30")?.dentes[16]?.sitios?.MV ?? {};
    expect(medida).toEqual({});
    expect("sangramento" in medida).toBe(false);
  });

  it("sangramento e supuração são independentes entre si e convivem com as medidas do sítio", () => {
    registrarMedida("p1", 16, "MV", "profundidade", 4);
    alternarSinal("p1", 16, "MV", "sangramento");
    alternarSinal("p1", 16, "MV", "supuracao");
    alternarSinal("p1", 16, "MV", "sangramento");

    expect(exameDe("p1", "2026-09-30")?.dentes[16]?.sitios).toEqual({ MV: { profundidade: 4, supuracao: true } });
  });

  it("recusa dente que a FDI não tem e paciente que não existe, sem gravar", () => {
    expect(alternarSinal("p1", 19, "MV", "sangramento")).toBe(false);
    expect(alternarSinal("nao-existe", 16, "MV", "supuracao")).toBe(false);

    expect(examesPerio.listar()).toEqual([]);
  });
});
