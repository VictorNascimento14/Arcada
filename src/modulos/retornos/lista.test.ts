import { describe, expect, it } from "vitest";

import type { Consulta, Paciente, PlanoTratamento } from "@/dominio";

import type { EstadoDoRetorno } from "./estado";
import { JANELA_A_VENCER_DIAS, retornosDispensados, retornosPendentes } from "./lista";

const HOJE = "2026-09-30";
const paciente = (id: string, nome = id): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
/** Uma consulta concluída do paciente em `dia`; o retorno cai 6 meses depois. */
const atendida = (pacienteId: string, dia: string, extra: Partial<Consulta> = {}): Consulta => ({
  id: `c-${pacienteId}-${dia}`,
  pacienteId,
  profissionalId: "prof",
  cadeiraId: "cad",
  inicio: `${dia}T09:00`,
  duracaoMin: 30,
  situacao: "concluida",
  ...extra,
});

describe("retornosPendentes", () => {
  it("separa o vencido, o que vence hoje e o que vence dentro de 30 dias, e deixa o resto de fora", () => {
    const pacientes = ["ana", "bia", "caio", "dani", "edu"].map((id) => paciente(id));
    const consultas = [
      atendida("ana", "2026-03-25"), // retorno em 25/09: venceu há 5 dias
      atendida("bia", "2026-03-30"), // retorno em 30/09: vence hoje
      atendida("caio", "2026-04-30"), // retorno em 30/10: o último dia da janela
      atendida("dani", "2026-05-01"), // retorno em 01/11: 32 dias, fora
      atendida("edu", "2025-01-10"), // retorno em jan/2025: venceu há muito
    ];

    const lista = retornosPendentes(pacientes, consultas, [], HOJE);

    expect(JANELA_A_VENCER_DIAS).toBe(30);
    expect(lista.map((r) => [r.pacienteId, r.situacao, r.dias])).toEqual([
      ["edu", "vencido", 447],
      ["ana", "vencido", 5],
      ["bia", "a-vencer", 0],
      ["caio", "a-vencer", 30],
    ]);
    expect(lista[1]).toMatchObject({ ultimoAtendimento: "2026-03-25", intervaloMeses: 6, retornoEm: "2026-09-25", paciente: { id: "ana" } });
  });

  it("não lista quem nunca foi atendido nem o retorno de paciente que saiu do cadastro", () => {
    const naoAtendida = atendida("ana", "2026-03-25", { situacao: "agendada" });
    const plano: PlanoTratamento = { id: "pl", pacienteId: "bia", desconto: 0, situacao: "em-andamento", itens: [{ id: "i", procedimentoId: "p", preco: 100 }] };

    expect(retornosPendentes([paciente("ana"), paciente("bia")], [naoAtendida, atendida("sumiu", "2026-03-25")], [plano], HOJE)).toEqual([]);
  });

  it("ordena do prazo mais antigo ao mais próximo, com o nome no desempate", () => {
    const pacientes = [paciente("1", "Zeca Exemplo"), paciente("2", "Ana Exemplo"), paciente("3", "Bia Exemplo")];
    const consultas = [atendida("1", "2026-03-20"), atendida("2", "2026-03-20"), atendida("3", "2026-03-10")];

    expect(retornosPendentes(pacientes, consultas, [], HOJE).map((r) => r.paciente.nome)).toEqual(["Bia Exemplo", "Ana Exemplo", "Zeca Exemplo"]);
  });

  it("usa o prazo do procedimento feito no último atendimento", () => {
    const manutencao = [atendida("ana", "2026-08-20", { procedimentoId: "proc-manutencao-aparelho" })]; // 1 mês: venceu em 20/09
    const limpeza = [atendida("ana", "2026-08-20", { procedimentoId: "proc-profilaxia" })]; // 6 meses: só em fevereiro

    expect(retornosPendentes([paciente("ana")], limpeza, [], HOJE)).toEqual([]);
    expect(retornosPendentes([paciente("ana")], manutencao, [], HOJE)).toMatchObject([{ retornoEm: "2026-09-20", situacao: "vencido", dias: 10 }]);
  });
});

