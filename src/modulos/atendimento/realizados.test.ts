import { beforeEach, describe, expect, it } from "vitest";

import { planos, procedimentos } from "@/dados/colecoes";
import type { PlanoTratamento, Procedimento, SituacaoPlano } from "@/dominio";
import { odontogramas } from "@/modulos/odontograma/dados";

import { aceitaRegistro, registrarRealizados } from "./realizados";

const plano = (situacao: SituacaoPlano, itens: PlanoTratamento["itens"] = ITENS): PlanoTratamento => ({ id: "pl1", pacienteId: "pac1", itens, desconto: 0, situacao });
const ITENS: PlanoTratamento["itens"] = [
  { id: "i1", procedimentoId: "resina", dente: 16, faces: ["O"], preco: 20_000 },
  { id: "i2", procedimentoId: "limpeza", preco: 10_000 },
  { id: "i3", procedimentoId: "canal", dente: 26, preco: 60_000, realizadoEm: "2026-09-01" },
];
const gravado = () => planos.obter("pl1");
const datas = () => gravado()?.itens.map((i) => i.realizadoEm);

beforeEach(() => {
  planos.substituirTudo([plano("em-andamento")]);
  procedimentos.substituirTudo([]);
  odontogramas.substituirTudo([]);
});

describe("registrarRealizados", () => {
  it("marca só os itens escolhidos com o dia e não mexe nos outros", () => {
    const r = registrarRealizados("pl1", ["i1"], "2026-09-30");

    expect(r.ok).toBe(true);
    expect(datas()).toEqual(["2026-09-30", undefined, "2026-09-01"]);
    expect(gravado()?.itens[0]).toEqual({ ...ITENS[0], realizadoEm: "2026-09-30" });
    expect(gravado()?.situacao).toBe("em-andamento");
  });

  it("vários itens de uma vez", () => {
    registrarRealizados("pl1", ["i1", "i2"], "2026-09-30");
    expect(datas()).toEqual(["2026-09-30", "2026-09-30", "2026-09-01"]);
  });

  it("o primeiro item realizado leva o plano aprovado para em andamento", () => {
    planos.substituirTudo([plano("aprovado", ITENS.slice(0, 2))]);

    const r = registrarRealizados("pl1", ["i2"], "2026-09-30");

    expect(r.ok && r.plano.situacao).toBe("em-andamento");
    expect(gravado()?.situacao).toBe("em-andamento");
  });

  it("o último item feito não conclui o plano", () => {
    planos.substituirTudo([plano("em-andamento", [ITENS[0]])]);
    registrarRealizados("pl1", ["i1"], "2026-09-30");
    expect(gravado()?.situacao).toBe("em-andamento");
  });

  it.each<SituacaoPlano>(["proposto", "recusado", "concluido"])("plano %s não aceita registro e nada é gravado", (situacao) => {
    planos.substituirTudo([plano(situacao)]);

    const r = registrarRealizados("pl1", ["i1"], "2026-09-30");

    expect(r).toEqual({ ok: false, erro: "Só se registra procedimento em plano aprovado ou em andamento." });
    expect(gravado()).toEqual(plano(situacao));
    expect(aceitaRegistro(plano(situacao))).toBe(false);
  });

  it.each([
    ["plano que não existe", "outro", ["i1"], "2026-09-30", "Este plano não existe mais."],
    ["nenhum item escolhido", "pl1", [], "2026-09-30", "Escolha ao menos um item."],
    ["item que não está no plano", "pl1", ["i1", "zzz"], "2026-09-30", "Um dos itens escolhidos não está mais no plano."],
    ["item já realizado (a data antiga fica)", "pl1", ["i1", "i3"], "2026-09-30", "Um dos itens escolhidos já foi realizado."],
    ["data fora do formato", "pl1", ["i1"], "30/09/2026", "A data do registro é inválida."],
  ])("recusa %s e não grava nada", (_caso, planoId, ids, dia, erro) => {
    const r = registrarRealizados(planoId, ids, dia);

    expect(r).toEqual({ ok: false, erro });
    expect(gravado()).toEqual(plano("em-andamento"));
  });
});

