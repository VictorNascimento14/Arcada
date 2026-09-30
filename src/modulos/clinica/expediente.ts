/**
 * O expediente da clínica, editado por dia da semana: abertura, fechamento e um intervalo opcional (o
 * almoço), em `HH:mm`. Grava o `Expediente` que a agenda lê: lista vazia é dia fechado, uma faixa é o dia
 * corrido e duas faixas dão o intervalo entre elas.
 *
 * ponytail: um intervalo por dia. Um expediente com três faixas ou mais (não sai deste formulário) abre com
 * a primeira abertura, o último fechamento e o vão entre as duas primeiras faixas; salvar regrava com uma
 * pausa só. Se a clínica precisar de mais pausas, o intervalo vira uma lista de faixas.
 */
import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { DiaDaSemana, Expediente, FaixaHoraria } from "@/dominio";

/** Segunda a domingo, na ordem em que a clínica os lê. O número é o de `Date.getDay()`, que a agenda usa. */
export const DIAS: readonly { dia: DiaDaSemana; nome: string }[] = [
  { dia: 1, nome: "Segunda-feira" },
  { dia: 2, nome: "Terça-feira" },
  { dia: 3, nome: "Quarta-feira" },
  { dia: 4, nome: "Quinta-feira" },
  { dia: 5, nome: "Sexta-feira" },
  { dia: 6, nome: "Sábado" },
  { dia: 0, nome: "Domingo" },
];

/** O que o formulário edita num dia: horários como foram digitados. Sem intervalo, os dois campos dele são `""`. */
export type CamposDoDia = { aberto: boolean; abertura: string; fechamento: string; intervaloInicio: string; intervaloFim: string };
export type CamposDoExpediente = Record<DiaDaSemana, CamposDoDia>;
export type ErrosDoDia = { abertura?: string; fechamento?: string; intervalo?: string };
/** Só os dias com erro entram: objeto vazio quando está tudo certo. */
export type ErrosDoExpediente = Partial<Record<DiaDaSemana, ErrosDoDia>>;

/** Dia fechado guarda um horário sugerido: ao marcá-lo como aberto, a pessoa ajusta em vez de digitar do zero. */
const DIA_FECHADO: CamposDoDia = { aberto: false, abertura: "08:00", fechamento: "18:00", intervaloInicio: "", intervaloFim: "" };

function camposDoDia(faixas: readonly FaixaHoraria[]): CamposDoDia {
  if (faixas.length === 0) return DIA_FECHADO;
  const f = [...faixas].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pausa = f.length > 1;
  return {
    aberto: true,
    abertura: f[0].inicio,
    fechamento: f[f.length - 1].fim,
    intervaloInicio: pausa ? f[0].fim : "",
    intervaloFim: pausa ? f[1].inicio : "",
  };
}

/** Os campos como o formulário os mostra; sem clínica ainda, a semana toda fechada. */
export function camposDoExpediente(e?: Expediente): CamposDoExpediente {
  const campos = {} as CamposDoExpediente;
  for (const { dia } of DIAS) campos[dia] = camposDoDia(e?.[dia] ?? []);
  return campos;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Os erros de um dia. Dia fechado não tem o que validar. O fechamento vem depois da abertura, e o
 * intervalo — os dois campos ou nenhum — cai estritamente dentro do dia e termina depois de começar
 * (encostar na abertura ou no fechamento deixaria uma faixa vazia). `HH:mm` com zero à esquerda ordena como
 * texto, então as comparações são de string.
 */
export function validarDia(d: CamposDoDia): ErrosDoDia {
  const erros: ErrosDoDia = {};
  if (!d.aberto) return erros;
  const { abertura, fechamento, intervaloInicio: de, intervaloFim: ate } = d;
  if (!HORA.test(abertura)) erros.abertura = "Informe a hora no formato HH:mm.";
  if (!HORA.test(fechamento)) erros.fechamento = "Informe a hora no formato HH:mm.";
  else if (!erros.abertura && fechamento <= abertura) erros.fechamento = "Deve ser depois da abertura.";
  if (de || ate) {
    if (!HORA.test(de) || !HORA.test(ate)) erros.intervalo = "Informe o início e o fim do intervalo, ou deixe os dois em branco.";
    else if (ate <= de) erros.intervalo = "O fim do intervalo deve ser depois do início.";
    else if (!erros.abertura && !erros.fechamento && (de <= abertura || ate >= fechamento)) {
      erros.intervalo = "O intervalo deve ficar dentro do horário de atendimento.";
    }
  }
  return erros;
}

/** Uma entrada por dia com erro; objeto vazio quando está tudo certo. */
export function validarExpediente(campos: CamposDoExpediente): ErrosDoExpediente {
  const erros: ErrosDoExpediente = {};
  for (const { dia } of DIAS) {
    const doDia = validarDia(campos[dia]);
    if (Object.keys(doDia).length > 0) erros[dia] = doDia;
  }
  return erros;
}

function faixasDoDia({ aberto, abertura, fechamento, intervaloInicio: de, intervaloFim: ate }: CamposDoDia): FaixaHoraria[] {
  if (!aberto) return [];
  return de ? [{ inicio: abertura, fim: de }, { inicio: ate, fim: fechamento }] : [{ inicio: abertura, fim: fechamento }];
}

/** Os campos, já validados, como o `Expediente` que a agenda lê. */
function paraExpediente(campos: CamposDoExpediente): Expediente {
  const expediente = {} as Expediente;
  for (const { dia } of DIAS) expediente[dia] = faixasDoDia(campos[dia]);
  return expediente;
}

/**
 * Valida e grava o expediente — a validação da tela é conforto, esta é a regra. Devolve os erros por dia;
 * objeto vazio quer dizer que salvou. O resto do registro da clínica não é tocado.
 */
export function salvarExpediente(campos: CamposDoExpediente): ErrosDoExpediente {
  const erros = validarExpediente(campos);
  if (Object.keys(erros).length > 0) return erros;
  const expediente = paraExpediente(campos);
  // Sem registro (nunca semeado), cria como `salvarDadosDaClinica`: o nome se preenche no cartão de dados.
  const atual = clinica.obter(CLINICA_ID) ?? { id: CLINICA_ID, nome: "", expediente };
  clinica.salvar({ ...atual, expediente });
  return {};
}
