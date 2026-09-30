/**
 * As consultas de hoje no painel: quais entram, em que ordem e qual é a próxima. Regra pura: o "agora" vem de fora
 * (`agoraISO(new Date())`, na tela), para o teste escolher o dia e a hora.
 */
import type { Consulta, DataHoraISO, DataISO } from "@/dominio";
import { aguardaAtendimento } from "@/modulos/agenda/situacao";
import { diaISO } from "@/ui";

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/**
 * O instante de `d` no horário local, `AAAA-MM-DDTHH:mm`. O dia sai de `diaISO`, nunca de `toISOString()`: ele
 * converte para UTC e, à noite no Brasil, já devolve o dia seguinte.
 */
export const agoraISO = (d: Date): DataHoraISO => `${diaISO(d)}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;

/**
 * As consultas que ocupam a agenda em `hoje`, na ordem do horário; duas no mesmo horário ficam na ordem em que
 * foram marcadas. A cancelada libera o horário e não conta, como na grade da agenda.
 */
export function consultasDeHoje(consultas: readonly Consulta[], hoje: DataISO): Consulta[] {
  return consultas
    .filter((c) => c.inicio.slice(0, 10) === hoje && c.situacao !== "cancelada")
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/**
 * A próxima consulta: a primeira de `doDia` (já em ordem, como sai de `consultasDeHoje`) que ainda aguarda o
 * atendimento e não começa antes de `agora`. Em atendimento, concluída e faltou não são "próximas"; a que passou da
 * hora sem começar também não: segue na lista com a situação que tem, à espera de quem a mude.
 */
export const proximaConsulta = (doDia: readonly Consulta[], agora: DataHoraISO): Consulta | undefined =>
  doDia.find((c) => aguardaAtendimento(c.situacao) && c.inicio >= agora);
