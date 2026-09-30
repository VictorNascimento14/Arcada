/**
 * Atendimentos antigos de demonstração, para `/retornos` nascer com o que mostrar. As consultas da agenda são desta semana,
 * e o retorno de quem é atendido só vence daqui a meses: sem estes, a lista abriria vazia. São quatro pacientes que não vêm
 * esta semana — acrescentados ao cadastro —, cada um com uma consulta concluída datada de modo que o retorno caia onde se
 * quer (dois vencidos e dois a vencer), contada a partir de "hoje" na hora de semear. Tudo fictício: nome de exemplo e
 * telefone com DDD 00.
 *
 * Ao contrário dos outros semeadores, este acrescenta à coleção das consultas, que a agenda já semeou (o registro acha os
 * semeadores em ordem alfabética, e `agenda` vem antes). Por isso só roda com a coleção já preenchida: semear antes da
 * agenda a faria pular as consultas dela, que só planta em coleção vazia.
 */
import { consultas, pacientes } from "@/dados/colecoes";
import type { Semeador } from "@/dados/sementes";
import type { Paciente } from "@/dominio";
import { diaISO } from "@/ui";

import { somarDias } from "../agenda/dias";
import { intervaloDoProcedimento, somarMeses } from "./regra";

type Modelo = {
  paciente: Paciente;
  /** O `id` do procedimento no catálogo padrão. */
  procedimento: string;
  /** Quantos dias depois de hoje o retorno cai; negativo é vencido. */
  retornoEmDias: number;
};

const MODELOS: readonly Modelo[] = [
  { paciente: { id: "pac-ret-1", nome: "Rafael Teixeira", nascimento: "1982-04-17", telefone: "(00) 90000-0011" }, procedimento: "proc-profilaxia", retornoEmDias: -45 },
  { paciente: { id: "pac-ret-2", nome: "Beatriz Campos", nascimento: "1991-08-09", telefone: "(00) 90000-0012" }, procedimento: "proc-profilaxia", retornoEmDias: -12 },
  { paciente: { id: "pac-ret-3", nome: "Otávio Ramos", nascimento: "2008-01-25", telefone: "(00) 90000-0013" }, procedimento: "proc-manutencao-aparelho", retornoEmDias: 9 },
  { paciente: { id: "pac-ret-4", nome: "Sara Nogueira", nascimento: "1975-11-03", telefone: "(00) 90000-0014" }, procedimento: "proc-fluor-topico", retornoEmDias: 24 },
];

/** Só acrescenta o que falta, pelo `id`: nunca mexe no que o usuário já tem nem duplica ao rodar de novo. */
export const semeador: Semeador = {
  chave: "retornos",
  versao: 1,
  semear: () => {
    if (consultas.listar().length === 0) return;
    const hoje = diaISO(new Date());
    MODELOS.forEach(({ paciente, procedimento, retornoEmDias }, i) => {
      if (!pacientes.obter(paciente.id)) pacientes.salvar(paciente);
      const id = `cons-demo-ret-${i + 1}`;
      if (consultas.obter(id)) return;
      const atendidoEm = somarMeses(somarDias(hoje, retornoEmDias), -intervaloDoProcedimento(procedimento));
      consultas.salvar({
        id,
        pacienteId: paciente.id,
        profissionalId: "prof-exemplo",
        cadeiraId: "cadeira-1",
        procedimentoId: procedimento,
        inicio: `${atendidoEm}T09:00`,
        duracaoMin: 45,
        situacao: "concluida",
      });
    });
  },
};
