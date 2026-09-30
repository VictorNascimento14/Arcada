/**
 * Dia do calendário na agenda: somar dias, achar a semana e escrever por extenso. Vai pelos campos da data (ano, mês e dia
 * locais), nunca somando milissegundos: o dia seguinte é sempre o dia seguinte, com ou sem horário de verão.
 * `toISOString()` fica de fora: ele converte para UTC e, à noite no Brasil, já devolve o dia seguinte.
 */
import type { Consulta, DataISO } from "@/dominio";
import { diaISO } from "@/ui";

import { diaDaSemana } from "./horarios";

const paraData = (dia: DataISO, somaDias = 0) =>
  new Date(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)) + somaDias);

/** O dia `n` dias depois de `dia` (`n` negativo volta), passando de mês e de ano. */
export const somarDias = (dia: DataISO, n: number): DataISO => diaISO(paraData(dia, n));

/** O dia por extenso, para o título da tela: `quarta-feira, 30 de setembro de 2026`. */
export const rotuloDoDia = (dia: DataISO): string =>
  paraData(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** A segunda-feira da semana de `dia`. A semana da agenda vai de segunda a domingo: o domingo fecha a semana. */
export const inicioDaSemana = (dia: DataISO): DataISO => somarDias(dia, diaDaSemana(dia) === 0 ? -6 : 1 - diaDaSemana(dia));

/** Os sete dias da semana de `dia`, de segunda a domingo. */
export const diasDaSemana = (dia: DataISO): DataISO[] =>
  Array.from({ length: 7 }, (_, i) => somarDias(inicioDaSemana(dia), i));

/** O intervalo da semana de `dia`, para o título: `28 de setembro a 4 de outubro de 2026`. Mês e ano só onde mudam. */
export function rotuloDaSemana(dia: DataISO): string {
  const [primeiro, , , , , , ultimo] = diasDaSemana(dia);
  const de = paraData(primeiro);
  const ate = paraData(ultimo);
  const diaEMes = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  if (de.getFullYear() !== ate.getFullYear()) return `${diaEMes(de)} de ${de.getFullYear()} a ${diaEMes(ate)} de ${ate.getFullYear()}`;
  return `${de.getMonth() === ate.getMonth() ? de.getDate() : diaEMes(de)} a ${diaEMes(ate)} de ${ate.getFullYear()}`;
}

/** Os dias que têm consulta na grade, em ordem e sem repetir: a cancelada libera o horário e não conta. */
export const diasComConsulta = (consultas: readonly Consulta[]): DataISO[] =>
  [...new Set(consultas.filter((c) => c.situacao !== "cancelada").map((c) => c.inicio.slice(0, 10)))].sort();
