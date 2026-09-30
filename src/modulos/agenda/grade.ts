/**
 * A janela de horas que a visão do dia desenha. Ela cobre o expediente do dia e cresce para caber uma
 * consulta fora dele (a clínica mudou o horário depois de marcar, ou há consulta num dia fechado): a
 * consulta nunca some da tela. Os limites são horas cheias, para o traço e o rótulo caírem em cima da hora.
 * Regra pura, tudo em minutos desde a meia-noite.
 */
import type { Consulta, FaixaHoraria, HoraISO } from "@/dominio";
import { emHora, emMinutos } from "./horarios";

export type Grade = {
  /** Minutos desde a meia-noite em que a janela começa e termina, sempre em hora cheia. */
  de: number;
  ate: number;
  /** Uma marca por hora cheia, de `de` a `ate`. */
  horas: { min: number; rotulo: HoraISO }[];
  /** Trechos da janela em que a clínica não atende: o almoço, antes de abrir e depois de fechar. */
  fechados: { de: number; ate: number }[];
};

const DIA_MIN = 24 * 60;

/**
 * A grade do dia, ou `null` quando não há o que desenhar: dia fechado e sem consulta. `faixas` é o
 * expediente do dia da semana e `consultas` as do dia (a cancelada já ficou de fora, quem chama filtra).
 *
 * ponytail: a janela para na meia-noite; consulta que atravessa o dia é cortada no fim da grade.
 */
export function montarGrade(
  faixas: readonly FaixaHoraria[],
  consultas: readonly Pick<Consulta, "inicio" | "duracaoMin">[],
): Grade | null {
  const abertos = faixas.map((f) => ({ de: emMinutos(f.inicio), ate: emMinutos(f.fim) })).sort((a, b) => a.de - b.de);
  const ocupados = consultas.map((c) => {
    const de = emMinutos(c.inicio.slice(11));
    return { de, ate: de + c.duracaoMin };
  });
  const todos = [...abertos, ...ocupados];
  if (todos.length === 0) return null;

  const de = Math.floor(Math.min(...todos.map((t) => t.de)) / 60) * 60;
  const ate = Math.min(Math.ceil(Math.max(...todos.map((t) => t.ate)) / 60) * 60, DIA_MIN);

  // O que não é faixa aberta é fechado: percorre as faixas em ordem e anota os vãos.
  const fechados: Grade["fechados"] = [];
  let cursor = de;
  for (const f of abertos) {
    if (f.de > cursor) fechados.push({ de: cursor, ate: f.de });
    cursor = Math.max(cursor, f.ate);
  }
  if (cursor < ate) fechados.push({ de: cursor, ate });

  const horas: Grade["horas"] = [];
  for (let min = de; min <= ate; min += 60) horas.push({ min, rotulo: emHora(min) });
  return { de, ate, horas, fechados };
}
