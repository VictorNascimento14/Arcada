import { useId } from "react";

import { consultas, lancamentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, type DataISO } from "@/dominio";
import { AnimatedNumber, StatCard } from "@/ui";

import { consultasDoMes, faturamentoRecebido, mesDe, taxaDeFaltas } from "./indicadores";

const percentual = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

/**
 * Os indicadores do mês de `hoje`: o faturamento recebido, as consultas e a taxa de faltas, cada um num cartão. Só lê
 * as coleções; a regra de cada número mora em `indicadores.ts`.
 */
export default function IndicadoresDoMes({ hoje }: { hoje: DataISO }) {
  const titulo = useId();
  const mes = mesDe(hoje);
  const todosLancamentos = useColecao(lancamentos);
  const todasConsultas = useColecao(consultas);
  const recebido = faturamentoRecebido(todosLancamentos, mes);
  const total = consultasDoMes(todasConsultas, mes);
  const faltas = taxaDeFaltas(todasConsultas, mes);
  const nomeDoMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-labelledby={titulo}>
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <h2 id={titulo} className="text-xl font-bold tracking-[-0.01em] text-foreground-950">
          Indicadores do mês
        </h2>
        <span className="text-sm font-medium text-foreground-500 first-letter:uppercase">{nomeDoMes}</span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <StatCard
            className="h-full"
            label="Faturamento recebido"
            icon="coin"
            compact
            value={<AnimatedNumber value={recebido} format={(n) => formatarReais(Math.round(n))} />}
            foot="Parcelas pagas no mês"
          />
        </li>
        <li>
          <StatCard
            className="h-full"
            label="Consultas no mês"
            icon="calendar"
            tone="mint"
            value={<AnimatedNumber value={total} />}
            foot="Sem as canceladas"
          />
        </li>
        <li>
          <StatCard
            className="h-full"
            label="Taxa de faltas"
            icon="chart"
            tone="amber"
            value={
              faltas === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Sem dados</span>
                </>
              ) : (
                <AnimatedNumber value={faltas} format={percentual.format} />
              )
            }
            foot={faltas === null ? "Nenhuma consulta concluída ou com falta no mês" : "Faltas ÷ (concluídas + faltas)"}
          />
        </li>
      </ul>
    </section>
  );
}
