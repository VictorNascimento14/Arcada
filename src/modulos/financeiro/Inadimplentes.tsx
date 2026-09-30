import { useMemo } from "react";

import { lancamentos, pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, somarCentavos } from "@/dominio";
import { Avatar, GlassCard, diaISO } from "@/ui";

import { inadimplentes } from "./inadimplencia";

/** A inadimplência: os pacientes com parcela vencida e sem baixa, do atraso mais antigo ao mais recente, com o total vencido de cada um. */
export default function Inadimplentes() {
  const todosLancamentos = useColecao(lancamentos);
  const todosPacientes = useColecao(pacientes);
  const hoje = diaISO(new Date()); // como nas contas a receber: o dia da última renderização
  const lista = useMemo(() => inadimplentes(todosLancamentos, todosPacientes, hoje), [todosLancamentos, todosPacientes, hoje]);

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Inadimplência</h2>
      <p className="mt-1 text-foreground-500">Pacientes com parcela vencida e sem baixa, do atraso mais antigo ao mais recente.</p>

      {lista.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhum paciente inadimplente.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-foreground-500">
            {lista.length} {lista.length === 1 ? "paciente inadimplente" : "pacientes inadimplentes"}, com{" "}
            {formatarReais(somarCentavos(...lista.map((i) => i.totalVencido)))} vencidos
          </p>
          <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
            {lista.map(({ pacienteId, paciente, parcelas, totalVencido, diasDeAtraso }) => (
              <li key={pacienteId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <div className="flex min-w-0 flex-1 basis-40 items-center gap-3">
                  {paciente && (
                    <span aria-hidden="true">
                      <Avatar nome={paciente.nome} size={40} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground-950">{paciente?.nome ?? "Paciente não encontrado"}</p>
                    <p className="text-sm text-foreground-500">
                      {parcelas} {parcelas === 1 ? "parcela vencida" : "parcelas vencidas"} · {diasDeAtraso} {diasDeAtraso === 1 ? "dia" : "dias"} de atraso
                    </p>
                  </div>
                </div>
                <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(totalVencido)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  );
}
