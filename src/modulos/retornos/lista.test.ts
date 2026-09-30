import { describe, expect, it } from "vitest";

import type { Consulta, Paciente, PlanoTratamento } from "@/dominio";

import { JANELA_A_VENCER_DIAS, retornosPendentes } from "./lista";

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

  it("usa o prazo do procedimento: o mapa passado vale no lugar do padrão", () => {
    const consultas = [atendida("ana", "2026-08-20", { procedimentoId: "proc-x" })];

    expect(retornosPendentes([paciente("ana")], consultas, [], HOJE)).toEqual([]); // 6 meses: só em fevereiro
    expect(retornosPendentes([paciente("ana")], consultas, [], HOJE, { "proc-x": 1 })).toMatchObject([
      { retornoEm: "2026-09-20", situacao: "vencido", dias: 10 },
    ]);
  });
});
