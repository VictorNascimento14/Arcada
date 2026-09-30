import { describe, expect, it } from "vitest";

import { indicesDoExame, nivelDeInsercao, SITIOS, type ExamePerio, type MedidaSitio, type Sitio } from "./exame";

/**
 * O dente 16 com os seis sítios. Ao lado de cada um, o que ele acrescenta aos índices: 6 sítios medidos,
 * soma das profundidades 19, 2 com sangramento, 2 com profundidade de 4 mm ou mais (o de 3 mm não conta) e
 * 4 com inserção de 3 mm ou mais (o de 2 mm não conta, e o sem margem não tem inserção).
 */
const SEIS_SITIOS: ExamePerio = {
  16: {
    sitios: {
      MV: { profundidade: 3, margem: 0 }, // inserção 3
      V: { profundidade: 2, margem: 1, sangramento: true }, // inserção 3, com sangramento
      DV: { profundidade: 4, margem: 0, sangramento: true }, // profundidade 4, inserção 4, com sangramento
      ML: { profundidade: 5, margem: -2 }, // profundidade 5, inserção 3 (margem coronal desconta)
      L: { profundidade: 3, margem: -1 }, // inserção 2
      DL: { profundidade: 2 }, // sem margem: sem inserção
    },
  },
};

const ZERADOS = {
  sitiosMedidos: 0,
  percentualSangramento: null,
  profundidadeMedia: null,
  sitiosComProfundidade4mmOuMais: 0,
  sitiosComInsercao3mmOuMais: 0,
};

describe("nivelDeInsercao", () => {
  it("é a profundidade mais a margem: a recessão (positiva) aumenta, a margem coronal (negativa) diminui", () => {
    expect(nivelDeInsercao({ profundidade: 3, margem: 2 })).toBe(5);
    expect(nivelDeInsercao({ profundidade: 3, margem: 0 })).toBe(3);
    expect(nivelDeInsercao({ profundidade: 4, margem: -1 })).toBe(3);
  });

  it("não existe enquanto falta uma das duas medidas", () => {
    expect(nivelDeInsercao({ profundidade: 3 })).toBeUndefined();
    expect(nivelDeInsercao({ margem: 2 })).toBeUndefined();
    expect(nivelDeInsercao({ profundidade: Number.NaN, margem: 1 })).toBeUndefined();
  });
});

describe("indicesDoExame", () => {
  it("calcula os quatro índices sobre os sítios medidos", () => {
    const i = indicesDoExame(SEIS_SITIOS);
    expect(i.sitiosMedidos).toBe(6);
    expect(i.percentualSangramento).toBeCloseTo((2 * 100) / 6);
    expect(i.profundidadeMedia).toBeCloseTo(19 / 6);
    expect(i.sitiosComProfundidade4mmOuMais).toBe(2);
    expect(i.sitiosComInsercao3mmOuMais).toBe(4);
  });

  it("soma os dentes das duas arcadas", () => {
    // O 46 acrescenta 1 sítio medido, profundidade 6, com sangramento, e com inserção 6.
    const i = indicesDoExame({ ...SEIS_SITIOS, 46: { sitios: { V: { profundidade: 6, margem: 0, sangramento: true } } } });
    expect(i.sitiosMedidos).toBe(7);
    expect(i.percentualSangramento).toBeCloseTo((3 * 100) / 7);
    expect(i.profundidadeMedia).toBeCloseTo(25 / 7);
    expect(i.sitiosComProfundidade4mmOuMais).toBe(3);
    expect(i.sitiosComInsercao3mmOuMais).toBe(5);
  });

  it("deixa de fora dente ausente, número que a FDI não tem e sítio sem profundidade", () => {
    const fundo = { profundidade: 9, margem: 3, sangramento: true };
    const exame: ExamePerio = {
      ...SEIS_SITIOS,
      18: { ausente: true, sitios: { V: fundo } },
      19: { sitios: { V: fundo } }, // a FDI vai de 11 a 18 e pula para 21
      26: { sitios: { V: { margem: 2, sangramento: true } } }, // sangramento anotado, mas sem profundidade
    };
    expect(indicesDoExame(exame)).toEqual(indicesDoExame(SEIS_SITIOS));
  });

  it("não conta a supuração em nenhum índice: ela é só registro", () => {
    const sitios = SEIS_SITIOS[16]?.sitios ?? {};
    const comPus: ExamePerio = {
      16: { sitios: Object.fromEntries(SITIOS.map((s) => [s, { ...sitios[s], supuracao: true }])) as Partial<Record<Sitio, MedidaSitio>> },
    };
    expect(indicesDoExame(comPus)).toEqual(indicesDoExame(SEIS_SITIOS));
  });

  it("não tem percentual nem média sem nenhum sítio medido", () => {
    expect(indicesDoExame({})).toEqual(ZERADOS);
    expect(indicesDoExame({ 16: { ausente: true, sitios: { V: { profundidade: 5, sangramento: true } } } })).toEqual(ZERADOS);
  });
});
