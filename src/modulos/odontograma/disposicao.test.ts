import { describe, expect, it } from "vitest";

import { DENTES_DECIDUOS, DENTES_PERMANENTES, facesDoDente } from "@/dominio/fdi";

import { disposicaoDasFaces, POSICOES } from "./disposicao";

const TODOS = [
  ...DENTES_PERMANENTES.superior,
  ...DENTES_PERMANENTES.inferior,
  ...DENTES_DECIDUOS.superior,
  ...DENTES_DECIDUOS.inferior,
];

describe("disposicaoDasFaces", () => {
  it("põe a face incisal nos dentes da frente e a oclusal nos de trás, no centro", () => {
    expect(disposicaoDasFaces(11).centro).toBe("I"); // incisivo central
    expect(disposicaoDasFaces(43).centro).toBe("I"); // canino
    expect(disposicaoDasFaces(14).centro).toBe("O"); // pré-molar
    expect(disposicaoDasFaces(46).centro).toBe("O"); // molar
    expect(disposicaoDasFaces(84).centro).toBe("O"); // molar decíduo
  });

  it("põe a vestibular em cima no dente superior e embaixo no inferior, e a palatina ou lingual do lado oposto", () => {
    const superior = disposicaoDasFaces(16);
    expect([superior.cima, superior.baixo]).toEqual(["V", "P"]);

    const inferior = disposicaoDasFaces(46);
    expect([inferior.cima, inferior.baixo]).toEqual(["L", "V"]);
  });

  it.each([
    [16, "direita"],
    [26, "esquerda"],
    [36, "esquerda"],
    [46, "direita"],
    [55, "direita"],
    [65, "esquerda"],
    [75, "esquerda"],
    [85, "direita"],
  ] as const)("no dente %i a mesial fica à %s da figura, e a distal do outro lado", (dente, ladoDaMesial) => {
    const disposicao = disposicaoDasFaces(dente);
    const ladoDaDistal = ladoDaMesial === "direita" ? "esquerda" : "direita";

    expect(disposicao[ladoDaMesial]).toBe("M");
    expect(disposicao[ladoDaDistal]).toBe("D");
  });

  it("usa as cinco faces do dente, cada uma em um lugar, em todos os dentes", () => {
    for (const dente of TODOS) {
      const disposicao = disposicaoDasFaces(dente);

      expect(POSICOES.map((posicao) => disposicao[posicao]).sort()).toEqual([...facesDoDente(dente)].sort());
    }
  });

  it("lança para um dente que não existe", () => {
    expect(() => disposicaoDasFaces(19)).toThrow(RangeError);
  });
});
