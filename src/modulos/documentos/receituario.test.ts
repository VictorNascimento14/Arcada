import { describe, expect, it } from "vitest";

import type { Paciente, Profissional } from "@/dominio";

import { camposDoReceituario, LIMITE_DO_TEXTO, prepararReceituario, type CamposDoReceituario } from "./receituario";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002", email: "ana@exemplo.com" };
const DRA: Profissional = { id: "d1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b", especialidade: "Clínica geral" };

const campos = (extra: Partial<CamposDoReceituario> = {}): CamposDoReceituario => ({
  pacienteId: "p1",
  profissionalId: "d1",
  data: "2026-09-30",
  texto: "Texto do receituário.",
  ...extra,
});
const preparar = (c: CamposDoReceituario) => prepararReceituario(c, [ANA], [DRA]);

describe("camposDoReceituario", () => {
  it("abre na data dada, sem ninguém escolhido e com o texto vazio: nada é sugerido", () => {
    expect(camposDoReceituario("2026-09-30")).toEqual({ pacienteId: "", profissionalId: "", data: "2026-09-30", texto: "" });
  });
});

describe("prepararReceituario", () => {
  it("monta só o que vai para o papel: nome do paciente, nome e CRO de quem assina, data e texto", () => {
    const r = preparar(campos());

    expect(r).toEqual({
      ok: true,
      dados: {
        paciente: { nome: "Ana Beatriz Moura" },
        profissional: { nome: "Dra. Exemplo", cro: "CRO-SP 00000" },
        data: "2026-09-30",
        texto: "Texto do receituário.",
      },
    });
  });

  it("guarda as quebras de linha e o recuo de dentro do texto e corta só as pontas", () => {
    const r = preparar(campos({ texto: "\n  Primeira linha\n\n    Terceira, recuada\n \n" }));

    expect(r.ok && r.dados.texto).toBe("Primeira linha\n\n    Terceira, recuada");
  });

  it("aceita o texto no limite e recusa um caractere a mais", () => {
    expect(preparar(campos({ texto: "a".repeat(LIMITE_DO_TEXTO) })).ok).toBe(true);
    expect(preparar(campos({ texto: "a".repeat(LIMITE_DO_TEXTO + 1) }))).toEqual({
      ok: false,
      erros: { texto: `Use no máximo ${LIMITE_DO_TEXTO} caracteres.` },
    });
  });

  it("formulário em branco: um erro por campo, sem imprimir nada", () => {
    expect(prepararReceituario(camposDoReceituario(""), [ANA], [DRA])).toEqual({
      ok: false,
      erros: {
        pacienteId: "Escolha o paciente.",
        profissionalId: "Escolha o profissional.",
        data: "Informe a data.",
        texto: "Escreva o texto do receituário.",
      },
    });
  });

  it("texto só de espaços e data que o calendário não tem contam como vazios", () => {
    expect(preparar(campos({ texto: " \n\t " }))).toEqual({ ok: false, erros: { texto: "Escreva o texto do receituário." } });
    expect(preparar(campos({ data: "2026-02-30" }))).toEqual({ ok: false, erros: { data: "Informe a data." } });
  });

  it("profissional inativo não assina, mesmo escolhido antes de ser desativado", () => {
    const r = prepararReceituario(campos(), [ANA], [{ ...DRA, ativo: false }]);

    expect(r).toEqual({ ok: false, erros: { profissionalId: "Escolha o profissional." } });
  });
});
