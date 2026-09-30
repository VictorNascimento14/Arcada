/**
 * Conflito de horário na agenda. Duas consultas disputam o horário quando dividem a cadeira **ou** o
 * profissional e os intervalos se sobrepõem. A consulta ocupa `[início, início + duração)`: encostar
 * (uma termina quando a outra começa) não é conflito.
 *
 * O horário vira minutos por aritmética em UTC, sem fuso e sem `toISOString()`: em UTC todo dia tem
 * 24 h, então somar a duração não erra na virada do dia nem depende da máquina.
 */
import type { Consulta, DataHoraISO } from "@/dominio";

/** O que o conflito olha numa consulta, gravada ou por gravar. Sem `id`, é uma consulta nova. */
export type Reserva = Pick<Consulta, "cadeiraId" | "profissionalId" | "inicio" | "duracaoMin"> & { id?: string };

/** O que colidiu: a cadeira, o profissional ou os dois. */
export type Motivo = "cadeira" | "profissional";

export type Conflito = { consulta: Consulta; motivos: Motivo[] };

// ponytail: não confere o formato. `inicio` incompleto (`2026-10-05T`) vira um horário errado, não um
// erro; quem grava (`src/dados/`) valida e a tela só chama com data e hora escolhidas. Se a checagem
// passar a receber texto solto, valida-se aqui com regex e `RangeError`, como em `idade`.
const minutos = (dh: DataHoraISO) =>
  Date.UTC(+dh.slice(0, 4), +dh.slice(5, 7) - 1, +dh.slice(8, 10), +dh.slice(11, 13), +dh.slice(14, 16)) / 60_000;

/**
 * As consultas de `consultas` que colidem com `candidata`, na ordem em que vieram e cada uma com o
 * motivo. A candidata é uma consulta nova (sem `id`) ou uma que está sendo remarcada: com `id`, ela
 * não conflita consigo mesma. Só a consulta cancelada libera o horário; as outras situações,
 * inclusive `faltou`, continuam ocupando.
 */
export function conflitosDaConsulta(candidata: Reserva, consultas: readonly Consulta[]): Conflito[] {
  const inicioA = minutos(candidata.inicio);
  const fimA = inicioA + candidata.duracaoMin;
  const conflitos: Conflito[] = [];
  for (const consulta of consultas) {
    if (consulta.situacao === "cancelada" || consulta.id === candidata.id) continue;
    const inicioB = minutos(consulta.inicio);
    const fimB = inicioB + consulta.duracaoMin;
    const sobrepoe = inicioA < fimB && inicioB < fimA;
    if (!sobrepoe) continue;
    const motivos: Motivo[] = [];
    if (consulta.cadeiraId === candidata.cadeiraId) motivos.push("cadeira");
    if (consulta.profissionalId === candidata.profissionalId) motivos.push("profissional");
    if (motivos.length > 0) conflitos.push({ consulta, motivos });
  }
  return conflitos;
}
