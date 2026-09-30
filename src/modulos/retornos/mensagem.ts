/**
 * A mensagem com que a clínica chama o paciente para o retorno, e o link que a abre no WhatsApp dele. O link sai do
 * `linkWhatsApp` do módulo de pacientes, que devolve `null` para o telefone que não serve (vazio, curto demais, ou um
 * número fictício como o DDD 00 das sementes): sem link, não há o que oferecer.
 *
 * A mensagem sai do app: leva só o primeiro nome. Não cita procedimento, data de atendimento nem prazo — é dado de
 * saúde, ou chega perto —, e o paciente já sabe por que a clínica escreve.
 */
import type { Paciente } from "@/dominio";

import { linkWhatsApp } from "../pacientes/contato";

/** `Olá, Ana! Está na hora do seu retorno ao consultório. Vamos marcar um horário? É só responder esta mensagem.` */
export function mensagemDeRetorno(paciente: Paciente): string {
  const [primeiroNome] = paciente.nome.trim().split(/\s+/);
  return `Olá, ${primeiroNome}! Está na hora do seu retorno ao consultório. Vamos marcar um horário? É só responder esta mensagem.`;
}

/** O link do WhatsApp do paciente com a mensagem de retorno pronta, ou `null` se o telefone dele não serve. */
export const linkDeRetorno = (paciente: Paciente): string | null => linkWhatsApp(paciente.telefone, mensagemDeRetorno(paciente));
