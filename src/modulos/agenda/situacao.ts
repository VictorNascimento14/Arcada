/**
 * Situação da consulta: para onde ela pode ir a partir de onde está. O caminho é agendada →
 * confirmada → em atendimento → concluída, e a agendada também entra direto em atendimento (quem chega
 * sem ter confirmado é atendido do mesmo jeito); da agendada e da confirmada a consulta também pode
 * terminar em `faltou` (o paciente não veio) ou `cancelada`. Concluída, faltou e cancelada são
 * finais: a consulta não volta nem muda de novo.
 *
 * Regra pura. A tela monta os botões a partir de `transicoesDe`, e quem grava a mudança de situação
 * (`src/dados/`) confere em `podeTransitar`.
 */
import type { SituacaoConsulta } from "@/dominio";

// A ordem é a dos botões: o passo seguinte do atendimento primeiro, depois `faltou` e `cancelada`.
const TRANSICOES: Record<SituacaoConsulta, readonly SituacaoConsulta[]> = {
  agendada: ["confirmada", "em-atendimento", "faltou", "cancelada"],
  confirmada: ["em-atendimento", "faltou", "cancelada"],
  "em-atendimento": ["concluida"],
  concluida: [],
  faltou: [],
  cancelada: [],
};

/** As situações para as quais uma consulta em `situacao` pode ir, na ordem dos botões. Vazia: é final. */
export function transicoesDe(situacao: SituacaoConsulta): readonly SituacaoConsulta[] {
  return TRANSICOES[situacao];
}

/** Se a consulta pode passar de `de` para `para`. Pular etapa, voltar e repetir a situação não podem. */
export function podeTransitar(de: SituacaoConsulta, para: SituacaoConsulta): boolean {
  return TRANSICOES[de].includes(para);
}

/** O nome da situação como aparece na tela. */
export const ROTULO_DA_SITUACAO: Record<SituacaoConsulta, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  "em-atendimento": "Em atendimento",
  concluida: "Concluída",
  faltou: "Faltou",
  cancelada: "Cancelada",
};

/**
 * O que o botão diz para levar a consulta a essa situação: um verbo, e não o nome da situação. `agendada` não
 * tem: nenhuma transição leva a ela (só a marcação cria a consulta assim).
 */
export const ACAO_DA_SITUACAO: Partial<Record<SituacaoConsulta, string>> = {
  confirmada: "Confirmar consulta",
  "em-atendimento": "Iniciar atendimento",
  concluida: "Concluir atendimento",
  faltou: "Marcar falta",
  cancelada: "Cancelar consulta",
};
