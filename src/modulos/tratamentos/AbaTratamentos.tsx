import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { planos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais } from "@/dominio";
import { Button, GlassCard } from "@/ui";

import { rotuloItens } from "./exibicao";
import { total } from "./plano";
import { criarPlano } from "./planos";
import SituacaoBadge from "./SituacaoBadge";

/** A aba "Tratamentos" da ficha do paciente: os planos dele e o atalho para abrir um novo. */
export default function AbaTratamentos({ pacienteId }: { pacienteId: string }) {
  const todos = useColecao(planos);
  const doPaciente = useMemo(() => todos.filter((p) => p.pacienteId === pacienteId), [todos, pacienteId]);
  const navigate = useNavigate();

  return (
    <GlassCard className="p-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Planos de tratamento</h2>
          <p className="mt-1 text-foreground-500">O que foi proposto a este paciente, com o orçamento de cada plano.</p>
        </div>
        <Button onClick={() => navigate(`/planos/${criarPlano(pacienteId).id}`)}>
          <i className="ri-add-line text-base" aria-hidden="true" />
          Novo plano
        </Button>
      </div>

      {doPaciente.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhum plano de tratamento ainda.</p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {doPaciente.map((plano, i) => (
            <li key={plano.id}>
              <Link to={`/planos/${plano.id}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-primary-900/[0.04]">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground-950">Plano {i + 1}</p>
                  <p className="text-sm text-foreground-500">{rotuloItens(plano.itens.length)}</p>
                </div>
                <SituacaoBadge situacao={plano.situacao} />
                <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(total(plano))}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
