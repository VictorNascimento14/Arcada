import { useMemo } from "react";
import { Link } from "react-router-dom";

import { lancamentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { GlassCard, diaISO } from "@/ui";

import BaixaDaParcela from "./BaixaDaParcela";
import { ROTULO_DA_FORMA } from "./formas";
import { situacaoDaParcela } from "./situacao";
import SituacaoDaParcelaBadge from "./SituacaoDaParcelaBadge";

/** A aba "Financeiro" da ficha do paciente: os lançamentos dele, do vencimento mais antigo ao mais novo, com a situação de hoje. */
export default function AbaFinanceiro({ pacienteId }: { pacienteId: string }) {
  const todos = useColecao(lancamentos);
  const doPaciente = useMemo(
    () => todos.filter((l) => l.pacienteId === pacienteId).sort((a, b) => a.vencimento.localeCompare(b.vencimento)),
    [todos, pacienteId],
  );
  const hoje = diaISO(new Date());

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
            <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-semibold text-foreground-950">Vencimento em {dataBR(l.vencimento)}</p>
                {l.pagoEm && (
                  <p className="text-sm text-foreground-500">
                    Pago em {dataBR(l.pagoEm)}
                    {l.forma && ` · ${ROTULO_DA_FORMA[l.forma]}`}
                  </p>
                )}
              </div>
              <SituacaoDaParcelaBadge situacao={situacaoDaParcela(l, hoje)} />
              <p className="font-semibold tabular-nums text-foreground-950">{formatarReais(l.valor)}</p>
              {l.pagoEm === undefined && <BaixaDaParcela parcela={l} />}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
