import { describe, expect, it } from "vitest";

import { paraCentavos, type Procedimento } from "@/dominio";

import {
  alternarFace,
  CAMPOS_VAZIOS,
  DENTES_PARA_ESCOLHER,
  escolherDente,
  escolherProcedimento,
  itemDoFormulario,
  precoEmTexto,
  procedimentosParaEscolher,
  rotuloDoDente,
  type CamposDoItem,
} from "./itens";

const proc = (p: Pick<Procedimento, "id" | "nome"> & Partial<Procedimento>): Procedimento => ({
  especialidade: "Dentística",
  preco: 10_000,
  duracaoMin: 30,
  exigeDente: false,
  exigeFace: false,
  ativo: true,
  ...p,
});
const RESINA = proc({ id: "resina", nome: "Restauração em resina", preco: 22_000, exigeDente: true, exigeFace: true });
const CANAL = proc({ id: "canal", nome: "Canal", especialidade: "Endodontia", preco: 60_000, exigeDente: true });
const LIMPEZA = proc({ id: "limpeza", nome: "Profilaxia", especialidade: "Prevenção", preco: 18_000 });
const ANTIGO = proc({ id: "antigo", nome: "Antigo", ativo: false });
const CATALOGO = [RESINA, CANAL, LIMPEZA, ANTIGO];

const campos = (c: Partial<CamposDoItem>): CamposDoItem => ({ ...CAMPOS_VAZIOS, ...c });
const erros = (c: CamposDoItem) => {
  const r = itemDoFormulario(c, CATALOGO);
  return "erros" in r ? r.erros : null;
};
const item = (c: CamposDoItem) => {
  const r = itemDoFormulario(c, CATALOGO);
  return "item" in r ? r.item : null;
};

describe("procedimentosParaEscolher", () => {
  it("só os ativos, por especialidade e por nome, sem mexer na lista recebida", () => {
    const zirconia = proc({ id: "z", nome: "Zircônia" });
    const acido = proc({ id: "a", nome: "Ácido" });
    const lista = [zirconia, ANTIGO, CANAL, acido];

    const grupos = procedimentosParaEscolher(lista);

    expect(grupos.map((g) => [g.especialidade, g.procedimentos.map((p) => p.id)])).toEqual([
      ["Dentística", ["a", "z"]],
      ["Endodontia", ["canal"]],
    ]);
    expect(lista.map((p) => p.id)).toEqual(["z", "antigo", "canal", "a"]);
  });
});

describe("os dentes da escolha", () => {
  it("são os 32 permanentes (11 a 48) e os 20 decíduos (51 a 85), em ordem numérica", () => {
    const [permanentes, deciduos] = DENTES_PARA_ESCOLHER;
    expect(permanentes.dentes).toHaveLength(32);
    expect(permanentes.dentes.slice(0, 9)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 21]);
    expect(permanentes.dentes.at(-1)).toBe(48);
    expect(deciduos.dentes).toHaveLength(20);
    expect([deciduos.dentes[0], deciduos.dentes.at(-1)]).toEqual([51, 85]);
  });

  it("o rótulo traz o número e o nome", () => {
    expect(rotuloDoDente(16)).toBe("16 — primeiro molar superior direito");
  });
});

describe("os campos do formulário", () => {
  it("escolher o procedimento traz o preço da tabela; trocar de procedimento traz o do novo", () => {
    const resina = escolherProcedimento(CAMPOS_VAZIOS, RESINA);
    expect(resina).toMatchObject({ procedimentoId: "resina", preco: "220,00" });
    expect(escolherProcedimento({ ...resina, preco: "200,00" }, CANAL).preco).toBe("600,00");
    expect(escolherProcedimento(resina)).toMatchObject({ procedimentoId: "", preco: "" });
  });

  it("o preço em texto volta igual pelo paraCentavos", () => {
    expect(precoEmTexto(100_000)).toBe("1.000,00");
    expect([0, 5, 22_000, 100_000].map((c) => paraCentavos(precoEmTexto(c)))).toEqual([0, 5, 22_000, 100_000]);
  });

  it("trocar o dente tira as faces que o novo dente não tem", () => {
    const c = campos({ dente: "16", faces: ["M", "O"] });
    expect(escolherDente(c, "11").faces).toEqual(["M"]); // o incisivo tem incisal, não oclusal
    expect(escolherDente(c, "26").faces).toEqual(["M", "O"]);
    expect(escolherDente(c, "").faces).toEqual([]);
  });

  it("alternar a face marca e desmarca", () => {
    const marcada = alternarFace(CAMPOS_VAZIOS, "O");
    expect(marcada.faces).toEqual(["O"]);
    expect(alternarFace(marcada, "O").faces).toEqual([]);
  });
});

