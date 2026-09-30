/**
 * Mudar a situação da consulta: a gravação por trás dos botões do detalhe. Confere na hora de gravar, como
 * `marcarConsulta`: a tela só oferece as transições válidas, mas quem decide é `podeTransitar`.
 *
 * Nenhuma transição precisa rever o conflito de horário: elas não mexem em cadeira, profissional nem horário, e
 * a única situação que libera o horário (`cancelada`) é final, então a consulta nunca volta a ocupar o que
 * estava livre. Cancelar pede o motivo e não passa por aqui.
 *
 * ponytail: não confere a data. Dá para iniciar o atendimento ou registrar a falta de uma consulta de outro
 * dia; se a clínica quiser travar, é comparar `inicio` com `diaISO(new Date())` logo antes de gravar.
 */
import { consultas } from "@/dados/colecoes";
import type { Consulta, SituacaoConsulta } from "@/dominio";

import { podeTransitar, ROTULO_DA_SITUACAO } from "./situacao";

export type ResultadoDaMudanca = { ok: true; consulta: Consulta } | { ok: false; erro: string };

export function mudarSituacao(id: string, para: SituacaoConsulta): ResultadoDaMudanca {
  const consulta = consultas.obter(id);
  if (!consulta) return { ok: false, erro: "Esta consulta não existe mais." };
  if (para === "cancelada") return { ok: false, erro: "Cancelar a consulta pede o motivo." };
  if (!podeTransitar(consulta.situacao, para)) {
    const nome = (s: SituacaoConsulta) => ROTULO_DA_SITUACAO[s].toLowerCase();
    return { ok: false, erro: `A consulta ${nome(consulta.situacao)} não pode passar para ${nome(para)}.` };
  }
  const nova: Consulta = { ...consulta, situacao: para };
  consultas.salvar(nova);
  return { ok: true, consulta: nova };
}