describe("o estado do retorno", () => {
  const ana = paciente("ana", "Ana Exemplo");
  const consultas = [atendida("ana", "2026-03-10")]; // retorno em 10/09: venceu há 20 dias
  const estado = (extra: Partial<EstadoDoRetorno>): EstadoDoRetorno => ({ id: "ana", ultimoAtendimento: "2026-03-10", ...extra });

  it("o adiado vale o dia novo: sai dos vencidos, passa para os a vencer e vem marcado como adiado", () => {
    expect(retornosPendentes([ana], consultas, [], HOJE)).toMatchObject([{ situacao: "vencido", adiado: false }]);
    expect(retornosPendentes([ana], consultas, [], HOJE, [estado({ adiadoAte: "2026-10-15" })])).toMatchObject([
      { retornoEm: "2026-10-15", ultimoAtendimento: "2026-03-10", situacao: "a-vencer", dias: 15, adiado: true },
    ]);
  });

  it("o adiado para além da janela some da lista e volta quando entra nela", () => {
    const adiado = [estado({ adiadoAte: "2026-11-15" })];

    expect(retornosPendentes([ana], consultas, [], HOJE, adiado)).toEqual([]);
    expect(retornosPendentes([ana], consultas, [], "2026-10-20", adiado)).toMatchObject([{ situacao: "a-vencer", dias: 26, adiado: true }]);
  });

  it("o dispensado sai da lista", () => {
    expect(retornosPendentes([ana], consultas, [], HOJE, [estado({ dispensadoEm: HOJE, motivo: "Mudou de cidade" })])).toEqual([]);
  });

  it("o estado de um atendimento antigo e o de outro paciente não valem", () => {
    const novas = [...consultas, atendida("ana", "2026-04-05")]; // atendida de novo: retorno em 05/10, a vencer
    const dispensaAntiga = estado({ dispensadoEm: "2026-09-01", motivo: "Mudou de cidade" });

    expect(retornosPendentes([ana], novas, [], HOJE, [dispensaAntiga])).toMatchObject([{ retornoEm: "2026-10-05", adiado: false }]);
    expect(retornosPendentes([ana], consultas, [], HOJE, [{ ...dispensaAntiga, id: "bia" }])).toHaveLength(1);
  });
});

describe("retornosDispensados", () => {
  const pacientes = [paciente("ana", "Ana Exemplo"), paciente("bia", "Bia Exemplo"), paciente("caio", "Caio Exemplo")];
  const consultas = [atendida("ana", "2026-03-10"), atendida("bia", "2026-03-10"), atendida("caio", "2026-03-10")];
  const dispensa = (id: string, dispensadoEm: string, motivo: string): EstadoDoRetorno => ({ id, ultimoAtendimento: "2026-03-10", dispensadoEm, motivo });

  it("lista os dispensados com o motivo, do mais recente ao mais antigo, e deixa de fora o adiado", () => {
    const estados: EstadoDoRetorno[] = [
      dispensa("ana", "2026-09-01", "Mudou de cidade"),
      dispensa("bia", "2026-09-20", "Já foi atendida em outra clínica"),
      { id: "caio", ultimoAtendimento: "2026-03-10", adiadoAte: "2026-10-15" },
    ];

    expect(retornosDispensados(pacientes, consultas, [], estados).map((d) => [d.paciente.nome, d.dispensadoEm, d.motivo])).toEqual([
      ["Bia Exemplo", "2026-09-20", "Já foi atendida em outra clínica"],
      ["Ana Exemplo", "2026-09-01", "Mudou de cidade"],
    ]);
  });

  it("a dispensa de um atendimento antigo deixa de contar quando o paciente é atendido de novo", () => {
    const novas = [...consultas, atendida("ana", "2026-04-05")];

    expect(retornosDispensados(pacientes, novas, [], [dispensa("ana", "2026-09-01", "Mudou de cidade")])).toEqual([]);
  });
});
