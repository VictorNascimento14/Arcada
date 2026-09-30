import { beforeEach, describe, expect, it } from "vitest";

import type { ItemPlano } from "@/dominio";
import { odontogramas } from "@/modulos/odontograma/dados";
import type { Marca } from "@/modulos/odontograma/marcas";

import { aplicarMarcas, marcasDoItem, motivoDeNaoCaber } from "./odontograma";

const item = (extra: Partial<ItemPlano> = {}): ItemPlano => ({ id: "i1", procedimentoId: "p", preco: 1, ...extra });
const marcasDe = (pacienteId = "pac1") => odontogramas.obter(pacienteId)?.marcas ?? [];

describe("marcasDoItem", () => {
  it("condição de face: uma marca em cada face do item", () => {
    const marcas = marcasDoItem(item({ dente: 16, faces: ["M", "O", "D"] }), { condicaoResultante: "restauracao" });
    expect(marcas).toEqual([
      { dente: 16, face: "M", condicao: "restauracao" },
      { dente: 16, face: "O", condicao: "restauracao" },
      { dente: 16, face: "D", condicao: "restauracao" },
    ]);
  });

  it("condição de dente inteiro: uma marca no dente, sem face, mesmo que o item traga faces", () => {
    expect(marcasDoItem(item({ dente: 26, faces: ["O"] }), { condicaoResultante: "tratamentoDeCanal" })).toEqual([{ dente: 26, condicao: "tratamentoDeCanal" }]);
  });

  it.each([
    ["procedimento sem condição resultante", item({ dente: 16 }), {}],
    ["procedimento que não está mais no catálogo", item({ dente: 16 }), undefined],
    ["condição que o odontograma não conhece", item({ dente: 16 }), { condicaoResultante: "inventada" }],
    ["item sem dente", item(), { condicaoResultante: "tratamentoDeCanal" }],
    ["condição de face e item sem faces", item({ dente: 16 }), { condicaoResultante: "restauracao" }],
    ["condição de face e lista de faces vazia", item({ dente: 16, faces: [] }), { condicaoResultante: "selante" }],
  ])("não marca nada: %s", (_caso, i, procedimento) => {
    expect(marcasDoItem(i, procedimento)).toEqual([]);
  });
});

describe("motivoDeNaoCaber", () => {
  it("sem marcas, ou com marcas que cabem, não há motivo", () => {
    expect(motivoDeNaoCaber([])).toBeUndefined();
    expect(motivoDeNaoCaber([{ dente: 16, face: "O", condicao: "carie" }, { dente: 26, condicao: "coroa" }])).toBeUndefined();
  });

  it("devolve a mensagem da regra do odontograma para a marca que não cabe", () => {
    expect(motivoDeNaoCaber([{ dente: 16, condicao: "coroa" }, { dente: 99, condicao: "coroa" }])).toBe("Dente 99 não existe na notação FDI.");
    expect(motivoDeNaoCaber([{ dente: 13, face: "O", condicao: "carie" }])).toBeTruthy(); // canino não tem face oclusal
  });
});

describe("aplicarMarcas", () => {
  beforeEach(() => odontogramas.substituirTudo([]));

  it("aplica no odontograma do paciente e não mexe no de outro", () => {
    odontogramas.substituirTudo([{ id: "pac2", marcas: [{ dente: 11, condicao: "coroa" }] }]);
    aplicarMarcas("pac1", [{ dente: 16, face: "O", condicao: "restauracao" }, { dente: 26, condicao: "tratamentoDeCanal" }]);

    expect(marcasDe("pac1")).toEqual([{ dente: 16, face: "O", condicao: "restauracao" }, { dente: 26, condicao: "tratamentoDeCanal" }]);
    expect(marcasDe("pac2")).toEqual([{ dente: 11, condicao: "coroa" }]);
  });

  it("aplicar de novo o que já está lá não desfaz nem duplica, na face e no dente inteiro", () => {
    const marcas: Marca[] = [{ dente: 16, face: "O", condicao: "restauracao" }, { dente: 26, condicao: "tratamentoDeCanal" }];
    aplicarMarcas("pac1", marcas);
    aplicarMarcas("pac1", marcas);
    aplicarMarcas("pac1", [marcas[0], marcas[0]]);

    expect(marcasDe()).toEqual(marcas);
  });

  it("na face, a marca nova substitui a anterior (a cárie vira restauração); no dente inteiro, soma-se às outras", () => {
    odontogramas.substituirTudo([{ id: "pac1", marcas: [{ dente: 16, face: "O", condicao: "carie" }, { dente: 16, condicao: "tratamentoDeCanal" }] }]);
    aplicarMarcas("pac1", [{ dente: 16, face: "O", condicao: "restauracao" }, { dente: 16, condicao: "coroa" }]);

    expect(marcasDe()).toEqual(
      expect.arrayContaining([
        { dente: 16, face: "O", condicao: "restauracao" },
        { dente: 16, condicao: "tratamentoDeCanal" },
        { dente: 16, condicao: "coroa" },
      ]),
    );
    expect(marcasDe()).toHaveLength(3);
  });

  it("marca que não cabe lança RangeError e não grava", () => {
    expect(() => aplicarMarcas("pac1", [{ dente: 99, condicao: "coroa" }])).toThrow(RangeError);
    expect(marcasDe()).toEqual([]);
  });
});
