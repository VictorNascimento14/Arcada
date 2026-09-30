// O atestado: paciente, profissional, o período (data e hora de início e de fim) e a finalidade em texto livre. Regra
// pura, sem React: a tela só chama `prepararAtestado`. O app não escreve o atestado: nenhum texto de atestado, prazo
// de afastamento ou conduta vem preenchido. Período e finalidade são de quem emite.

import type { DataHoraISO, DataISO, HoraISO, Paciente, Profissional } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";

import { dataValida, horaValida, resolverEscolha, type ErrosDaEscolha } from "./validacao";

/** Uma finalidade é uma frase ou duas: o que passar disso é texto de outro documento. */
export const LIMITE_DA_FINALIDADE = 500;

/** O formulário, como foi digitado. As horas começam vazias: quem emite diz o período. */
export type CamposDoAtestado = {
  pacienteId: string;
  profissionalId: string;
  dataInicio: DataISO;
  horaInicio: HoraISO;
  dataFim: DataISO;
  horaFim: HoraISO;
  finalidade: string;
};
export type ErrosDoAtestado = ErrosDaEscolha & Partial<Record<"dataInicio" | "horaInicio" | "dataFim" | "horaFim" | "finalidade", string>>;

/** O formulário de um atestado novo: começa e termina em `hoje` (`diaISO(new Date())` de `@/ui`), sem hora nem finalidade. */
export const camposDoAtestado = (hoje: DataISO): CamposDoAtestado => ({
  pacienteId: "",
  profissionalId: "",
  dataInicio: hoje,
  horaInicio: "",
  dataFim: hoje,
  horaFim: "",
  finalidade: "",
});

/** O que a folha imprime: só o nome do paciente, o nome e o CRO de quem assina, o período já escrito e a finalidade. */
export type DadosDoAtestado = {
  paciente: Pick<Paciente, "nome">;
  profissional: Pick<Profissional, "nome" | "cro">;
  periodo: string;
  finalidade: string;
};

export type ResultadoDoAtestado = { ok: true; dados: DadosDoAtestado } | { ok: false; erros: ErrosDoAtestado };

/** `30/09/2026, das 08:00 às 12:00` no mesmo dia; `de 30/09/2026 às 08:00 até 02/10/2026 às 18:00` em dias diferentes. */
export function textoDoPeriodo(inicio: DataHoraISO, fim: DataHoraISO): string {
  const [diaInicio, horaInicio] = inicio.split("T");
  const [diaFim, horaFim] = fim.split("T");
  return diaInicio === diaFim
    ? `${dataBR(diaInicio)}, das ${horaInicio} às ${horaFim}`
    : `de ${dataBR(diaInicio)} às ${horaInicio} até ${dataBR(diaFim)} às ${horaFim}`;
}

/**
 * Confere o formulário e, estando tudo certo, monta o que vai para o papel. O fim tem de ser depois do início; a
 * finalidade fica como foi digitada, cortados só os espaços e as linhas em branco das pontas.
 */
export function prepararAtestado(
  campos: CamposDoAtestado,
  pacientes: readonly Paciente[],
  profissionais: readonly Profissional[],
): ResultadoDoAtestado {
  const { paciente, profissional, erros: escolha } = resolverEscolha(campos.pacienteId, campos.profissionalId, pacientes, profissionais);
  const erros: ErrosDoAtestado = { ...escolha };
  const finalidade = campos.finalidade.trim();

  if (!dataValida(campos.dataInicio)) erros.dataInicio = "Informe a data de início.";
  if (!horaValida(campos.horaInicio)) erros.horaInicio = "Informe a hora de início.";
  if (!dataValida(campos.dataFim)) erros.dataFim = "Informe a data de fim.";
  if (!horaValida(campos.horaFim)) erros.horaFim = "Informe a hora de fim.";

  const inicio = `${campos.dataInicio}T${campos.horaInicio}`;
  const fim = `${campos.dataFim}T${campos.horaFim}`;
  if (!erros.dataInicio && !erros.horaInicio && !erros.dataFim && !erros.horaFim && fim <= inicio) {
    // Mesmo dia: o que está errado é a hora; em dias diferentes, a data.
    erros[campos.dataFim === campos.dataInicio ? "horaFim" : "dataFim"] = "O fim tem de ser depois do início.";
  }

  if (!finalidade) erros.finalidade = "Escreva a finalidade do atestado.";
  else if (finalidade.length > LIMITE_DA_FINALIDADE) erros.finalidade = `Use no máximo ${LIMITE_DA_FINALIDADE} caracteres.`;

  if (!paciente || !profissional || Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: {
      paciente: { nome: paciente.nome },
      profissional: { nome: profissional.nome, cro: profissional.cro },
      periodo: textoDoPeriodo(inicio, fim),
      finalidade,
    },
  };
}
