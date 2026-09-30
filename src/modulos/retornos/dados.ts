// A coleção `retornos`, dado só deste módulo: o estado de adiar e dispensar de cada paciente. A tela lê por
// `useColecao(retornos)` e escreve por `adiarRetorno`, `dispensarRetorno` e `reativarRetorno`; nunca toca o armazenamento.
//
// Quem grava confere tudo: o retorno tem de existir (o paciente já foi atendido), os dias precisam ser um inteiro de 1 a
// 365 e a dispensa exige o motivo. O estado fica sempre ligado ao retorno em curso (`estado.ts`).
//
// ponytail: o motivo é texto livre e a tela o mostra ao lado do nome. O campo avisa para não pôr dado de saúde, mas o
// app não confere. Se a clínica quiser, o caminho é uma lista fechada de motivos.

import { criarColecao } from "@/dados/colecao";
import { consultas, planos } from "@/dados/colecoes";
import type { DataISO } from "@/dominio";
import { diaISO } from "@/ui";

import { adiadoPara, estadoVigente, type EstadoDoRetorno } from "./estado";
import { retornoDoPaciente } from "./regra";

export const retornos = criarColecao<EstadoDoRetorno>("retornos");

/** Até quantos dias se adia de uma vez. */
export const ADIAR_MAX_DIAS = 365;
/** O tamanho máximo do motivo da dispensa, em caracteres. */
export const MOTIVO_MAX = 200;

export type Resultado<T = unknown> = ({ ok: true } & T) | { ok: false; erro: string };

/**
 * Adia o retorno do paciente em `dias` (ver `adiadoPara` para de onde a conta parte) e grava o estado. Devolve o dia a que
 * o retorno foi, ou o motivo de não ter gravado.
 */
export function adiarRetorno(pacienteId: string, dias: number): Resultado<{ adiadoAte: DataISO }> {
  if (!Number.isInteger(dias) || dias < 1 || dias > ADIAR_MAX_DIAS) return { ok: false, erro: `Informe de 1 a ${ADIAR_MAX_DIAS} dias.` };
  const retorno = retornoDoPaciente(pacienteId, consultas.listar(), planos.listar());
  if (!retorno) return { ok: false, erro: "Este paciente ainda não tem retorno a adiar." };
  const atual = estadoVigente(retornos.obter(pacienteId), retorno);
  if (atual?.dispensadoEm) return { ok: false, erro: "Este retorno foi dispensado. Reative-o antes de adiar." };

  const adiadoAte = adiadoPara(retorno, atual, diaISO(new Date()), dias);
  retornos.salvar({ id: pacienteId, ultimoAtendimento: retorno.ultimoAtendimento, adiadoAte });
  return { ok: true, adiadoAte };
}

/**
 * Dispensa o retorno do paciente, com o motivo (sem as pontas), datado de hoje. A dispensa troca o adiamento, se havia.
 * Devolve `ok`, ou o motivo de não ter gravado.
 */
export function dispensarRetorno(pacienteId: string, motivo: string): Resultado {
  const limpo = motivo.trim();
  if (!limpo) return { ok: false, erro: "Diga o motivo da dispensa." };
  if (limpo.length > MOTIVO_MAX) return { ok: false, erro: `O motivo passa de ${MOTIVO_MAX} caracteres.` };
  const retorno = retornoDoPaciente(pacienteId, consultas.listar(), planos.listar());
  if (!retorno) return { ok: false, erro: "Este paciente ainda não tem retorno a dispensar." };

  retornos.salvar({ id: pacienteId, ultimoAtendimento: retorno.ultimoAtendimento, dispensadoEm: diaISO(new Date()), motivo: limpo });
  return { ok: true };
}

/** Desfaz o adiamento ou a dispensa: o retorno volta ao dia da regra. Sem estado, não faz nada. */
export const reativarRetorno = (pacienteId: string): void => retornos.remover(pacienteId);
