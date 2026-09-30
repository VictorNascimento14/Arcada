import { useId } from "react";
import { Link } from "react-router-dom";

import { pacientes, planos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais } from "@/dominio";
import { AnimatedNumber, StatCard } from "@/ui";

import { resumoEmAberto } from "./resumoEmAberto";

/**
 * Os planos em aberto no painel: os orçamentos à espera da decisão do paciente e os tratamentos aprovados ou em
 * andamento, cada um com a contagem e, embaixo, o valor somado. Só lê as coleções; a conta mora em `resumoEmAberto.ts`.
 */
export default function TratamentosEmAberto() {
  const titulo = useId();
  const todosPlanos = useColecao(planos);
  const todosPacientes = useColecao(pacientes);
  const { orcamentos, tratamentos } = resumoEmAberto(todosPlanos, todosPacientes);

  return (
    <section aria-labelledby={titulo}>
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <h2 id={titulo} className="text-xl font-bold tracking-[-0.01em] text-foreground-950">
          Planos em aberto
        </h2>
        <Link to="/tratamentos" className="shrink-0 text-sm font-semibold text-primary-800 hover:underline">
          Ver os planos
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <StatCard
            className="h-full"
            label="Orçamentos em aberto"
            icon="receipt"
            value={<AnimatedNumber value={orcamentos.quantidade} />}
            foot={
              orcamentos.quantidade === 0
                ? "Nenhum orçamento à espera do paciente"
                : `${formatarReais(orcamentos.valor)} à espera da decisão do paciente`
            }
          />
        </li>
        <li>
          <StatCard
            className="h-full"
            label="Tratamentos em aberto"
            icon="tooth"
            tone="mint"
            value={<AnimatedNumber value={tratamentos.quantidade} />}
            foot={
              tratamentos.quantidade === 0
                ? "Nenhum tratamento aprovado ou em andamento"
                : `${formatarReais(tratamentos.valor)} aprovados ou em andamento`
            }
          />
        </li>
      </ul>
    </section>
  );
}
