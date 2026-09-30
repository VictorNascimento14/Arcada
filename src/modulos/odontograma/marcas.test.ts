import { describe, expect, it } from "vitest";

import { alternarMarca, conferirMarca, type Marca } from "./marcas";

const carie: Marca = { dente: 16, face: "M", condicao: "carie" };
const canal: Marca = { dente: 16, condicao: "tratamentoDeCanal" };
const coroa: Marca = { dente: 16, condicao: "coroa" };

describe("alternarMarca", () => {
  it("aplica a condição numa face vazia e a remove ao repetir", () => {
    const aplicada = alternarMarca([], carie);
    expect(aplicada).toEqual({ marcas: [carie], aplicada: true });
    expect(alternarMarca(aplicada.marcas, carie)).toEqual({ marcas: [], aplicada: false });
  });

  it("numa face, outra condição substitui a que estava", () => {
    const restauracao: Marca = { dente: 16, face: "M", condicao: "restauracao" };

    expect(alternarMarca([carie], restauracao)).toEqual({ marcas: [restauracao], aplicada: true });
  });

  it("faces e dentes diferentes são marcas independentes", () => {
    const outraFace: Marca = { dente: 16, face: "D", condicao: "carie" };
    const outroDente: Marca = { dente: 26, face: "M", condicao: "carie" };

    const { marcas } = alternarMarca(alternarMarca([carie], outraFace).marcas, outroDente);
    expect(marcas).toEqual([carie, outraFace, outroDente]);
    expect(alternarMarca(marcas, outraFace).marcas).toEqual([carie, outroDente]);
  });

  it("no dente inteiro as condições se somam e cada uma se remove sozinha", () => {
    const { marcas } = alternarMarca(alternarMarca([], canal).marcas, coroa);

    expect(marcas).toEqual([canal, coroa]);
    expect(alternarMarca(marcas, canal)).toEqual({ marcas: [coroa], aplicada: false });
  });

  it("a condição de face e a do dente inteiro no mesmo dente não se atrapalham", () => {
    expect(alternarMarca([carie], coroa).marcas).toEqual([carie, coroa]);
  });

  it("não muda a lista que recebe", () => {
    const antes = [carie];
    alternarMarca(antes, coroa);
    alternarMarca(antes, carie);

    expect(antes).toEqual([carie]);
  });
});

describe("conferirMarca", () => {
  it("aceita a face que o dente tem e o dente inteiro sem face", () => {
    expect(() => conferirMarca(carie)).not.toThrow();
    expect(() => conferirMarca({ dente: 11, face: "I", condicao: "selante" })).not.toThrow();
    expect(() => conferirMarca(coroa)).not.toThrow();
  });

  it.each([
    ["dente que não existe", { dente: 19, face: "M", condicao: "carie" }],
    ["condição fora da lista", { dente: 16, condicao: "constructor" }],
    ["condição de face sem a face", { dente: 16, condicao: "carie" }],
    ["face que o dente não tem (incisal no molar)", { dente: 16, face: "I", condicao: "carie" }],
    ["face que o dente não tem (lingual no superior)", { dente: 16, face: "L", condicao: "carie" }],
    ["face numa condição do dente inteiro", { dente: 16, face: "M", condicao: "coroa" }],
  ])("recusa %s", (_, marca) => {
    expect(() => conferirMarca(marca as unknown as Marca)).toThrow(RangeError);
  });
});
