import { describe, expect, it } from "vitest";

import type { Paciente, PlanoTratamento, SituacaoPlano } from "@/dominio";

import { resumoEmAberto } from "./resumoEmAberto";

const PACIENTES: Paciente[] = [{ id: "ana", nome: "Ana Exemplo", nascimento: "1990-01-01", telefone: "" }];

/** Um plano com um item para cada preço, em centavos. */
const plano = (id: string, situacao: SituacaoPlano, precos: number[], desconto = 0): PlanoTratamento => ({
  id,
  pacienteId: "ana",
  itens: precos.map((preco, i) => ({ id: `${id}-${i}`, procedimentoId: "proc", preco })),
  desconto,
  situacao,
});

describe("resumoEmAberto", () => {
  it("separa os orçamentos (propostos) dos tratamentos (aprovados e em andamento) e soma os totais já com o desconto", () => {
    const { orcamentos, tratamentos } = resumoEmAberto(
      [
        plano("p1", "proposto", [10000, 5000], 1000), // 14000
        plano("p2", "proposto", [20000]), // 20000
        plano("a1", "aprovado", [30000], 5000), // 25000
        plano("e1", "em-andamento", [8000]), // 8000
      ],
      PACIENTES,
    );

    expect(orcamentos).toEqual({ quantidade: 2, valor: 34000 });
    expect(tratamentos).toEqual({ quantidade: 2, valor: 33000 });
  });

  it("deixa de fora o concluído e o recusado", () => {
    const { orcamentos, tratamentos } = resumoEmAberto(
      [plano("p", "proposto", [10000]), plano("c", "concluido", [99999]), plano("r", "recusado", [99999])],
      PACIENTES,
    );

    expect(orcamentos).toEqual({ quantidade: 1, valor: 10000 });
    expect(tratamentos).toEqual({ quantidade: 0, valor: 0 });
  });

  it("o plano cujo desconto passa do subtotal conta, valendo zero, em vez de valer negativo", () => {
    expect(resumoEmAberto([plano("p", "proposto", [5000], 9000)], PACIENTES).orcamentos).toEqual({ quantidade: 1, valor: 0 });
  });

  it("plano de paciente que já não existe continua contando", () => {
    expect(resumoEmAberto([plano("p", "aprovado", [7000])], []).tratamentos).toEqual({ quantidade: 1, valor: 7000 });
  });

  it("sem plano, zero nos dois grupos", () => {
    expect(resumoEmAberto([], PACIENTES)).toEqual({
      orcamentos: { quantidade: 0, valor: 0 },
      tratamentos: { quantidade: 0, valor: 0 },
    });
  });
});
