// Como o paciente aparece nas telas do módulo (cartão da lista, cabeçalho da ficha): idade e convênio em
// texto. Regra pura, sem React.

import type { Paciente } from "@/dominio";

import { idade } from "./idade";

/**
 * Anos completos do paciente em `hoje` (`diaISO(new Date())` de `@/ui`). `null` quando o nascimento guardado
 * não serve — fora do formato ou no futuro —, para um registro estragado não derrubar a tela inteira.
 */
export function anosDoPaciente(paciente: Pick<Paciente, "nascimento">, hoje: string): number | null {
  try {
    const anos = idade(paciente.nascimento, hoje);
    return anos >= 0 ? anos : null;
  } catch {
    return null;
  }
}

/** `34 anos`, `1 ano` e, para quem ainda não fez o primeiro aniversário, `menos de 1 ano`. */
export function rotuloIdade(anos: number): string {
  if (anos < 1) return "menos de 1 ano";
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

/** O convênio, ou `Particular` quando não há (ausente ou em branco). */
export function rotuloConvenio(paciente: Pick<Paciente, "convenio">): string {
  return paciente.convenio?.trim() || "Particular";
}