describe("o procedimento realizado atualiza o odontograma", () => {
  const proc = (id: string, extra: Partial<Procedimento> = {}): Procedimento => ({
    id,
    nome: id,
    especialidade: "Dentística",
    preco: 1,
    duracaoMin: 30,
    exigeDente: true,
    exigeFace: false,
    ativo: true,
    ...extra,
  });
  const marcasDe = (pacienteId = "pac1") => odontogramas.obter(pacienteId)?.marcas ?? [];

  beforeEach(() => {
    procedimentos.substituirTudo([
      proc("resina", { exigeFace: true, condicaoResultante: "restauracao" }),
      proc("canal", { condicaoResultante: "tratamentoDeCanal" }),
      proc("limpeza", { exigeDente: false }),
    ]);
  });

  it("marca as faces da restauração e o dente do canal no odontograma do paciente do plano", () => {
    planos.substituirTudo([plano("em-andamento", [{ id: "i1", procedimentoId: "resina", dente: 16, faces: ["M", "O"], preco: 1 }, { id: "i2", procedimentoId: "canal", dente: 26, preco: 1 }])]);

    const r = registrarRealizados("pl1", ["i1", "i2"], "2026-09-30");

    expect(marcasDe()).toEqual([
      { dente: 16, face: "M", condicao: "restauracao" },
      { dente: 16, face: "O", condicao: "restauracao" },
      { dente: 26, condicao: "tratamentoDeCanal" },
    ]);
    expect(r.ok && r.marcas).toEqual(marcasDe());
    expect(marcasDe("outro")).toEqual([]);
  });

  it("procedimento sem condição resultante, ou item sem o dente, não mexe no odontograma", () => {
    planos.substituirTudo([plano("em-andamento", [{ id: "i1", procedimentoId: "limpeza", preco: 1 }, { id: "i2", procedimentoId: "resina", preco: 1 }])]);

    const r = registrarRealizados("pl1", ["i1", "i2"], "2026-09-30");

    expect(r.ok && r.marcas).toEqual([]);
    expect(odontogramas.obter("pac1")).toBeUndefined();
    expect(datas()).toEqual(["2026-09-30", "2026-09-30"]); // o registro do procedimento vale do mesmo jeito
  });

  it("a cárie da face vira restauração, e a marca que já existe não é desfeita", () => {
    odontogramas.substituirTudo([{ id: "pac1", marcas: [{ dente: 16, face: "O", condicao: "carie" }, { dente: 26, condicao: "tratamentoDeCanal" }] }]);
    planos.substituirTudo([plano("em-andamento", [{ id: "i1", procedimentoId: "resina", dente: 16, faces: ["O"], preco: 1 }, { id: "i2", procedimentoId: "canal", dente: 26, preco: 1 }])]);

    registrarRealizados("pl1", ["i1", "i2"], "2026-09-30");

    expect(marcasDe()).toHaveLength(2);
    expect(marcasDe()).toEqual(expect.arrayContaining([{ dente: 16, face: "O", condicao: "restauracao" }, { dente: 26, condicao: "tratamentoDeCanal" }]));
  });

  it("marca que não cabe no odontograma recusa o registro inteiro: nem o plano nem o odontograma mudam", () => {
    const original = plano("aprovado", [{ id: "i1", procedimentoId: "canal", dente: 99, preco: 1 }, { id: "i2", procedimentoId: "limpeza", preco: 1 }]);
    planos.substituirTudo([original]);

    const r = registrarRealizados("pl1", ["i1", "i2"], "2026-09-30");

    expect(r).toEqual({ ok: false, erro: "O procedimento não cabe no odontograma: Dente 99 não existe na notação FDI." });
    expect(gravado()).toEqual(original);
    expect(odontogramas.obter("pac1")).toBeUndefined();
  });
});
