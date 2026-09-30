import { useMemo } from "react";
import { Link } from "react-router-dom";

import { lancamentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { GlassCard } from "@/ui";

/** A aba "Financeiro" da ficha do paciente: os lançamentos dele, do vencimento mais antigo ao mais novo. */
export default function AbaFinanceiro({ pacienteId }: { pacienteId: string }) {
  const todos = useColecao(lancamentos);
  const doPaciente = useMemo(
    () => todos.filter((l) => l.pacienteId === pacienteId).sort((a, b) => a.vencimento.localeCompare(b.vencimento)),
    [todos, pacienteId],
  );

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Financeiro</h2>
      <p className="mt-1 text-foreground-500">As parcelas dos planos aprovados deste paciente.</p>

      {doPaciente.length === 0 ? (
        <p className="mt-6 text-foreground-500">
          Nenhum lançamento ainda. As parcelas nascem quando um plano aprovado é parcelado, em{" "}
          <Link to="/financeiro" className="font-semibold text-primary-800 underline underline-offset-2">
            Financeiro
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {doPaciente.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground-950">Vence em {dataBR(l.vencimento)}</p>
                <p className="text-sm text-foreground-500">{l.pagoEm ? `Pago em ${dataBR(l.pagoEm)}` : "Em aberto"}</p>
              </div>
              <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(l.valor)}</p>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
