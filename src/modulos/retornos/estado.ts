/**
 * O estado de um retorno que a recepção mexeu: adiado ou dispensado. Regra pura, sem coleção (ela é de `dados.ts`).
 *
 * Um estado vale só para o retorno em curso: ele guarda o dia do último atendimento de que o retorno partiu. Se o
 * paciente é atendido de novo, o retorno passa a contar do atendimento novo e o estado antigo deixa de valer, sem que
 * ninguém precise apagá-lo.
 */
import type { DataISO } from "@/dominio";

import { somarDias } from "../agenda/dias";
import type { Retorno } from "./regra";

export type EstadoDoRetorno = {
  /** O `id` do paciente: há um estado por paciente, o do retorno em curso. */
  id: string;
  /** O último atendimento de que o retorno partiu (`Retorno.ultimoAtendimento`). Outro, depois dele, abre um retorno novo. */
  ultimoAtendimento: DataISO;
  /** Adiado: o retorno só vale a partir deste dia. */
  adiadoAte?: DataISO;
  /** Dispensado: o dia da dispensa e o motivo dado. */
  dispensadoEm?: DataISO;
  motivo?: string;
};

/** O estado do paciente, se ainda vale para o `retorno` dele: o do mesmo último atendimento. */
export const estadoVigente = (estado: EstadoDoRetorno | undefined, retorno: Retorno): EstadoDoRetorno | undefined =>
  estado?.ultimoAtendimento === retorno.ultimoAtendimento ? estado : undefined;

/** O dia em que o retorno vale agora: o adiado, se passa o da regra, e senão o da regra. `estado` é o vigente. */
export const dataDoRetorno = (retorno: Retorno, estado?: EstadoDoRetorno): DataISO =>
  estado?.adiadoAte && estado.adiadoAte > retorno.retornoEm ? estado.adiadoAte : retorno.retornoEm;

/**
 * O dia a que o retorno vai, adiado em `dias`. A conta parte da data que o retorno tem agora ou de hoje, a que for
 * maior: adiar o que vence daqui a 20 dias empurra o dia dele (mais 7, vence daqui a 27), e adiar o que já venceu conta
 * de hoje, porque somar ao dia vencido o deixaria vencido. `estado` é o vigente.
 */
export function adiadoPara(retorno: Retorno, estado: EstadoDoRetorno | undefined, hoje: DataISO, dias: number): DataISO {
  const atual = dataDoRetorno(retorno, estado);
  return somarDias(atual > hoje ? atual : hoje, dias);
}
