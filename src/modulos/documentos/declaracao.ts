// A declaração de comparecimento: paciente, profissional, a data e o horário de início e de fim. O horário pode vir de
// uma consulta do paciente. Regra pura, sem React: a tela só chama `prepararDeclaracao`.

import type { Consulta, DataISO, HoraISO, Paciente, Profissional } from "@/dominio";
import { emHora, emMinutos } from "@/modulos/agenda/horarios";

import { textoDoPeriodo } from "./atestado";
import { dataValida, horaValida, resolverEscolha, type ErrosDaEscolha } from "./validacao";

/** O formulário, como foi digitado. `consultaId` só ajuda a preencher a data e as horas: não vai para o papel. */
export type CamposDaDeclaracao = {
  pacienteId: string;
  profissionalId: string;
  consultaId: string;
  data: DataISO;
  horaInicio: HoraISO;
  horaFim: HoraISO;
};
export type ErrosDaDeclaracao = ErrosDaEscolha & Partial<Record<"data" | "horaInicio" | "horaFim", string>>;

/** O formulário de uma declaração nova, na data de `hoje` (`diaISO(new Date())` de `@/ui`), sem consulta nem horário. */
export const camposDaDeclaracao = (hoje: DataISO): CamposDaDeclaracao => ({
  pacienteId: "",
  profissionalId: "",
  consultaId: "",
  data: hoje,
  horaInicio: "",
  horaFim: "",
});

/**
 * As consultas do paciente de que se pode tirar o horário, da mais recente para a mais antiga. Falta e consulta
 * cancelada ficam de fora: o paciente não compareceu, ou não houve consulta. Agendada e confirmada entram, porque
 * a agenda pode estar atrás do consultório (a recepção ainda não iniciou o atendimento); quem assina é que decide.
 */
export function consultasDoPaciente(consultas: readonly Consulta[], pacienteId: string): Consulta[] {
  return consultas
    .filter((c) => c.pacienteId === pacienteId && c.situacao !== "faltou" && c.situacao !== "cancelada")
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
}

const ULTIMO_MINUTO = 23 * 60 + 59;

/**
 * O dia e as horas da consulta, para preencher o formulário. O fim é o início mais a duração; uma consulta que
 * passa da meia-noite termina às 23:59, porque a declaração é de um dia só (e dá para ajustar a mão).
 */
export function horarioDaConsulta(c: Pick<Consulta, "inicio" | "duracaoMin">): Pick<CamposDaDeclaracao, "data" | "horaInicio" | "horaFim"> {
  const horaInicio = c.inicio.slice(11);
  return {
    data: c.inicio.slice(0, 10),
    horaInicio,
    horaFim: emHora(Math.min(emMinutos(horaInicio) + c.duracaoMin, ULTIMO_MINUTO)),
  };
}

/** O que a folha imprime: só o nome do paciente, o nome e o CRO de quem assina e o dia e o horário, já escritos. */
export type DadosDaDeclaracao = {
  paciente: Pick<Paciente, "nome">;
  profissional: Pick<Profissional, "nome" | "cro">;
  /** `30/09/2026, das 08:00 às 09:00`. */
  quando: string;
};

export type ResultadoDaDeclaracao = { ok: true; dados: DadosDaDeclaracao } | { ok: false; erros: ErrosDaDeclaracao };

/** Confere o formulário e, estando tudo certo, monta o que vai para o papel. O fim tem de ser depois do início. */
export function prepararDeclaracao(
  campos: CamposDaDeclaracao,
  pacientes: readonly Paciente[],
  profissionais: readonly Profissional[],
): ResultadoDaDeclaracao {
  const { paciente, profissional, erros: escolha } = resolverEscolha(campos.pacienteId, campos.profissionalId, pacientes, profissionais);
  const erros: ErrosDaDeclaracao = { ...escolha };

  if (!dataValida(campos.data)) erros.data = "Informe a data.";
  if (!horaValida(campos.horaInicio)) erros.horaInicio = "Informe a hora de início.";
  if (!horaValida(campos.horaFim)) erros.horaFim = "Informe a hora de fim.";
  else if (!erros.horaInicio && campos.horaFim <= campos.horaInicio) erros.horaFim = "O fim tem de ser depois do início.";

  if (!paciente || !profissional || Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: {
      paciente: { nome: paciente.nome },
      profissional: { nome: profissional.nome, cro: profissional.cro },
      quando: textoDoPeriodo(`${campos.data}T${campos.horaInicio}`, `${campos.data}T${campos.horaFim}`),
    },
  };
}
