/**
 * Dia do calendário na agenda: somar dias e escrever por extenso. Vai pelos campos da data (ano, mês e dia
 * locais), nunca somando milissegundos: o dia seguinte é sempre o dia seguinte, com ou sem horário de verão.
 * `toISOString()` fica de fora: ele converte para UTC e, à noite no Brasil, já devolve o dia seguinte.
 */
import type { DataISO } from "@/dominio";
import { diaISO } from "@/ui";

const paraData = (dia: DataISO, somaDias = 0) =>
  new Date(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)) + somaDias);

/** O dia `n` dias depois de `dia` (`n` negativo volta), passando de mês e de ano. */
export const somarDias = (dia: DataISO, n: number): DataISO => diaISO(paraData(dia, n));

/** O dia por extenso, para o título da tela: `quarta-feira, 30 de setembro de 2026`. */
export const rotuloDoDia = (dia: DataISO): string =>
  paraData(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
