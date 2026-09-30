import { beforeEach, describe, expect, it } from "vitest";

import { procedimentos } from "@/dados/colecoes";
import { formatarReais, type Procedimento } from "@/dominio";

import {
  camposDoProcedimento,
  especialidadesOferecidas,
  LIMITES_DO_PROCEDIMENTO,
  salvarProcedimento,
  validarProcedimento,
  type CamposDoProcedimento,
} from "./cadastro";

const EXISTENTE: Procedimento = {
  id: "p1",
  codigo: "DEN-01",
  nome: "Restauração em resina composta",
  especialidade: "Dentística",
  preco: 123456,
  duracaoMin: 50,
  exigeDente: true,
  exigeFace: true,
  condicaoResultante: "restauracao",
  ativo: false,
};
const OUTRO: Procedimento = { ...EXISTENTE, id: "p2", codigo: "PRE-02", nome: "Profilaxia (limpeza)", especialidade: "Prevenção", condicaoResultante: undefined, ativo: true };

const VALIDOS: CamposDoProcedimento = {
  nome: "Consulta de retorno",
  codigo: "PRE-09",
  especialidade: "Prevenção",
  preco: "180,00",
  duracao: "30",
  exigeDente: false,
  exigeFace: false,
};
const com = (parte: Partial<CamposDoProcedimento>): CamposDoProcedimento => ({ ...VALIDOS, ...parte });

beforeEach(() => {
  localStorage.clear();
  procedimentos.substituirTudo([EXISTENTE, OUTRO]);
});

describe("camposDoProcedimento", () => {
  it("de um procedimento novo: tudo vazio e sem exigência", () => {
    expect(camposDoProcedimento()).toEqual({ nome: "", codigo: "", especialidade: "", preco: "", duracao: "", exigeDente: false, exigeFace: false });
  });

  it("de um existente: o preço volta como se digita, com milhar e vírgula, e a duração como texto", () => {
    expect(camposDoProcedimento(EXISTENTE)).toEqual({
      nome: "Restauração em resina composta",
      codigo: "DEN-01",
      especialidade: "Dentística",
      preco: "1.234,56",
      duracao: "50",
      exigeDente: true,
      exigeFace: true,
    });
    expect(camposDoProcedimento({ ...EXISTENTE, codigo: undefined, preco: 9000 }).codigo).toBe("");
  });
});

describe("validarProcedimento", () => {
  it("aceita os campos certos, inclusive sem código e com preço zero", () => {
    expect(validarProcedimento(VALIDOS)).toEqual({});
    expect(validarProcedimento(com({ codigo: "" }))).toEqual({});
    expect(validarProcedimento(com({ preco: "0" }))).toEqual({});
  });

  it("exige o nome, com no máximo 100 caracteres", () => {
    expect(validarProcedimento(com({ nome: "   " })).nome).toBe("Informe o nome do procedimento.");
    expect(validarProcedimento(com({ nome: "a".repeat(LIMITES_DO_PROCEDIMENTO.nome) })).nome).toBeUndefined();
    expect(validarProcedimento(com({ nome: "a".repeat(LIMITES_DO_PROCEDIMENTO.nome + 1) })).nome).toBe("Use no máximo 100 caracteres.");
  });

  it("exige a especialidade", () => {
    expect(validarProcedimento(com({ especialidade: "" })).especialidade).toBe("Escolha a especialidade.");
    expect(validarProcedimento(com({ especialidade: "e".repeat(LIMITES_DO_PROCEDIMENTO.especialidade + 1) })).especialidade).toBe("Use no máximo 60 caracteres.");
  });

  it("lê o preço no padrão brasileiro e recusa o que não é valor em reais", () => {
    for (const bom of ["180", "180,5", "1.234,56", "R$ 90,00"]) expect(validarProcedimento(com({ preco: bom })).preco, bom).toBeUndefined();
    for (const ruim of ["", "abc", "12,345", "12.50", "-5", "1e3"]) {
      expect(validarProcedimento(com({ preco: ruim })).preco, ruim).toBe("Informe o preço em reais, como 180,00.");
    }
  });

  it("aceita a duração de 1 a 480 minutos, só em dígitos", () => {
    for (const bom of ["1", " 45 ", "480"]) expect(validarProcedimento(com({ duracao: bom })).duracao, bom).toBeUndefined();
    for (const ruim of ["", "0", "481", "1,5", "-30", "abc", "1e2"]) {
      expect(validarProcedimento(com({ duracao: ruim })).duracao, ruim).toBe("Informe a duração em minutos, de 1 a 480.");
    }
  });

  it("exigir a face sem exigir o dente é recusado", () => {
    expect(validarProcedimento(com({ exigeFace: true, exigeDente: false })).exigeFace).toBe("Para exigir a face, o procedimento também exige o dente.");
    expect(validarProcedimento(com({ exigeFace: true, exigeDente: true }))).toEqual({});
    expect(validarProcedimento(com({ exigeFace: false, exigeDente: true }))).toEqual({});
  });

  it("o código não repete o de outro procedimento, sem distinguir caixa nem espaço nas pontas, e tem até 20 caracteres", () => {
    expect(validarProcedimento(com({ codigo: " den-01 " }), [EXISTENTE]).codigo).toBe("Já existe um procedimento com este código.");
    expect(validarProcedimento(com({ codigo: "DEN-02" }), [EXISTENTE]).codigo).toBeUndefined();
    expect(validarProcedimento(com({ codigo: "x".repeat(21) })).codigo).toBe("Use no máximo 20 caracteres.");
  });
});

