import { lancamentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, type DataISO } from "@/dominio";
import { GlassCard, MeterBar, stagger } from "@/ui";

import { degrauDaBarra, faturamentoPorSemana, pctDaBarra, SEMANAS_NO_PAINEL } from "./porSemana";

// Classes literais: o JIT do Tailwind não gera o que se monta em runtime. Do degrau mais claro ao mais escuro; abaixo de
// `primary-500` o preenchimento some no trilho (invariante 3 do CLAUDE.md do repositório).
const ESCALA = ["bg-primary-500", "bg-primary-600", "bg-primary-700", "bg-primary-800"];

/** O dia e o mês, sem o ano: `28/09`. */
const diaEMes = (dia: DataISO) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

/**
 * O recebido em cada uma das últimas semanas até a de `hoje`, em barras: cada linha tem o período, o valor e a barra,
 * do tamanho do valor sobre o da maior semana. O texto carrega o dado, então a barra fica só como desenho. Só lê
 * `lancamentos`; a conta mora em `porSemana.ts`.
 */
export default function FaturamentoPorSemana({ hoje }: { hoje: DataISO }) {
  const todosLancamentos = useColecao(lancamentos);
  const semanas = faturamentoPorSemana(todosLancamentos, hoje);
  const maior = Math.max(...semanas.map((s) => s.valor));

  return (
    <GlassCard as="section" aria-label="Faturamento por semana" className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Faturamento por semana</h2>
      <p className="mt-1 text-sm text-foreground-500">Últimas {SEMANAS_NO_PAINEL} semanas, de segunda a domingo</p>

      {maior === 0 ? (
        <p className="mt-4 text-foreground-500">
          Nenhuma parcela recebida nas últimas {SEMANAS_NO_PAINEL} semanas. Os valores aparecem aqui quando uma parcela recebe baixa.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {semanas.map((s, i) => {
            const pct = pctDaBarra(s.valor, maior);
            const atual = i === semanas.length - 1;
            return (
              <li key={s.inicio}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className={atual ? "font-semibold text-foreground-950" : "text-foreground-600"}>
                    {diaEMes(s.inicio)} a {diaEMes(s.fim)}
                    {atual && " · esta semana"}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground-950">{formatarReais(s.valor)}</span>
                </div>
                <MeterBar pct={pct} fillClass={ESCALA[degrauDaBarra(pct)]} delay={stagger(i)} className="mt-1.5" />
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
