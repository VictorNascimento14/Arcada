/**
 * A mensagem com que a clínica pede ao paciente que confirme a consulta, e o link que a abre no WhatsApp dele. O
 * link sai do `linkWhatsApp` do módulo de pacientes, que devolve `null` para o telefone que não serve (vazio, curto
 * demais, ou um número fictício como o DDD 00 das sementes): sem link, não há o que oferecer.
 *
 * A mensagem sai do app: leva só o primeiro nome, o dia, o horário e o profissional. O procedimento fica de fora, porque
 * é dado de saúde do paciente.
 */
import type { Consulta, Paciente, Profissional } from "@/dominio";

import { linkWhatsApp } from "../pacientes/contato";
import { rotuloDoDia } from "./dias";

/** `Olá, Ana! Confirmamos sua consulta em quarta-feira, 30 de setembro de 2026 às 08:00 com Dra. Exemplo. ...` */
export function mensagemDeConfirmacao(paciente: Paciente, consulta: Consulta, profissional?: Profissional): string {
  const [primeiroNome] = paciente.nome.trim().split(/\s+/);
  const quando = `${rotuloDoDia(consulta.inicio.slice(0, 10))} às ${consulta.inicio.slice(11)}`;
  const com = profissional ? ` com ${profissional.nome}` : "";
  return `Olá, ${primeiroNome}! Confirmamos sua consulta em ${quando}${com}. Responda esta mensagem para confirmar sua presença ou, se precisar remarcar, é só avisar.`;
}

/** O link do WhatsApp do paciente com a mensagem de confirmação pronta, ou `null` se o telefone dele não serve. */
export const linkDeConfirmacao = (paciente: Paciente, consulta: Consulta, profissional?: Profissional): string | null =>
  linkWhatsApp(paciente.telefone, mensagemDeConfirmacao(paciente, consulta, profissional));
