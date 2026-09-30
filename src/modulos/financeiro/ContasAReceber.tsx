import { useMemo } from "react";

import { lancamentos, pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, somarCentavos } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Avatar, GlassCard, diaISO } from "@/ui";

import { contasAReceber } from "./contasAReceber";
import SituacaoDaParcelaBadge from "./SituacaoDaParcelaBadge";

/** As contas a receber: as parcelas de todos os pacientes, com a situação de hoje. As em aberto vêm primeiro. */
export default function ContasAReceber() {
  const todosLancamentos = useColecao(lancamentos);
  const todosPacientes = useColecao(pacientes);
  // ponytail: o dia é o da última renderização; a tela aberta na virada da meia-noite só corrige a situação ao se redesenhar. Se pesar, um relógio que renove ao virar o dia.
  const hoje = diaISO(new Date());
  const contas = useMemo(() => contasAReceber(todosLancamentos, todosPacientes, hoje), [todosLancamentos, todosPacientes, hoje]);
  const emAberto = contas.filter((c) => c.situacao !== "paga");

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Contas a receber</h2>
      <p className="mt-1 text-foreground-500">As parcelas dos planos aprovados, pelo vencimento: as em aberto primeiro e as pagas no fim.</p>

      {contas.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhuma parcela ainda. Elas nascem quando um plano aprovado é parcelado, em Planos sem parcelas.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-foreground-500">
            {emAberto.length === 0
              ? "Nenhuma parcela em aberto."
              : `${emAberto.length} ${emAberto.length === 1 ? "parcela" : "parcelas"} em aberto, somando ${formatarReais(somarCentavos(...emAberto.map((c) => c.lancamento.valor)))}`}
          </p>
          <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
            {contas.map(({ lancamento: l, paciente, situacao }) => (
              <li key={l.id} className="flex items-center gap-3 py-3">
                {paciente && (
                  <span aria-hidden="true">
                    <Avatar nome={paciente.nome} size={40} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground-950">{paciente?.nome ?? "Paciente não encontrado"}</p>
                  <p className="text-sm text-foreground-500">
                    Vencimento em {dataBR(l.vencimento)}
                    {l.pagoEm && ` · pago em ${dataBR(l.pagoEm)}`}
                  </p>
                </div>
                <SituacaoDaParcelaBadge situacao={situacao} />
                <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(l.valor)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  );
}
