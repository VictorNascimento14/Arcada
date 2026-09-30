/**
 * As consultas de um paciente vistas pelo atendimento. Regra pura: a aba da ficha lê a coleção e chama isto.
 *
 * ponytail: a cancelada fica na lista, com a situação escrita (a aba não decide o que a clínica quer ver).
 * Se virar ruído, é filtrar `situacao !== "cancelada"` em `consultasAPartirDe`.
 */
import type { Consulta, DataISO } from "@/dominio";
import { emHora, emMinutos } from "@/modulos/agenda/horarios";

/** As consultas do paciente de `hoje` em diante, na ordem do horário. Devolve uma lista nova: não mexe na recebida. */
export function consultasAPartirDe(todas: readonly Consulta[], pacienteId: string, hoje: DataISO): Consulta[] {
  return todas
    .filter((c) => c.pacienteId === pacienteId && c.inicio.slice(0, 10) >= hoje)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** `09:00–09:30`: do início ao fim da consulta. */
export function faixaDeHoras(consulta: Consulta): string {
  const inicio = consulta.inicio.slice(11);
  return `${inicio}–${emHora(emMinutos(inicio) + consulta.duracaoMin)}`;
}
