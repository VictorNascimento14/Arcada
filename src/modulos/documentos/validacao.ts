// O que os documentos (receituário, atestado, declaração) validam do mesmo jeito: quem é o paciente, quem assina e a
// data. Regra pura, sem React.

import { profissionalAtivo, type DataISO, type Paciente, type Profissional } from "@/dominio";
import { somarDias } from "@/modulos/agenda/dias";

export type ErrosDaEscolha = { pacienteId?: string; profissionalId?: string };

/** `AAAA-MM-DD` de um dia que existe: `2026-02-30` passa no formato, mas `somarDias` o devolve como `2026-03-02`. */
export const dataValida = (dia: DataISO): boolean => /^\d{4}-\d{2}-\d{2}$/.test(dia) && somarDias(dia, 0) === dia;

/**
 * O paciente e o profissional escolhidos, achados pelo id. Paciente removido depois de escolhido e profissional
 * inativo (que some da lista, mas pode ter sido escolhido antes) voltam como erro do campo: a lista da tela é
 * conforto, esta é a regra.
 */
export function resolverEscolha(
  pacienteId: string,
  profissionalId: string,
  pacientes: readonly Paciente[],
  profissionais: readonly Profissional[],
): { paciente?: Paciente; profissional?: Profissional; erros: ErrosDaEscolha } {
  const paciente = pacientes.find((p) => p.id === pacienteId);
  const profissional = profissionais.find((p) => p.id === profissionalId && profissionalAtivo(p));
  const erros: ErrosDaEscolha = {};
  if (!paciente) erros.pacienteId = "Escolha o paciente.";
  if (!profissional) erros.profissionalId = "Escolha o profissional.";
  return { paciente, profissional, erros };
}
