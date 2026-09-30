import { describe, expect, it } from "vitest";

import type { Lancamento, Paciente, PlanoTratamento, SituacaoPlano } from "@/dominio";

import { planosParaParcelar } from "./aParcelar";

const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const plano = (id: string, pacienteId: string, situacao: SituacaoPlano): PlanoTratamento => ({ id, pacienteId, itens: [], desconto: 0, situacao });
const lancamento = (id: string, planoId: string): Lancamento => ({ id, pacienteId: "ana", planoId, valor: 1_000, vencimento: "2026-10-15" });

const PACIENTES = [paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo")];
const idsDe = (planos: PlanoTratamento[], lancamentos: Lancamento[] = []) => planosParaParcelar(planos, lancamentos, PACIENTES).map((e) => e.plano.id);

describe("planos para parcelar", () => {
  it("só os aprovados e em andamento: proposto, concluído e recusado ficam de fora", () => {
    const todos: SituacaoPlano[] = ["proposto", "aprovado", "em-andamento", "concluido", "recusado"];
    expect(idsDe(todos.map((s) => plano(s, "ana", s)))).toEqual(["aprovado", "em-andamento"]);
  });

  it("quem já tem lançamento não volta à lista", () => {
    const planos = [plano("a", "ana", "aprovado"), plano("b", "bruno", "em-andamento")];
    expect(idsDe(planos, [lancamento("l1", "a")])).toEqual(["b"]);
  });

  it("ordena pelo nome do paciente e, no mesmo paciente, pela ordem de criação", () => {
    const planos = [plano("b1", "bruno", "aprovado"), plano("a1", "ana", "aprovado"), plano("a2", "ana", "em-andamento")];
    expect(idsDe(planos)).toEqual(["a1", "a2", "b1"]);
  });

  it("plano de paciente que não existe entra sem `paciente`, em vez de sumir", () => {
    expect(planosParaParcelar([plano("a", "sumiu", "aprovado")], [], PACIENTES)).toEqual([{ plano: plano("a", "sumiu", "aprovado"), paciente: undefined }]);
  });
});
