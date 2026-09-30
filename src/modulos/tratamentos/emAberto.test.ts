import { describe, expect, it } from "vitest";

import type { Paciente, PlanoTratamento, SituacaoPlano } from "@/dominio";

import { planosEmAberto, SITUACOES_EM_ABERTO } from "./emAberto";
import { proximasSituacoes } from "./situacao";

const TODAS: SituacaoPlano[] = ["proposto", "aprovado", "em-andamento", "concluido", "recusado"];
const plano = (id: string, pacienteId: string, situacao: SituacaoPlano = "proposto"): PlanoTratamento => ({
  id,
  pacienteId,
  itens: [],
  desconto: 0,
  situacao,
});
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });

const PACIENTES = [paciente("ana", "Ana Exemplo"), paciente("agata", "Ágata Exemplo"), paciente("bruno", "Bruno Exemplo")];
const ids = (r: ReturnType<typeof planosEmAberto>) => r.map((x) => x.plano.id);

describe("SITUACOES_EM_ABERTO", () => {
  it("são as que ainda têm próximo passo: só o concluído e o recusado, o fim do caminho, ficam de fora", () => {
    expect(TODAS.filter((s) => proximasSituacoes(s).length > 0)).toEqual(SITUACOES_EM_ABERTO);
  });
});

describe("planosEmAberto", () => {
  it("deixa de fora o concluído e o recusado", () => {
    const planos = TODAS.map((s) => plano(s, "ana", s));
    expect(ids(planosEmAberto(planos, PACIENTES))).toEqual(["proposto", "aprovado", "em-andamento"]);
  });

  it("põe os propostos primeiro e, em cada grupo, ordena pelo nome do paciente (Ágata antes de Ana)", () => {
    const planos = [
      plano("b-andamento", "bruno", "em-andamento"),
      plano("ana-aprovado", "ana", "aprovado"),
      plano("bruno-proposto", "bruno"),
      plano("ana-proposto", "ana"),
      plano("agata-proposto", "agata"),
    ];
    expect(ids(planosEmAberto(planos, PACIENTES))).toEqual(["agata-proposto", "ana-proposto", "bruno-proposto", "ana-aprovado", "b-andamento"]);
  });

  it("no mesmo paciente e na mesma situação, mantém a ordem em que os planos foram criados", () => {
    const planos = [plano("segundo", "ana"), plano("primeiro", "ana")];
    expect(ids(planosEmAberto(planos, PACIENTES))).toEqual(["segundo", "primeiro"]);
  });

  it("entrega o paciente de cada plano; o de paciente que não existe entra sem ele, à frente do grupo", () => {
    const [semPaciente, comPaciente] = planosEmAberto([plano("a", "ana"), plano("x", "sumiu")], PACIENTES);

    expect(semPaciente.plano.id).toBe("x"); // o nome vazio ordena antes de "Ana": a anomalia aparece em vez de esconder-se no fim
    expect(semPaciente.paciente).toBeUndefined();
    expect(comPaciente.plano.id).toBe("a");
    expect(comPaciente.paciente?.nome).toBe("Ana Exemplo");
  });

  it("sem plano, ou só com planos encerrados, devolve lista vazia", () => {
    expect(planosEmAberto([], PACIENTES)).toEqual([]);
    expect(planosEmAberto([plano("a", "ana", "concluido"), plano("b", "ana", "recusado")], PACIENTES)).toEqual([]);
  });
});
