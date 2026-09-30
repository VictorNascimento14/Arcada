import { describe, expect, it } from "vitest";

import { indicesDoExame, type IndicesPerio } from "./exame";
import { cartoesDosIndices } from "./indices";

const indices = (mais: Partial<IndicesPerio> = {}): IndicesPerio => ({
  sitiosMedidos: 6,
  percentualSangramento: 50,
  profundidadeMedia: 3,
  sitiosComProfundidade4mmOuMais: 0,
  sitiosComInsercao3mmOuMais: 0,
  ...mais,
});

const texto = (i: IndicesPerio) => cartoesDosIndices(i).map((c) => [c.rotulo, c.valor, c.apoio]);

describe("cartoesDosIndices", () => {
  it("formata os quatro índices: o percentual, a média com uma casa e as duas contagens", () => {
    const i = indices({ percentualSangramento: (2 * 100) / 6, profundidadeMedia: 19 / 6, sitiosComProfundidade4mmOuMais: 2, sitiosComInsercao3mmOuMais: 4 });

    expect(texto(i)).toEqual([
      ["Sangramento à sondagem", "33,3%", "6 sítios medidos"],
      ["Profundidade média (mm)", "3,2", "6 sítios medidos"],
      ["Profundidade ≥ 4 mm", "2", "de 6 sítios medidos"],
      ["Inserção ≥ 3 mm", "4", "sítios com profundidade e margem"],
    ]);
  });

  it("escreve o percentual inteiro sem casa e não arredonda o que não é zero para 0%", () => {
    const percentual = (p: number) => cartoesDosIndices(indices({ percentualSangramento: p }))[0].valor;

    expect([0, 50, 100].map(percentual)).toEqual(["0%", "50%", "100%"]);
    expect(percentual(0.4)).toBe("0,4%");
  });

  it("escreve a média sempre com uma casa, também quando é exata", () => {
    expect(cartoesDosIndices(indices({ profundidadeMedia: 3 }))[1].valor).toBe("3,0");
  });

  it("fala no singular com um sítio medido", () => {
    const cartoes = cartoesDosIndices(indices({ sitiosMedidos: 1 }));

    expect([cartoes[0].apoio, cartoes[2].apoio]).toEqual(["1 sítio medido", "de 1 sítio medido"]);
  });

  it("sem nenhum sítio medido, o percentual e a média são um traço e o apoio diz que nada foi medido", () => {
    expect(texto(indicesDoExame({}))).toEqual([
      ["Sangramento à sondagem", "—", "Nenhum sítio medido"],
      ["Profundidade média (mm)", "—", "Nenhum sítio medido"],
      ["Profundidade ≥ 4 mm", "0", "Nenhum sítio medido"],
      ["Inserção ≥ 3 mm", "0", "sítios com profundidade e margem"],
    ]);
  });

  it("não muda o tom de nenhum cartão pelo valor: o app não sugere conduta clínica", () => {
    const alto = indices({ percentualSangramento: 100, profundidadeMedia: 9, sitiosComProfundidade4mmOuMais: 6, sitiosComInsercao3mmOuMais: 6 });

    expect(cartoesDosIndices(alto).map((c) => c.tom)).toEqual(cartoesDosIndices(indices({ percentualSangramento: 0, profundidadeMedia: 1 })).map((c) => c.tom));
  });
});
