import { useMemo } from "react";
import { Link } from "react-router-dom";

import { pacientes, planos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, somarCentavos } from "@/dominio";
import { Avatar, GlassCard, PageShell } from "@/ui";

import { planosEmAberto } from "./emAberto";
import { rotuloItens } from "./exibicao";
import { total } from "./plano";
import ProgressoDoPlano from "./ProgressoDoPlano";
import SituacaoBadge from "./SituacaoBadge";

/** `/tratamentos`: os planos em aberto de todos os pacientes, com o paciente, a situação e o total. */
export default function PlanosEmAberto() {
  const todosPlanos = useColecao(planos);
  const todosPacientes = useColecao(pacientes);
  const abertos = useMemo(() => planosEmAberto(todosPlanos, todosPacientes), [todosPlanos, todosPacientes]);
  const soma = somarCentavos(...abertos.map(({ plano }) => total(plano)));

  return (
    <PageShell titulo="Tratamentos" detalhe="Planos em aberto">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="p-[26px]">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Planos em aberto</h2>
          <p className="mt-1 text-foreground-500">Propostos, aprovados e em andamento: o que ainda não terminou nem foi recusado.</p>

          {abertos.length === 0 ? (
            <div className="mt-6">
              <p className="text-foreground-500">Nenhum plano em aberto. Os planos nascem na aba Tratamentos da ficha de cada paciente.</p>
              <Link
                to="/pacientes"
                className="press mt-5 inline-flex items-center gap-2 rounded-full bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-50 shadow-nav-active transition-colors hover:bg-primary-800"
              >
                Ir para os pacientes
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-foreground-500">
                {abertos.length} {abertos.length === 1 ? "plano" : "planos"}, somando {formatarReais(soma)}
              </p>
              <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
                {abertos.map(({ plano, paciente }) => (
                  <li key={plano.id}>
                    <Link to={`/planos/${plano.id}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-primary-900/[0.04]">
                      {paciente && (
                        <span aria-hidden="true">
                          <Avatar nome={paciente.nome} size={40} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground-950">{paciente?.nome ?? "Paciente não encontrado"}</p>
                        <p className="text-sm text-foreground-500">{rotuloItens(plano.itens.length)}</p>
                        <ProgressoDoPlano plano={plano} className="mt-1.5 max-w-xs" />
                      </div>
                      <SituacaoBadge situacao={plano.situacao} />
                      <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(total(plano))}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </GlassCard>
      </main>
    </PageShell>
  );
}
