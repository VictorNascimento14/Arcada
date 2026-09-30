import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { lancamentos, pacientes, planos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais } from "@/dominio";
import { rotuloItens } from "@/modulos/tratamentos/exibicao";
import { total } from "@/modulos/tratamentos/plano";
import SituacaoBadge from "@/modulos/tratamentos/SituacaoBadge";
import { Avatar, Button, GlassCard } from "@/ui";

import { planosParaParcelar } from "./aParcelar";
import FormularioDasParcelas from "./FormularioDasParcelas";

/** Os planos aprovados que esperam as parcelas, cada um com o botão que abre o modal de "Gerar parcelas". */
export default function PlanosSemParcelas() {
  const todosPlanos = useColecao(planos);
  const todosLancamentos = useColecao(lancamentos);
  const todosPacientes = useColecao(pacientes);
  const aParcelar = useMemo(
    () => planosParaParcelar(todosPlanos, todosLancamentos, todosPacientes),
    [todosPlanos, todosLancamentos, todosPacientes],
  );
  const [escolhido, setEscolhido] = useState<string>();
  // Sai da lista assim que ganha as parcelas: o modal some junto, sem estado a limpar.
  const emParcelamento = aParcelar.find(({ plano }) => plano.id === escolhido)?.plano;

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Planos sem parcelas</h2>
      <p className="mt-1 text-foreground-500">Aprovados ou em andamento, esperando as parcelas do orçamento.</p>

      {aParcelar.length === 0 ? (
        <p className="mt-6 text-foreground-500">
          Nenhum plano aguardando parcelas. Aprove um plano em{" "}
          <Link to="/tratamentos" className="font-semibold text-primary-800 underline underline-offset-2">
            Tratamentos
          </Link>{" "}
          e ele aparece aqui.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {aParcelar.map(({ plano, paciente }) => (
            <li key={plano.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <Link to={`/planos/${plano.id}`} className="flex min-w-0 flex-1 basis-40 items-center gap-3 transition-colors hover:bg-primary-900/[0.04]">
                {paciente && (
                  <span aria-hidden="true">
                    <Avatar nome={paciente.nome} size={40} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground-950">{paciente?.nome ?? "Paciente não encontrado"}</p>
                  <p className="text-sm text-foreground-500">{rotuloItens(plano.itens.length)}</p>
                </div>
              </Link>
              <SituacaoBadge situacao={plano.situacao} />
              <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(total(plano))}</p>
              <Button variant="secondary" aria-label={`Gerar parcelas de ${paciente?.nome ?? "paciente não encontrado"}`} onClick={() => setEscolhido(plano.id)}>
                Gerar parcelas
              </Button>
            </li>
          ))}
        </ul>
      )}

      {emParcelamento && <FormularioDasParcelas plano={emParcelamento} aoFechar={() => setEscolhido(undefined)} />}
    </GlassCard>
  );
}