describe("salvarProcedimento", () => {
  it("cria um novo: preço em centavos, texto sem espaço nas pontas, id novo e ativo", () => {
    const erros = salvarProcedimento(com({ nome: "  Consulta de retorno ", codigo: " pre-09 ", preco: "1.234,56", duracao: "45", exigeDente: true }));

    expect(erros).toEqual({});
    expect(procedimentos.listar()).toHaveLength(3);
    const novo = procedimentos.listar().find((p) => p.nome === "Consulta de retorno");
    expect(novo).toMatchObject({ codigo: "pre-09", especialidade: "Prevenção", preco: 123456, duracaoMin: 45, exigeDente: true, exigeFace: false, ativo: true });
    expect(novo?.id).toBeTruthy();
    expect(novo?.condicaoResultante).toBeUndefined();
  });

  it("sem código grava o procedimento sem o campo, e o preço de 12,5 são 1250 centavos", () => {
    salvarProcedimento(com({ codigo: "  ", preco: "12,5" }));

    const novo = procedimentos.listar().find((p) => p.nome === "Consulta de retorno");
    expect(novo?.codigo).toBeUndefined();
    expect(novo?.preco).toBe(1250);
    expect(formatarReais(novo?.preco ?? 0)).toContain("12,50");
  });

  it("edita no lugar, com o mesmo id, e mantém o que o formulário não edita", () => {
    const erros = salvarProcedimento({ ...camposDoProcedimento(EXISTENTE), preco: "1.300", duracao: "60" }, "p1");

    expect(erros).toEqual({});
    expect(procedimentos.listar()).toHaveLength(2);
    expect(procedimentos.obter("p1")).toEqual({ ...EXISTENTE, preco: 130000, duracaoMin: 60 }); // `ativo: false` e a condição seguem
  });

  it("o procedimento pode manter o próprio código ao ser editado", () => {
    expect(salvarProcedimento({ ...camposDoProcedimento(EXISTENTE), nome: "Restauração em resina" }, "p1")).toEqual({});
    expect(procedimentos.obter("p1")?.nome).toBe("Restauração em resina");
  });

  it("com erro devolve as mensagens e não grava", () => {
    const antes = procedimentos.listar();

    expect(salvarProcedimento(com({ nome: "", preco: "abc", codigo: "DEN-01" }))).toEqual({
      nome: "Informe o nome do procedimento.",
      codigo: "Já existe um procedimento com este código.",
      preco: "Informe o preço em reais, como 180,00.",
    });
    expect(procedimentos.listar()).toBe(antes); // o mesmo array: nada foi gravado
  });
});

describe("especialidadesOferecidas", () => {
  it("são as oito do catálogo padrão, na ordem dele, mais as de fora que a tabela já tem", () => {
    expect(especialidadesOferecidas([])).toEqual(["Prevenção", "Dentística", "Endodontia", "Periodontia", "Cirurgia", "Prótese", "Implantodontia", "Ortodontia"]);
    expect(especialidadesOferecidas([EXISTENTE, { ...OUTRO, especialidade: "Odontopediatria" }]).slice(8)).toEqual(["Odontopediatria"]);
  });
});
