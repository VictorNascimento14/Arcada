/**
 * Consultas de demonstração: dez, de segunda a sexta da semana de hoje (no sábado e no domingo, da semana
 * que vem), com quem já vem no núcleo — pacientes, profissionais e cadeiras de `src/dados/sementes.ts`.
 * As datas saem de "hoje" na hora de semear, então a agenda tem o que mostrar no dia em que o app abre pela
 * primeira vez. Cada consulta cabe no expediente da clínica de demonstração e nenhuma disputa cadeira ou
 * profissional com outra (o teste confere as duas coisas com as regras da agenda). Os procedimentos ficam
 * de fora: o catálogo tem o semeador dele, e semear por cima o deixaria com a lista curta daqui.
 */
import { consultas } from "@/dados/colecoes";
import type { Semeador } from "@/dados/sementes";
import type { Consulta, DataISO, HoraISO, SituacaoConsulta } from "@/dominio";
import { diaISO } from "@/ui";

import { somarDias } from "./dias";
import { feriadoDoDia } from "./feriados";
import { diaDaSemana } from "./horarios";

type Modelo = {
  /** 0 é a segunda-feira da semana, 4 a sexta. */
  dia: number;
  hora: HoraISO;
  duracaoMin: number;
  paciente: string;
  profissional: string;
  cadeira: string;
  /** A situação da consulta que ainda vai acontecer; a de um dia que já passou vira `concluida`. */
  situacao: SituacaoConsulta;
};

const MODELOS: readonly Modelo[] = [
  { dia: 0, hora: "08:00", duracaoMin: 45, paciente: "pac-ana", profissional: "prof-exemplo", cadeira: "cadeira-1", situacao: "confirmada" },
  { dia: 0, hora: "09:30", duracaoMin: 30, paciente: "pac-joao", profissional: "prof-exemplo-2", cadeira: "cadeira-2", situacao: "agendada" },
  { dia: 1, hora: "08:30", duracaoMin: 60, paciente: "pac-carlos", profissional: "prof-exemplo", cadeira: "cadeira-1", situacao: "confirmada" },
  { dia: 1, hora: "14:00", duracaoMin: 45, paciente: "pac-luisa", profissional: "prof-exemplo-2", cadeira: "cadeira-2", situacao: "agendada" },
  { dia: 2, hora: "08:00", duracaoMin: 30, paciente: "pac-helena", profissional: "prof-exemplo", cadeira: "cadeira-1", situacao: "confirmada" },
  { dia: 2, hora: "08:00", duracaoMin: 60, paciente: "pac-marina", profissional: "prof-exemplo-2", cadeira: "cadeira-2", situacao: "agendada" },
  { dia: 2, hora: "10:30", duracaoMin: 90, paciente: "pac-sebastiao", profissional: "prof-exemplo", cadeira: "cadeira-1", situacao: "agendada" },
  { dia: 3, hora: "09:30", duracaoMin: 45, paciente: "pac-exemplo", profissional: "prof-exemplo", cadeira: "cadeira-1", situacao: "confirmada" },
  { dia: 3, hora: "15:00", duracaoMin: 60, paciente: "pac-ana", profissional: "prof-exemplo-2", cadeira: "cadeira-2", situacao: "agendada" },
  { dia: 4, hora: "14:30", duracaoMin: 30, paciente: "pac-carlos", profissional: "prof-exemplo", cadeira: "cadeira-1", situacao: "agendada" },
];

/** A segunda-feira da semana de `hoje`; sábado e domingo já olham para a semana seguinte. */
function segundaDaSemana(hoje: DataISO): DataISO {
  const dia = diaDaSemana(hoje);
  return somarDias(hoje, dia === 0 ? 1 : dia === 6 ? 2 : 1 - dia);
}

/** Só preenche a coleção vazia, como todo semeador: nunca mexe no que o usuário já marcou. */
export const semeador: Semeador = {
  chave: "agenda",
  versao: 1,
  semear: () => {
    if (consultas.listar().length > 0) return;
    const hoje = diaISO(new Date());
    const segunda = segundaDaSemana(hoje);
    consultas.substituirTudo(
      MODELOS.flatMap((m, i): Consulta[] => {
        const dia = somarDias(segunda, m.dia);
        if (feriadoDoDia(dia)) return []; // a agenda não marca em feriado
        const jaPassou = dia < hoje && (m.situacao === "agendada" || m.situacao === "confirmada");
        return [
          {
            id: `cons-demo-${i + 1}`,
            pacienteId: m.paciente,
            profissionalId: m.profissional,
            cadeiraId: m.cadeira,
            inicio: `${dia}T${m.hora}`,
            duracaoMin: m.duracaoMin,
            situacao: jaPassou ? "concluida" : m.situacao,
          },
        ];
      }),
    );
  },
};
