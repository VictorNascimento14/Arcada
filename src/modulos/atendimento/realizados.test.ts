import { beforeEach, describe, expect, it } from "vitest";

import { planos } from "@/dados/colecoes";
import type { PlanoTratamento, SituacaoPlano } from "@/dominio";

import { aceitaRegistro, registrarRealizados } from "./realizados";

const plano = (situacao: SituacaoPlano, itens: PlanoTratamento["itens"] = ITENS): PlanoTratamento => ({ id: "pl1", pacienteId: "pac1", itens, desconto: 0, situacao });
const ITENS: PlanoTratamento["itens"] = [
  { id: "i1", procedimentoId: "resina", dente: 16, faces: ["O"], preco: 20_000 },
  { id: "i2", procedimentoId: "limpeza", preco: 10_000 },
  { id: "i3", procedimentoId: "canal", dente: 26, preco: 60_000, realizadoEm: "2026-09-01" },
];
const gravado = () => planos.obter("pl1");
const datas = () => gravado()?.itens.map((i) => i.realizadoEm);

beforeEach(() => planos.substituirTudo([plano("em-andamento")]));

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
