// A coleção `evolucoes`, dado só deste módulo: a evolução clínica é texto livre, escrito por quem atende, e só se
// acrescenta. A tela lê por `useColecao(evolucoes)` e escreve por `registrarEvolucao`; nunca toca o armazenamento.
//
// O app não escreve a evolução: não há modelo, texto sugerido nem conduta. O campo nasce vazio e o texto é do
// profissional, do jeito que ele digitou (só as pontas são aparadas).
//
// ponytail: a evolução não se edita nem se apaga, porque é registro clínico: corrigir é registrar outra. Se a
// clínica precisar de retificação, o caminho é uma evolução que aponte para a anterior, nunca sobrescrevê-la.

import { criarColecao } from "@/dados/colecao";
import { consultas } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import type { DataISO } from "@/dominio";
import { diaISO } from "@/ui";

export type Evolucao = {
  id: string;
  pacienteId: string;
  consultaId: string;
  /** Quem atendeu: o profissional da consulta. */
  profissionalId: string;
  /** O dia em que foi escrita (`diaISO`). */
  dia: DataISO;
  texto: string;
};

export const evolucoes = criarColecao<Evolucao>("evolucoes");

/** Até onde vai o texto de uma evolução, em caracteres. */
export const LIMITE_DA_EVOLUCAO = 5000;

export type ResultadoDaEvolucao = { ok: true; evolucao: Evolucao } | { ok: false; erro: string };

/**
 * Valida e grava uma evolução da consulta, datada de hoje e assinada pelo profissional dela. Só a consulta em
 * atendimento recebe evolução. Devolve a evolução gravada, ou o motivo de não ter gravado.
 */
export function registrarEvolucao(consultaId: string, texto: string): ResultadoDaEvolucao {
  const consulta = consultas.obter(consultaId);
  if (!consulta) return { ok: false, erro: "Esta consulta não existe mais." };
  if (consulta.situacao !== "em-atendimento") return { ok: false, erro: "A evolução se registra com a consulta em atendimento." };

  const limpo = texto.trim();
  if (!limpo) return { ok: false, erro: "Escreva a evolução." };
  if (limpo.length > LIMITE_DA_EVOLUCAO) return { ok: false, erro: `A evolução passa de ${LIMITE_DA_EVOLUCAO.toLocaleString("pt-BR")} caracteres.` };

  const evolucao: Evolucao = {
    id: novoId(),
    pacienteId: consulta.pacienteId,
    consultaId,
    profissionalId: consulta.profissionalId,
    dia: diaISO(new Date()),
    texto: limpo,
  };
  evolucoes.salvar(evolucao);
  return { ok: true, evolucao };
}
