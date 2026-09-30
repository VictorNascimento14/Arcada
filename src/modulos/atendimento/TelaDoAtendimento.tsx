import { Link, useParams } from "react-router-dom";

import { consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { rotuloDoDia } from "@/modulos/agenda/dias";
import { podeTransitar, ROTULO_DA_SITUACAO } from "@/modulos/agenda/situacao";
import { GlassCard, PageShell } from "@/ui";

import BotaoIniciarAtendimento from "./BotaoIniciarAtendimento";
import { faixaDeHoras } from "./consultas";
import ProcedimentosRealizados from "./ProcedimentosRealizados";

/**
 * `/atendimento/:consultaId`: a consulta que está sendo atendida. Abrir o endereço não muda a situação: só o
 * botão "Iniciar atendimento" muda, para que recarregar a página nunca inicie nada sozinho. Com a consulta em
 * atendimento, a tela também registra os procedimentos realizados.
 */
export default function TelaDoAtendimento() {
  const { consultaId } = useParams();
  const consulta = useColecao(consultas).find((c) => c.id === consultaId);
  const paciente = useColecao(pacientes).find((p) => p.id === consulta?.pacienteId);
  const profissional = useColecao(profissionais).find((p) => p.id === consulta?.profissionalId);
  const procedimento = useColecao(procedimentos).find((p) => p.id === consulta?.procedimentoId);

  if (!consulta) {
    return (
      <PageShell titulo="Atendimento">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
          <GlassCard className="p-[26px] text-center">
            <h2 className="text-xl font-bold text-foreground-950">Atendimento não encontrado</h2>
            <p className="mt-1 text-foreground-500">Este endereço não corresponde a nenhuma consulta.</p>
            <Link
              to="/agenda"
              className="press mt-5 inline-flex items-center gap-2 rounded-full bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-50 shadow-nav-active transition-colors hover:bg-primary-800"
            >
              Voltar à agenda
            </Link>
          </GlassCard>
        </main>
      </PageShell>
    );
  }

  const podeIniciar = podeTransitar(consulta.situacao, "em-atendimento");
  const campos = [
    { rotulo: "Quando", valor: `${rotuloDoDia(consulta.inicio.slice(0, 10))}, ${faixaDeHoras(consulta)}`, largo: true },
    { rotulo: "Profissional", valor: profissional?.nome ?? "Profissional removido" },
    { rotulo: "Procedimento previsto", valor: procedimento?.nome ?? "Sem procedimento definido" },
    { rotulo: "Situação", valor: ROTULO_DA_SITUACAO[consulta.situacao] },
  ];

  return (
    <PageShell titulo="Atendimento" detalhe={paciente?.nome}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="p-[26px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Consulta</h2>
              <p className="mt-1 text-foreground-500">
                {paciente ? (
                  <Link to={`/pacientes/${paciente.id}`} className="font-medium text-primary-800 hover:underline">
                    Ficha de {paciente.nome}
                  </Link>
                ) : (
                  "Paciente removido"
                )}
              </p>
            </div>
            {podeIniciar && <BotaoIniciarAtendimento consultaId={consulta.id} />}
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {campos.map(({ rotulo, valor, largo }) => (
              <div key={rotulo} className={largo ? "sm:col-span-2" : ""}>
                <dt className="text-sm font-medium text-foreground-500">{rotulo}</dt>
                <dd className="mt-0.5 text-foreground-950">{valor}</dd>
              </div>
            ))}
          </dl>

          {podeIniciar && <p className="mt-5 text-sm text-foreground-500">O atendimento ainda não começou.</p>}
        </GlassCard>

        {consulta.situacao === "em-atendimento" && <ProcedimentosRealizados pacienteId={consulta.pacienteId} />}
      </main>
    </PageShell>
  );
}
