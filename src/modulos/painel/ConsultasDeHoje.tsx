import { useId, useMemo } from "react";
import { Link } from "react-router-dom";

import { consultas, pacientes, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { Consulta, DataHoraISO, SituacaoConsulta } from "@/dominio";
import { ROTULO_DA_SITUACAO } from "@/modulos/agenda/situacao";
import { GlassCard } from "@/ui";

import { consultasDeHoje, proximaConsulta } from "./hoje";

// Classes literais: o JIT do Tailwind não gera o que se monta em runtime.
const COR: Record<SituacaoConsulta, string> = {
  agendada: "bg-secondary-100 text-secondary-800",
  confirmada: "bg-primary-100 text-primary-800",
  "em-atendimento": "bg-accent-100 text-accent-800",
  concluida: "bg-primary-900 text-primary-50",
  faltou: "bg-red-100 text-red-700",
  cancelada: "bg-foreground-950/[0.06] text-foreground-600", // não chega aqui: a cancelada não entra no dia
};

/** A situação da consulta em uma pílula. A cor ajuda; quem diz é o texto. */
function Situacao({ situacao }: { situacao: SituacaoConsulta }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${COR[situacao]}`}>
      {ROTULO_DA_SITUACAO[situacao]}
    </span>
  );
}

const porId = <T extends { id: string }>(itens: readonly T[]) => new Map(itens.map((i) => [i.id, i]));

/**
 * O dia de `agora` no painel: as consultas em ordem de horário, cada uma com a situação, e a próxima em destaque.
 * Paciente ou profissional removido depois da marcação aparece como tal, em vez de a consulta sumir.
 */
export default function ConsultasDeHoje({ agora }: { agora: DataHoraISO }) {
  const rotuloDaProxima = useId();
  const todas = useColecao(consultas);
  const todosPacientes = useColecao(pacientes);
  const todosProfissionais = useColecao(profissionais);
  const doDia = useMemo(() => consultasDeHoje(todas, agora.slice(0, 10)), [todas, agora]);
  const nomeDoPaciente = useMemo(() => porId(todosPacientes), [todosPacientes]);
  const nomeDoProfissional = useMemo(() => porId(todosProfissionais), [todosProfissionais]);
  const proxima = proximaConsulta(doDia, agora);

  const paciente = (c: Consulta) => nomeDoPaciente.get(c.pacienteId)?.nome ?? "Paciente removido";
  const profissional = (c: Consulta) => nomeDoProfissional.get(c.profissionalId)?.nome ?? "Profissional removido";

  return (
    <GlassCard as="section" aria-label="Consultas de hoje" className="p-[26px]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Consultas de hoje</h2>
        <Link to="/agenda" className="shrink-0 text-sm font-semibold text-primary-800 hover:underline">
          Abrir a agenda
        </Link>
      </div>

      {doDia.length === 0 ? (
        <p className="mt-4 text-foreground-500">Nenhuma consulta marcada para hoje. Marque uma na agenda.</p>
      ) : (
        <>
          {proxima ? (
            <div role="group" aria-labelledby={rotuloDaProxima} className="mt-4 rounded-2xl bg-primary-900/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <p id={rotuloDaProxima} className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground-500">
                  Próxima consulta
                </p>
                <Situacao situacao={proxima.situacao} />
              </div>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums text-foreground-950">
                  {proxima.inicio.slice(11)}
                </span>
                <div className="min-w-0 flex-1 break-words">
                  <p className="text-lg font-semibold leading-snug text-foreground-950">{paciente(proxima)}</p>
                  <p className="text-sm text-foreground-500">{profissional(proxima)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground-500">Nenhuma consulta por começar hoje.</p>
          )}

          <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
            {doDia.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="w-14 shrink-0 font-bold tabular-nums text-foreground-950">{c.inicio.slice(11)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground-950">{paciente(c)}</p>
                  <p className="truncate text-sm text-foreground-500">{profissional(c)}</p>
                </div>
                <Situacao situacao={c.situacao} />
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  );
}
