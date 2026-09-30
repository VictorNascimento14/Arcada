/**
 * Marcar consulta: o que o formulário edita, o que se confere na agenda e a gravação.
 *
 * Duas coisas barram a marcação: o **feriado** nacional e o **conflito** (a cadeira ou o profissional já têm
 * consulta que se sobrepõe). O **ponto facultativo** só avisa: quem decide se a clínica abre é a clínica. A tela
 * mostra isso ao vivo, e `marcarConsulta` confere de novo na hora de gravar: a validação da tela é conforto,
 * a desta função é a regra.
 *
 * ponytail: não confere se o horário cai dentro do expediente (a grade do dia cresce para caber consulta fora
 * dele, e a clínica às vezes encaixa) nem se a data já passou. O formulário sugere só horários livres do expediente.
 */
import { cadeiras, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import { cadeiraAtiva, profissionalAtivo, type Consulta, type DataISO, type Expediente, type HoraISO } from "@/dominio";

import { conflitosDaConsulta, type Conflito } from "./conflitos";
import { somarDias } from "./dias";
import { feriadoDoDia, type Feriado } from "./feriados";
import { emHora, emMinutos, horariosLivres } from "./horarios";

export const DURACAO_MIN = 5;
export const DURACAO_MAX = 480;
export const DURACAO_PADRAO = 30;

/** O que o formulário edita, como foi digitado: tudo texto, e `""` é o campo ainda vazio. */
export type CamposDaMarcacao = {
  pacienteId: string;
  profissionalId: string;
  cadeiraId: string;
  /** `""`: consulta sem procedimento definido. */
  procedimentoId: string;
  dia: DataISO;
  hora: HoraISO;
  duracaoMin: string;
};
export type ErrosDaMarcacao = Partial<Record<keyof CamposDaMarcacao, string>>;

/** O formulário de uma marcação nova, no `dia` que a agenda está mostrando. */
export const camposDaMarcacao = (dia: DataISO): CamposDaMarcacao => ({
  pacienteId: "",
  profissionalId: "",
  cadeiraId: "",
  procedimentoId: "",
  dia,
  hora: "",
  duracaoMin: String(DURACAO_PADRAO),
});

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Data que existe no calendário: `2026-02-30` passa no formato e volta como `2026-03-02`. */
const diaValido = (dia: string) => FORMATO_DIA.test(dia) && somarDias(dia, 0) === dia;

/** Os minutos da duração, ou `null` se o texto não é um inteiro de `DURACAO_MIN` a `DURACAO_MAX`. */
function duracaoDe(texto: string): number | null {
  const n = Number(texto);
  return /^\d{1,3}$/.test(texto.trim()) && n >= DURACAO_MIN && n <= DURACAO_MAX ? n : null;
}

/** Uma mensagem por campo mal preenchido; objeto vazio quando dá para seguir para a checagem da agenda. */
export function validarMarcacao(c: CamposDaMarcacao): ErrosDaMarcacao {
  const erros: ErrosDaMarcacao = {};
  if (!c.pacienteId) erros.pacienteId = "Escolha o paciente.";
  if (!c.profissionalId) erros.profissionalId = "Escolha o profissional.";
  if (!c.cadeiraId) erros.cadeiraId = "Escolha a cadeira.";
  if (!diaValido(c.dia)) erros.dia = "Informe a data.";
  if (!FORMATO_HORA.test(c.hora)) erros.hora = "Informe o horário de início.";
  const duracao = duracaoDe(c.duracaoMin);
  if (duracao === null) erros.duracaoMin = `Informe a duração em minutos, de ${DURACAO_MIN} a ${DURACAO_MAX}.`;
  else if (!erros.hora && emMinutos(c.hora) + duracao > 24 * 60) erros.duracaoMin = "A consulta não pode passar da meia-noite.";
  return erros;
}

export type Bloqueio = { tipo: "feriado"; feriado: Feriado } | { tipo: "conflito"; conflito: Conflito };

/**
 * O que a agenda diz sobre a marcação: `bloqueios` a impedem (feriado, conflito) e `aviso` só chama a atenção
 * (ponto facultativo). Tolera o formulário pela metade: o feriado sai assim que há uma data, e o conflito, só
 * quando há cadeira, profissional, data, início e duração.
 */
export function restricoesDaAgenda(
  c: CamposDaMarcacao,
  todas: readonly Consulta[],
): { bloqueios: Bloqueio[]; aviso?: Feriado } {
  const bloqueios: Bloqueio[] = [];
  const feriado = diaValido(c.dia) ? feriadoDoDia(c.dia) : undefined;
  if (feriado?.tipo === "feriado") bloqueios.push({ tipo: "feriado", feriado });

  const duracaoMin = duracaoDe(c.duracaoMin);
  if (diaValido(c.dia) && FORMATO_HORA.test(c.hora) && duracaoMin !== null && c.cadeiraId && c.profissionalId) {
    const candidata = { cadeiraId: c.cadeiraId, profissionalId: c.profissionalId, inicio: `${c.dia}T${c.hora}`, duracaoMin };
    for (const conflito of conflitosDaConsulta(candidata, todas)) bloqueios.push({ tipo: "conflito", conflito });
  }
  return { bloqueios, aviso: feriado?.tipo === "facultativo" ? feriado : undefined };
}

/**
 * Os inícios livres do dia para essa duração, olhando a cadeira e o profissional já escolhidos (com só um
 * deles, só ele conta). Vazio quando falta a data, a duração ou os dois, e no dia de feriado.
 */
export function horariosSugeridos(c: CamposDaMarcacao, todas: readonly Consulta[], expediente: Expediente): HoraISO[] {
  const duracaoMin = duracaoDe(c.duracaoMin);
  if (!diaValido(c.dia) || duracaoMin === null || (!c.cadeiraId && !c.profissionalId)) return [];
  if (feriadoDoDia(c.dia)?.tipo === "feriado") return [];
  const ocupam = todas.filter(
    (x) => (c.cadeiraId !== "" && x.cadeiraId === c.cadeiraId) || (c.profissionalId !== "" && x.profissionalId === c.profissionalId),
  );
  return horariosLivres(expediente, c.dia, ocupam, duracaoMin);
}

/** As frases da tela: quem colidiu, chamado pelo nome. `paciente` é o da consulta que já estava lá. */
export type Nomes = { cadeira: string; profissional: string; paciente: string };

const faixaDa = (c: Consulta) => `das ${c.inicio.slice(11)} às ${emHora(emMinutos(c.inicio.slice(11)) + c.duracaoMin)}`;

export function textoDoBloqueio(b: Bloqueio, nomes: Nomes): string {
  if (b.tipo === "feriado") {
    return `${b.feriado.nome} é feriado nacional. A agenda não marca consulta nesse dia: escolha outra data.`;
  }
  const { consulta, motivos } = b.conflito;
  const quem = motivos.includes("cadeira")
    ? motivos.includes("profissional")
      ? `${nomes.cadeira} e ${nomes.profissional} já têm`
      : `${nomes.cadeira} já tem`
    : `${nomes.profissional} já tem`;
  return `${quem} consulta ${faixaDa(consulta)} (${nomes.paciente}). Escolha outro horário.`;
}

export const textoDoAviso = (f: Feriado) => `${f.nome} é ponto facultativo. Confirme se a clínica abre nesse dia antes de marcar.`;

export type ResultadoDaMarcacao =
  | { ok: true; consulta: Consulta }
  | { ok: false; erros: ErrosDaMarcacao; bloqueios: Bloqueio[] };

/**
 * Valida, confere a agenda e grava a consulta como `agendada`. Sem gravar, devolve os erros de preenchimento
 * ou os bloqueios. O formulário só oferece quem existe e está ativo; aqui isso se confere de novo.
 */
export function marcarConsulta(c: CamposDaMarcacao): ResultadoDaMarcacao {
  const erros = validarMarcacao(c);
  if (!erros.pacienteId && !pacientes.obter(c.pacienteId)) erros.pacienteId = "Escolha o paciente.";
  const prof = profissionais.obter(c.profissionalId);
  if (!erros.profissionalId && !(prof && profissionalAtivo(prof))) erros.profissionalId = "Escolha um profissional ativo.";
  const cadeira = cadeiras.obter(c.cadeiraId);
  if (!erros.cadeiraId && !(cadeira && cadeiraAtiva(cadeira))) erros.cadeiraId = "Escolha uma cadeira ativa.";
  if (c.procedimentoId && !procedimentos.obter(c.procedimentoId)?.ativo) erros.procedimentoId = "Escolha um procedimento ativo.";
  if (Object.keys(erros).length > 0) return { ok: false, erros, bloqueios: [] };

  const { bloqueios } = restricoesDaAgenda(c, consultas.listar());
  if (bloqueios.length > 0) return { ok: false, erros, bloqueios };

  const consulta: Consulta = {
    id: novoId(),
    pacienteId: c.pacienteId,
    profissionalId: c.profissionalId,
    cadeiraId: c.cadeiraId,
    inicio: `${c.dia}T${c.hora}`,
    duracaoMin: Number(c.duracaoMin),
    situacao: "agendada",
    ...(c.procedimentoId ? { procedimentoId: c.procedimentoId } : {}),
  };
  consultas.salvar(consulta);
  return { ok: true, consulta };
}
