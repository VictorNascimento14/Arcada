import { describe, expect, it } from "vitest";

import {
  DENTES_DECIDUOS,
  DENTES_PERMANENTES,
  arcada,
  denteValido,
  ehDeciduo,
  faceValida,
  facesDoDente,
  lado,
  nomeDente,
  nomeFace,
  quadrante,
  tipoDente,
} from "./fdi";

/** De `a` até `b`, contando para cima ou para baixo, com as duas pontas. */
const de = (a: number, b: number) => Array.from({ length: Math.abs(b - a) + 1 }, (_, k) => a + Math.sign(b - a) * k);

/** A posição do dente, de 1 (incisivo central) a 8; nos decíduos, até 5. Da frente são as posições 1 a 3. */
const posicao = (n: number) => n % 10;
const superior = (n: number) => [1, 2, 5, 6].includes(Math.floor(n / 10));

const TODOS = [
  ...DENTES_PERMANENTES.superior,
  ...DENTES_PERMANENTES.inferior,
  ...DENTES_DECIDUOS.superior,
  ...DENTES_DECIDUOS.inferior,
];

describe("listas na ordem de exibição", () => {
  it("permanentes: 18→11 | 21→28 em cima e 48→41 | 31→38 embaixo", () => {
    expect(DENTES_PERMANENTES.superior).toEqual([...de(18, 11), ...de(21, 28)]);
    expect(DENTES_PERMANENTES.inferior).toEqual([...de(48, 41), ...de(31, 38)]);
  });

  it("decíduos: 55→51 | 61→65 em cima e 85→81 | 71→75 embaixo", () => {
    expect(DENTES_DECIDUOS.superior).toEqual([...de(55, 51), ...de(61, 65)]);
    expect(DENTES_DECIDUOS.inferior).toEqual([...de(85, 81), ...de(71, 75)]);
  });

  it("são 32 permanentes e 20 decíduos, sem repetir nenhum, e cada fileira está na sua arcada", () => {
    expect(TODOS).toHaveLength(52);
    expect(new Set(TODOS).size).toBe(52);
    for (const a of ["superior", "inferior"] as const) {
      for (const n of [...DENTES_PERMANENTES[a], ...DENTES_DECIDUOS[a]]) expect(arcada(n)).toBe(a);
    }
    expect(TODOS.filter(ehDeciduo)).toHaveLength(20);
  });
});

describe("denteValido", () => {
  it.each([11, 18, 21, 28, 31, 38, 41, 48, 51, 55, 61, 65, 71, 75, 81, 85])("%i existe", (n) => {
    expect(denteValido(n)).toBe(true);
  });

  it.each([0, 1, 10, 19, 20, 29, 39, 49, 50, 56, 66, 76, 86, 90, 111, -11, 11.5, NaN, Infinity])(
    "%s não existe: fora das faixas 11–18, 21–28, 31–38, 41–48, 51–55, 61–65, 71–75 e 81–85",
    (n) => {
      expect(denteValido(n)).toBe(false);
    },
  );

  it("só número vale: '11', null e objeto são recusados", () => {
    for (const v of ["11", "", null, undefined, {}, [11], true]) expect(denteValido(v)).toBe(false);
  });

  it("os derivados do número recusam dente que não existe em vez de adivinhar", () => {
    for (const f of [quadrante, ehDeciduo, arcada, lado, tipoDente, nomeDente, facesDoDente]) expect(() => f(19)).toThrow(RangeError);
  });
});

describe("quadrante, dentição, arcada e lado", () => {
  it.each([
    // dente, quadrante, decíduo, arcada, lado (do paciente)
    [18, 1, false, "superior", "direito"],
    [21, 2, false, "superior", "esquerdo"],
    [36, 3, false, "inferior", "esquerdo"],
    [48, 4, false, "inferior", "direito"],
    [55, 5, true, "superior", "direito"],
    [61, 6, true, "superior", "esquerdo"],
    [72, 7, true, "inferior", "esquerdo"],
    [85, 8, true, "inferior", "direito"],
  ])("dente %i: quadrante %i, decíduo %s, arcada %s, lado %s", (n, q, deciduo, a, l) => {
    expect(quadrante(n)).toBe(q);
    expect(ehDeciduo(n)).toBe(deciduo);
    expect(arcada(n)).toBe(a);
    expect(lado(n)).toBe(l);
  });
});

