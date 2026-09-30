/**
 * O faturamento por semana no painel: o que foi recebido em cada uma das últimas semanas e o tamanho e a cor da barra de
 * cada uma. Regra pura: o dia de hoje vem de fora (`diaISO(new Date())`, no relógio do painel), para o teste escolher o
 * dia. A semana é a da agenda, de segunda a domingo.
 */
import { somarCentavos, type Centavos, type DataISO, type Lancamento } from "@/dominio";
import { inicioDaSemana, somarDias } from "@/modulos/agenda/dias";

/** Quantas semanas o painel mostra: a de hoje e as cinco anteriores. */
export const SEMANAS_NO_PAINEL = 6;

export type SemanaFaturada = {
  /** A segunda-feira. */
  inicio: DataISO;
  /** O domingo. */
  fim: DataISO;
  /** O recebido na semana, em centavos. */
  valor: Centavos;
};

/**
 * As últimas `quantidade` semanas até a de `hoje`, da mais antiga à mais recente (a última é a de hoje, ainda em curso),
 * cada uma com o que foi recebido nela: a soma das parcelas com `pagoEm` de segunda a domingo, seja qual for o
 * vencimento. A parcela em aberto não entra.
 */
export function faturamentoPorSemana(
  lancamentos: readonly Lancamento[],
  hoje: DataISO,
  quantidade = SEMANAS_NO_PAINEL,
): SemanaFaturada[] {
  const primeira = somarDias(inicioDaSemana(hoje), -7 * (quantidade - 1));
  return Array.from({ length: quantidade }, (_, i) => {
    const inicio = somarDias(primeira, 7 * i);
    const fim = somarDias(inicio, 6);
    // As datas são `AAAA-MM-DD`: comparar os textos compara os dias.
    const pagas = lancamentos.filter((l) => l.pagoEm !== undefined && l.pagoEm >= inicio && l.pagoEm <= fim);
    return { inicio, fim, valor: somarCentavos(...pagas.map((l) => l.valor)) };
  });
}

/** O tamanho da barra, de 0 a 100: o valor da semana sobre o da maior. Sem nenhum valor (`maior` 0), 0. */
export const pctDaBarra = (valor: Centavos, maior: Centavos): number => (maior > 0 ? (valor / maior) * 100 : 0);

/**
 * O degrau da escala de cor da barra, de 0 (o mais claro, `primary-500`) a 3 (o mais escuro, `primary-800`), de 25 em
 * 25 por cento: a semana mais forte é a mais escura. A escala para em `primary-500` porque o preenchimento mais claro
 * some no trilho.
 */
export const degrauDaBarra = (pct: number): number => Math.min(3, Math.floor(pct / 25));