describe("itemDoFormulario", () => {
  it("com dente e faces: guarda as faces na ordem do dente e o preço ajustado", () => {
    expect(item(campos({ procedimentoId: "resina", dente: "16", faces: ["O", "M"], preco: "200,00" }))).toEqual({
      procedimentoId: "resina",
      dente: 16,
      faces: ["M", "O"],
      preco: 20_000,
    });
  });

  it("que pede só o dente: o item não leva faces, mesmo que o campo tenha sobrado com elas", () => {
    expect(item(campos({ procedimentoId: "canal", dente: "46", faces: ["O"], preco: "600,00" }))).toEqual({
      procedimentoId: "canal",
      dente: 46,
      preco: 60_000,
    });
  });

  it("que não pede dente: ignora o dente e as faces dos campos", () => {
    expect(item(campos({ procedimentoId: "limpeza", dente: "16", faces: ["O"], preco: "180,00" }))).toEqual({
      procedimentoId: "limpeza",
      preco: 18_000,
    });
  });

  it("aceita preço zero (cortesia)", () => {
    expect(item(campos({ procedimentoId: "limpeza", preco: "0" }))).toEqual({ procedimentoId: "limpeza", preco: 0 });
  });

  it.each([
    ["sem procedimento", campos({ preco: "10,00" }), { procedimentoId: "Escolha o procedimento." }],
    ["procedimento inativo", campos({ procedimentoId: "antigo", preco: "10,00" }), { procedimentoId: "Escolha o procedimento." }],
    ["procedimento que não existe", campos({ procedimentoId: "fantasma", preco: "10,00" }), { procedimentoId: "Escolha o procedimento." }],
    ["dente exigido e não escolhido", campos({ procedimentoId: "canal", preco: "10,00" }), { dente: "Escolha o dente." }],
    ["dente que a FDI não tem", campos({ procedimentoId: "canal", dente: "19", preco: "10,00" }), { dente: "Escolha o dente." }],
    ["face exigida e nenhuma marcada", campos({ procedimentoId: "resina", dente: "16", preco: "10,00" }), { faces: "Marque ao menos uma face." }],
    ["face exigida sem dente: só o dente reclama", campos({ procedimentoId: "resina", faces: ["O"], preco: "10,00" }), { dente: "Escolha o dente." }],
    [
      "face que o dente não tem (incisal no molar)",
      campos({ procedimentoId: "resina", dente: "16", faces: ["I"], preco: "10,00" }),
      { faces: "Há face que este dente não tem." },
    ],
    ["preço vazio", campos({ procedimentoId: "limpeza" }), { preco: "Informe o preço, como 220,00." }],
    ["preço negativo", campos({ procedimentoId: "limpeza", preco: "-5" }), { preco: "Informe o preço, como 220,00." }],
    ["preço com três casas", campos({ procedimentoId: "limpeza", preco: "12,345" }), { preco: "Informe o preço, como 220,00." }],
  ])("recusa: %s", (_caso, entrada, esperado) => {
    expect(erros(entrada)).toEqual(esperado);
  });

  it("junta os erros de todos os campos", () => {
    expect(erros(CAMPOS_VAZIOS)).toEqual({ procedimentoId: "Escolha o procedimento.", preco: "Informe o preço, como 220,00." });
  });
});
