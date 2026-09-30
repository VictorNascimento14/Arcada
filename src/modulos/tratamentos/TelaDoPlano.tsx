import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { pacientes, planos, procedimentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais } from "@/dominio";
import { Button, GlassCard, PageShell } from "@/ui";

import { detalheDoItem, rotuloItens } from "./exibicao";
import FormularioDoItem from "./FormularioDoItem";
import OrcamentoDoPlano from "./OrcamentoDoPlano";
import { removerItem } from "./planos";
import SituacaoBadge from "./SituacaoBadge";

/** `/planos/:planoId`: os itens do plano de um paciente, o orçamento e a situação. */
export default function TelaDoPlano() {
  const { planoId } = useParams();
  const plano = useColecao(planos).find((p) => p.id === planoId);
  const paciente = useColecao(pacientes).find((p) => p.id === plano?.pacienteId);
  const catalogo = useColecao(procedimentos);
  const [adicionando, setAdicionando] = useState(false);

  if (!plano) {
    return (
      <PageShell titulo="Plano de tratamento">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
          <GlassCard className="p-[26px] text-center">
            <h2 className="text-xl font-bold text-foreground-950">Plano não encontrado</h2>
            <p className="mt-1 text-foreground-500">Este endereço não corresponde a nenhum plano de tratamento.</p>
            <Link
              to="/pacientes"
              className="press mt-5 inline-flex items-center gap-2 rounded-full bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-50 shadow-nav-active transition-colors hover:bg-primary-800"
            >
              Voltar à lista de pacientes
            </Link>
          </GlassCard>
        </main>
      </PageShell>
    );
  }

  const editavel = plano.situacao === "proposto";
  const nomeDe = (procedimentoId: string) => catalogo.find((p) => p.id === procedimentoId)?.nome ?? "Procedimento não encontrado";

  return (
    <PageShell titulo="Plano de tratamento" detalhe={paciente?.nome}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="p-[26px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Itens do plano</h2>
              <p className="mt-1 text-foreground-500">
                {rotuloItens(plano.itens.length)}
                {paciente && (
                  <>
                    {" · "}
                    <Link to={`/pacientes/${paciente.id}`} className="font-medium text-primary-800 hover:underline">
                      Ficha de {paciente.nome}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SituacaoBadge situacao={plano.situacao} />
              {editavel && (
                <Button onClick={() => setAdicionando(true)}>
                  <i className="ri-add-line text-base" aria-hidden="true" />
                  Adicionar item
                </Button>
              )}
            </div>
          </div>

          {!editavel && <p className="mt-3 text-sm text-foreground-500">Só o plano proposto muda de itens e de desconto.</p>}

          {plano.itens.length === 0 ? (
            <p className="mt-6 text-foreground-500">Nenhum item ainda. Adicione o primeiro procedimento.</p>
          ) : (
            <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
              {plano.itens.map((item) => {
                const detalhe = detalheDoItem(item);
                const nome = nomeDe(item.procedimentoId);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground-950">{nome}</p>
                      {detalhe && <p className="text-sm text-foreground-500">{detalhe}</p>}
                    </div>
                    <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(item.preco)}</p>
                    {editavel && (
                      <Button
                        variant="ghost"
                        aria-label={`Remover ${nome}${item.dente === undefined ? "" : `, dente ${item.dente}`}`}
                        onClick={() => removerItem(plano.id, item.id)}
                      >
                        Remover
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {adicionando && <FormularioDoItem planoId={plano.id} aoFechar={() => setAdicionando(false)} />}
        </GlassCard>

        <OrcamentoDoPlano plano={plano} />
      </main>
    </PageShell>
  );
}