describe("tipoDente", () => {
  it.each([
    [1, "incisivoCentral"],
    [2, "incisivoLateral"],
    [3, "canino"],
    [4, "premolar"],
    [5, "premolar"],
    [6, "molar"],
    [7, "molar"],
    [8, "molar"],
  ])("permanente, posição %i: %s, em todos os quadrantes", (posicao, tipo) => {
    for (const q of [1, 2, 3, 4]) expect(tipoDente(q * 10 + posicao)).toBe(tipo);
  });

  it.each([
    [1, "incisivoCentral"],
    [2, "incisivoLateral"],
    [3, "canino"],
    [4, "molar"], // o decíduo não tem pré-molar
    [5, "molar"],
  ])("decíduo, posição %i: %s, em todos os quadrantes", (posicao, tipo) => {
    for (const q of [5, 6, 7, 8]) expect(tipoDente(q * 10 + posicao)).toBe(tipo);
  });
});

describe("nomeDente", () => {
  it.each([
    [11, "incisivo central superior direito"],
    [22, "incisivo lateral superior esquerdo"],
    [33, "canino inferior esquerdo"],
    [14, "primeiro pré-molar superior direito"],
    [45, "segundo pré-molar inferior direito"],
    [16, "primeiro molar superior direito"],
    [36, "primeiro molar inferior esquerdo"],
    [27, "segundo molar superior esquerdo"],
    [48, "terceiro molar inferior direito"],
    [51, "incisivo central decíduo superior direito"],
    [63, "canino decíduo superior esquerdo"],
    [54, "primeiro molar decíduo superior direito"],
    [75, "segundo molar decíduo inferior esquerdo"],
  ])("dente %i: %s", (n, nome) => {
    expect(nomeDente(n)).toBe(nome);
  });

  it("cada um dos 52 dentes tem um nome só seu", () => {
    expect(new Set(TODOS.map(nomeDente)).size).toBe(52);
  });
});

describe("facesDoDente", () => {
  it.each([
    [11, ["V", "M", "D", "P", "I"]], // incisivo superior
    [13, ["V", "M", "D", "P", "I"]], // canino superior
    [15, ["V", "M", "D", "P", "O"]], // pré-molar superior
    [26, ["V", "M", "D", "P", "O"]], // molar superior
    [32, ["V", "M", "D", "L", "I"]], // incisivo inferior
    [43, ["V", "M", "D", "L", "I"]], // canino inferior
    [44, ["V", "M", "D", "L", "O"]], // pré-molar inferior
    [38, ["V", "M", "D", "L", "O"]], // molar inferior
    [52, ["V", "M", "D", "P", "I"]], // decíduo: incisivo superior
    [64, ["V", "M", "D", "P", "O"]], // decíduo: o 4 já é molar, então a face de cima é a oclusal
    [83, ["V", "M", "D", "L", "I"]], // decíduo: canino inferior
    [75, ["V", "M", "D", "L", "O"]], // decíduo: molar inferior
  ])("dente %i: %j", (n, faces) => {
    expect(facesDoDente(n)).toEqual(faces);
  });

  it("vale para os 52 dentes: V, M e D, P ou L pela arcada, I ou O pela posição (1 a 3 é da frente)", () => {
    for (const n of TODOS) {
      expect(facesDoDente(n)).toEqual(["V", "M", "D", superior(n) ? "P" : "L", posicao(n) <= 3 ? "I" : "O"]);
    }
  });
});

describe("faceValida", () => {
  it("V, M e D valem em todo dente", () => {
    for (const n of TODOS) for (const face of ["V", "M", "D"]) expect(faceValida(n, face)).toBe(true);
  });

  it("I só nos dentes da frente e O só nos de trás, nos permanentes e nos decíduos", () => {
    for (const n of TODOS) {
      expect(faceValida(n, "I")).toBe(posicao(n) <= 3);
      expect(faceValida(n, "O")).toBe(posicao(n) > 3);
    }
  });

  it("P só nos superiores e L só nos inferiores", () => {
    for (const n of TODOS) {
      expect(faceValida(n, "P")).toBe(superior(n));
      expect(faceValida(n, "L")).toBe(!superior(n));
    }
  });

  it("recusa face que não existe e dente que não existe, sem lançar", () => {
    for (const face of ["", "v", "X", "VM", "oclusal"]) expect(faceValida(11, face)).toBe(false);
    for (const n of [0, 19, 56, 90]) expect(faceValida(n, "V")).toBe(false);
  });
});

describe("nomeFace", () => {
  it.each([
    ["V", "vestibular"],
    ["M", "mesial"],
    ["D", "distal"],
    ["L", "lingual"],
    ["P", "palatina"],
    ["O", "oclusal"],
    ["I", "incisal"],
  ] as const)("%s é %s", (face, nome) => {
    expect(nomeFace(face)).toBe(nome);
  });
});
