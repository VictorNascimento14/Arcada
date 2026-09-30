/**
 * Horários livres de um dia da agenda. A clínica atende nas faixas do expediente do dia da semana
 * (o intervalo de almoço é o vão entre duas faixas) e uma consulta só começa de 15 em 15 minutos,
 * contados a partir da abertura de cada faixa. Regra pura, sem tela.
 *
 * Feriado não entra aqui: bloquear o dia é de `feriadoDoDia` (`feriados.ts`), e quem marca a consulta
 * decide o que fazer com o ponto facultativo. O dia da semana sai por `Date.UTC`, sem fuso.
 */
import type { Consulta, DataISO, DiaDaSemana, Expediente, HoraISO } from "@/dominio";

/** De quanto em quanto tempo uma consulta pode começar. */
const PASSO_MIN = 15;

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;

export const emMinutos = (hora: HoraISO) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

export const emHora = (min: number): HoraISO =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** O dia da semana de `dia` (`AAAA-MM-DD`), sem fuso: 0 é domingo. */
export const diaDaSemana = (dia: DataISO): DiaDaSemana =>
  new Date(Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)))).getUTCDay() as DiaDaSemana;

/**
 * Os inícios livres (`HH:mm`, em ordem) de uma consulta de `duracaoMin` minutos em `dia`
 * (`AAAA-MM-DD`). Um início é livre se a consulta cabe inteira numa faixa do expediente — sem
 * atravessar o intervalo de almoço nem passar do fechamento — e não se sobrepõe a nenhuma consulta
 * de `consultas` (encostar não sobrepõe). Só a cancelada não ocupa; as de outros dias são ignoradas.
 *
 * `consultas` são as que ocupam quem vai atender: as da cadeira e as do profissional escolhidos, e
 * quem chama filtra. Ao remarcar, tire a própria consulta da lista. Dia fechado, `dia` mal formado e
 * duração que não é um número positivo devolvem `[]`.
 */
export function horariosLivres(
  expediente: Expediente,
  dia: DataISO,
  consultas: readonly Consulta[],
  duracaoMin: number,
): HoraISO[] {
  if (!FORMATO_DIA.test(dia) || !(duracaoMin > 0)) return [];

  // ponytail: a consulta que passa da meia-noite não ocupa o dia seguinte, e o expediente também não
  // cruza a meia-noite. Com plantão noturno, comparar em minutos corridos por `Date.UTC`.
  const ocupadas = consultas.flatMap((c) => {
    if (c.situacao === "cancelada" || !c.inicio.startsWith(dia)) return [];
    const de = emMinutos(c.inicio.slice(11));
    return [{ de, ate: de + c.duracaoMin }];
  });

  const livres: HoraISO[] = [];
  for (const faixa of expediente[diaDaSemana(dia)]) {
    const fechamento = emMinutos(faixa.fim);
    for (let inicio = emMinutos(faixa.inicio); inicio + duracaoMin <= fechamento; inicio += PASSO_MIN) {
      const fim = inicio + duracaoMin;
      if (!ocupadas.some((o) => inicio < o.ate && o.de < fim)) livres.push(emHora(inicio));
    }
  }
  return livres.sort();
}
